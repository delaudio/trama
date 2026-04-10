import { create } from 'zustand'
import { mockProjects } from '../data/mock-projects'
import type { Project } from '../types/project'

type ProjectsState = {
  projects: Project[]
  activeProjectId: string
  setActiveProject: (projectId: string) => void
}

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: mockProjects,
  activeProjectId: mockProjects[0]?.id ?? '',
  setActiveProject: (projectId) => set({ activeProjectId: projectId }),
}))
