import { invoke } from '@tauri-apps/api/core'
import { createDefaultProject } from './project-defaults'
import type { Project, ProjectSummary, WorkflowTemplate } from '../types/project'

const STORAGE_KEY = 'trama.projects.v1'

type ProjectRepository = {
  listProjects: () => Promise<ProjectSummary[]>
  loadProject: (projectId: string) => Promise<Project>
  createProject: (name: string, template?: WorkflowTemplate) => Promise<Project>
  saveProject: (project: Project) => Promise<Project>
  renameProject: (projectId: string, name: string) => Promise<Project>
  deleteProject: (projectId: string) => Promise<void>
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
}

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
