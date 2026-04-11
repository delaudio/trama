import { invoke } from '@tauri-apps/api/core'
import { createDefaultProject } from './project-defaults.ts'
import type {
  MoodboardImportPayload,
  MoodboardItem,
  Project,
  ProjectSummary,
  WorkflowTemplate,
} from '../types/project.ts'

const STORAGE_KEY = 'trama.projects.v1'

type ProjectRepository = {
  listProjects: () => Promise<ProjectSummary[]>
  loadProject: (projectId: string) => Promise<Project>
  createProject: (name: string, template?: WorkflowTemplate) => Promise<Project>
  saveProject: (project: Project) => Promise<Project>
  renameProject: (projectId: string, name: string) => Promise<Project>
  deleteProject: (projectId: string) => Promise<void>
  importMoodboardImages: (projectId: string, files: File[]) => Promise<Project>
  updateMoodboardItem: (projectId: string, item: MoodboardItem) => Promise<Project>
  deleteMoodboardItem: (projectId: string, moodboardItemId: string) => Promise<Project>
}

const webRepository: ProjectRepository = {
  async listProjects() {
    return loadWebProjects().map(toProjectSummary)
  },
  async loadProject(projectId) {
    const projects = loadWebProjects()
    const project = projects.find((item) => item.id === projectId)

    if (!project) {
      throw new Error(`Project ${projectId} not found`)
    }

    return project
  },
  async createProject(name, template = 'beauty-campaign') {
    const projects = loadWebProjects()
    const project = createDefaultProject(name, template)
    projects.unshift(project)
    saveWebProjects(projects)
    return project
  },
  async saveProject(project) {
    const projects = loadWebProjects()
    const nextProject = {
      ...project,
      moodboardCount: project.moodboard.length,
      updatedAt: new Date().toISOString(),
    }
    const index = projects.findIndex((item) => item.id === project.id)

    if (index >= 0) {
      projects[index] = nextProject
    } else {
      projects.unshift(nextProject)
    }

    saveWebProjects(projects)
    return nextProject
  },
  async renameProject(projectId, name) {
    const projects = loadWebProjects()
    const index = projects.findIndex((item) => item.id === projectId)

    if (index < 0) {
      throw new Error(`Project ${projectId} not found`)
    }

    projects[index] = {
      ...projects[index],
      name,
      updatedAt: new Date().toISOString(),
    }

    saveWebProjects(projects)
    return projects[index]
  },
  async deleteProject(projectId) {
    const projects = loadWebProjects().filter((item) => item.id !== projectId)
    saveWebProjects(projects)
  },
  async importMoodboardImages(projectId, files) {
    const projects = loadWebProjects()
    const index = projects.findIndex((item) => item.id === projectId)

    if (index < 0) {
      throw new Error(`Project ${projectId} not found`)
    }

    const importedItems = await Promise.all(
      files.map(async (file) => ({
        id: createItemId(),
        filename: file.name,
        path: await readFileAsDataUrl(file),
        title: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
        note: '',
        createdAt: new Date().toISOString(),
      })),
    )

    projects[index] = withProjectMetadata({
      ...projects[index],
      moodboard: [...importedItems, ...projects[index].moodboard],
    })

    saveWebProjects(projects)
    return projects[index]
  },
  async updateMoodboardItem(projectId, item) {
    const projects = loadWebProjects()
    const index = projects.findIndex((project) => project.id === projectId)

    if (index < 0) {
      throw new Error(`Project ${projectId} not found`)
    }

    projects[index] = withProjectMetadata({
      ...projects[index],
      moodboard: projects[index].moodboard.map((entry) => (entry.id === item.id ? item : entry)),
    })

    saveWebProjects(projects)
    return projects[index]
  },
  async deleteMoodboardItem(projectId, moodboardItemId) {
    const projects = loadWebProjects()
    const index = projects.findIndex((project) => project.id === projectId)

    if (index < 0) {
      throw new Error(`Project ${projectId} not found`)
    }

    projects[index] = withProjectMetadata({
      ...projects[index],
      moodboard: projects[index].moodboard.filter((item) => item.id !== moodboardItemId),
    })

    saveWebProjects(projects)
    return projects[index]
  },
}

const tauriRepository: ProjectRepository = {
  listProjects: () => invoke<ProjectSummary[]>('list_projects'),
  loadProject: (projectId) => invoke<Project>('load_project', { projectId }),
  createProject: (name, template = 'beauty-campaign') =>
    invoke<Project>('create_project', { name, template }),
  saveProject: (project) => invoke<Project>('save_project', { project }),
  renameProject: (projectId, name) =>
    invoke<Project>('rename_project', { projectId, name }),
  deleteProject: (projectId) => invoke<void>('delete_project', { projectId }),
  importMoodboardImages: async (projectId, files) =>
    invoke<Project>('import_moodboard_images', {
      projectId,
      files: await Promise.all(files.map(toMoodboardImportPayload)),
    }),
  updateMoodboardItem: (projectId, item) =>
    invoke<Project>('update_moodboard_item', { projectId, item }),
  deleteMoodboardItem: (projectId, moodboardItemId) =>
    invoke<Project>('delete_moodboard_item', { projectId, moodboardItemId }),
}

export const webProjectRepository = webRepository
export const projectRepository = isTauri() ? tauriRepository : webRepository

function isTauri() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

function loadWebProjects() {
  if (typeof localStorage === 'undefined') {
    return []
  }

  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return []
  }

  try {
    return JSON.parse(raw) as Project[]
  } catch {
    return []
  }
}

function saveWebProjects(projects: Project[]) {
  if (typeof localStorage === 'undefined') {
    return
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
}

function toProjectSummary(project: Project): ProjectSummary {
  return {
    id: project.id,
    name: project.name,
    template: project.template,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    moodboardCount: project.moodboardCount,
  }
}

function withProjectMetadata(project: Project): Project {
  return {
    ...project,
    moodboardCount: project.moodboard.length,
    updatedAt: new Date().toISOString(),
  }
}

async function toMoodboardImportPayload(file: File): Promise<MoodboardImportPayload> {
  return {
    name: file.name,
    type: file.type,
    dataUrl: await readFileAsDataUrl(file),
  }
}

async function readFileAsDataUrl(file: File): Promise<string> {
  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(reader.error ?? new Error(`Unable to read ${file.name}`))
      reader.onload = () => resolve(String(reader.result))
      reader.readAsDataURL(file)
    })
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const base64 = Buffer.from(bytes).toString('base64')
  return `data:${file.type || 'application/octet-stream'};base64,${base64}`
}

function createItemId() {
  return `mb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
