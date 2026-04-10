import { create } from 'zustand'
import { projectRepository } from '../lib/project-repository'
import type { Project } from '../types/project'

type ProjectsState = {
  projects: Project[]
  activeProject: Project | null
  activeProjectId: string
  isLoading: boolean
  isSaving: boolean
  errorMessage: string
  loadProjects: () => Promise<void>
  setActiveProject: (projectId: string) => Promise<void>
  createProject: (name: string) => Promise<void>
  saveActiveProject: () => Promise<void>
  renameActiveProject: (name: string) => Promise<void>
  deleteActiveProject: () => Promise<void>
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  activeProject: null,
  activeProjectId: '',
  isLoading: false,
  isSaving: false,
  errorMessage: '',
  async loadProjects() {
    set({ isLoading: true, errorMessage: '' })

    try {
      const projects = await projectRepository.listProjects()
      const activeProjectId = projects[0]?.id ?? ''
      const activeProject = activeProjectId
        ? await projectRepository.loadProject(activeProjectId)
        : null

      set({
        projects,
        activeProjectId,
        activeProject,
        isLoading: false,
      })
    } catch (error) {
      set({
        isLoading: false,
        errorMessage: getErrorMessage(error),
      })
    }
  },
  async setActiveProject(projectId) {
    if (!projectId || projectId === get().activeProjectId) {
      return
    }

    set({ isLoading: true, errorMessage: '' })

    try {
      const activeProject = await projectRepository.loadProject(projectId)
      set({
        activeProjectId: projectId,
        activeProject,
        isLoading: false,
      })
    } catch (error) {
      set({
        isLoading: false,
        errorMessage: getErrorMessage(error),
      })
    }
  },
  async createProject(name) {
    set({ isLoading: true, errorMessage: '' })

    try {
      const activeProject = await projectRepository.createProject(name)
      const projects = await projectRepository.listProjects()

      set({
        projects,
        activeProjectId: activeProject.id,
        activeProject,
        isLoading: false,
      })
    } catch (error) {
      set({
        isLoading: false,
        errorMessage: getErrorMessage(error),
      })
    }
  },
  async saveActiveProject() {
    const activeProject = get().activeProject

    if (!activeProject) {
      return
    }

    set({ isSaving: true, errorMessage: '' })

    try {
      const savedProject = await projectRepository.saveProject(activeProject)
      const projects = await projectRepository.listProjects()
      set({
        activeProject: savedProject,
        projects,
        isSaving: false,
      })
    } catch (error) {
      set({
        isSaving: false,
        errorMessage: getErrorMessage(error),
      })
    }
  },
  async renameActiveProject(name) {
    const { activeProjectId } = get()

    if (!activeProjectId) {
      return
    }

    set({ isSaving: true, errorMessage: '' })

    try {
      const activeProject = await projectRepository.renameProject(activeProjectId, name)
      const projects = await projectRepository.listProjects()
      set({
        activeProject,
        projects,
        isSaving: false,
      })
    } catch (error) {
      set({
        isSaving: false,
        errorMessage: getErrorMessage(error),
      })
    }
  },
  async deleteActiveProject() {
    const { activeProjectId, projects } = get()

    if (!activeProjectId) {
      return
    }

    set({ isLoading: true, errorMessage: '' })

    try {
      await projectRepository.deleteProject(activeProjectId)
      const nextProjects = projects.filter((item) => item.id !== activeProjectId)
      const fallbackProjectId = nextProjects[0]?.id ?? ''
      const activeProject = fallbackProjectId
        ? await projectRepository.loadProject(fallbackProjectId)
        : null

      set({
        projects: nextProjects,
        activeProjectId: fallbackProjectId,
        activeProject,
        isLoading: false,
      })
    } catch (error) {
      set({
        isLoading: false,
        errorMessage: getErrorMessage(error),
      })
    }
  },
}))

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Unexpected project error'
}
