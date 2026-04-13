import { create } from 'zustand'
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type Node,
  type NodeChange,
  type Viewport,
} from '@xyflow/react'
import { validateWorkflowConnection } from '../features/workflow/workflow-io'
import {
  createIdleWorkflowRunState,
  executeWorkflow,
} from '../features/workflow/workflow-runtime'
import { projectRepository } from '../lib/project-repository'
import type {
  MoodboardItem,
  Project,
  ProjectSummary,
  RuntimeOutputItem,
  WorkflowNodeRunState,
  WorkflowNodeData,
  WorkflowRunState,
} from '../types/project'

type ProjectsState = {
  projects: ProjectSummary[]
  activeProject: Project | null
  activeProjectId: string
  isLoading: boolean
  isSaving: boolean
  isDirty: boolean
  errorMessage: string
  workflowMessage: string
  workflowRun: WorkflowRunState
  loadProjects: () => Promise<void>
  setActiveProject: (projectId: string) => Promise<void>
  createProject: (name: string) => Promise<void>
  saveActiveProject: () => Promise<void>
  renameActiveProject: (name: string) => Promise<void>
  deleteActiveProject: () => Promise<void>
  runActiveWorkflow: () => Promise<void>
  exportProjectOutputs: (outputIds: string[]) => Promise<void>
  importMoodboardImages: (files: File[]) => Promise<void>
  updateMoodboardItem: (itemId: string, patch: Pick<MoodboardItem, 'title' | 'note'>) => Promise<void>
  deleteMoodboardItem: (itemId: string) => Promise<void>
  applyNodeChanges: (changes: NodeChange<Node<WorkflowNodeData>>[]) => void
  applyEdgeChanges: (changes: EdgeChange[]) => void
  connectNodes: (connection: Connection) => void
  setViewport: (viewport: Viewport) => void
  clearWorkflowMessage: () => void
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  activeProject: null,
  activeProjectId: '',
  isLoading: false,
  isSaving: false,
  isDirty: false,
  errorMessage: '',
  workflowMessage: '',
  workflowRun: createIdleWorkflowRunState(),
  async loadProjects() {
    set({ isLoading: true, errorMessage: '', workflowMessage: '' })

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
        isDirty: false,
        workflowRun: createIdleWorkflowRunState(),
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

    set({ isLoading: true, errorMessage: '', workflowMessage: '' })

    try {
      const activeProject = await projectRepository.loadProject(projectId)
      set({
        activeProjectId: projectId,
        activeProject,
        isLoading: false,
        isDirty: false,
        workflowRun: createIdleWorkflowRunState(),
      })
    } catch (error) {
      set({
        isLoading: false,
        errorMessage: getErrorMessage(error),
      })
    }
  },
  async createProject(name) {
    set({ isLoading: true, errorMessage: '', workflowMessage: '' })

    try {
      const activeProject = await projectRepository.createProject(name)
      const projects = await projectRepository.listProjects()

      set({
        projects,
        activeProjectId: activeProject.id,
        activeProject,
        isLoading: false,
        isDirty: false,
        workflowRun: createIdleWorkflowRunState(),
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
        isDirty: false,
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
        isDirty: false,
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

    set({ isLoading: true, errorMessage: '', workflowMessage: '' })

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
        isDirty: false,
        workflowRun: createIdleWorkflowRunState(),
      })
    } catch (error) {
      set({
        isLoading: false,
        errorMessage: getErrorMessage(error),
      })
    }
  },
  async importMoodboardImages(files) {
    const activeProjectId = get().activeProjectId

    if (!activeProjectId || !files.length) {
      return
    }

    set({ isSaving: true, errorMessage: '' })

    try {
      const activeProject = await projectRepository.importMoodboardImages(activeProjectId, files)
      const projects = await projectRepository.listProjects()
      set({
        activeProject,
        projects,
        isSaving: false,
        isDirty: false,
      })
    } catch (error) {
      set({
        isSaving: false,
        errorMessage: getErrorMessage(error),
      })
    }
  },
  async updateMoodboardItem(itemId, patch) {
    const activeProject = get().activeProject

    if (!activeProject) {
      return
    }

    const targetItem = activeProject.moodboard.find((item) => item.id === itemId)

    if (!targetItem) {
      return
    }

    set({ isSaving: true, errorMessage: '' })

    try {
      const nextProject = await projectRepository.updateMoodboardItem(activeProject.id, {
        ...targetItem,
        ...patch,
      })
      const projects = await projectRepository.listProjects()
      set({
        activeProject: nextProject,
        projects,
        isSaving: false,
        isDirty: false,
      })
    } catch (error) {
      set({
        isSaving: false,
        errorMessage: getErrorMessage(error),
      })
    }
  },
  async deleteMoodboardItem(itemId) {
    const activeProject = get().activeProject

    if (!activeProject) {
      return
    }

    set({ isSaving: true, errorMessage: '' })

    try {
      const nextProject = await projectRepository.deleteMoodboardItem(activeProject.id, itemId)
      const projects = await projectRepository.listProjects()
      set({
        activeProject: nextProject,
        projects,
        isSaving: false,
        isDirty: false,
      })
    } catch (error) {
      set({
        isSaving: false,
        errorMessage: getErrorMessage(error),
      })
    }
  },
  async runActiveWorkflow() {
    const activeProject = get().activeProject

    if (!activeProject) {
      return
    }

    const initialNodeStates = Object.fromEntries(
      activeProject.graph.nodes.map((node) => [
        node.id,
        {
          nodeId: node.id,
          label: node.data.label,
          status: 'pending',
          outputCount: 0,
          errorMessage: '',
        } satisfies WorkflowNodeRunState,
      ]),
    )

    set({
      workflowMessage: '',
      errorMessage: '',
      workflowRun: {
        status: 'running',
        executionOrder: [],
        nodeStates: initialNodeStates,
        outputs: [],
        errorMessage: '',
      },
    })

    try {
      const result = await executeWorkflow(activeProject, {
        onNodeStateChange(nodeState) {
          set((state) => ({
            workflowRun: {
              ...state.workflowRun,
              nodeStates: {
                ...state.workflowRun.nodeStates,
                [nodeState.nodeId]: nodeState,
              },
            },
          }))
        },
      })
      const nextProject = await projectRepository.storeWorkflowOutputs(activeProject.id, result.outputs)
      const projects = await projectRepository.listProjects()

      set((state) => ({
        workflowMessage: result.outputs.length
          ? `Workflow completed. ${result.outputs.length} output${result.outputs.length > 1 ? 's' : ''} ready for review.`
          : 'Workflow completed.',
        activeProject: nextProject,
        projects,
        workflowRun: {
          ...state.workflowRun,
          status: 'succeeded',
          executionOrder: result.executionOrder,
          outputs: nextProject.outputs.map(toRuntimeOutputItem),
          errorMessage: '',
        },
      }))
    } catch (error) {
      set((state) => ({
        workflowMessage: getErrorMessage(error),
        workflowRun: {
          ...state.workflowRun,
          status: 'failed',
          errorMessage: getErrorMessage(error),
        },
      }))
    }
  },
  async exportProjectOutputs(outputIds) {
    const activeProjectId = get().activeProjectId

    if (!activeProjectId || !outputIds.length) {
      return
    }

    set({ isSaving: true, errorMessage: '' })

    try {
      const exportedPaths = await projectRepository.exportOutputs(activeProjectId, outputIds)
      set({
        isSaving: false,
        workflowMessage: exportedPaths.length
          ? `Exported ${exportedPaths.length} output${exportedPaths.length > 1 ? 's' : ''}.`
          : 'No outputs exported.',
      })
    } catch (error) {
      set({
        isSaving: false,
        errorMessage: getErrorMessage(error),
      })
    }
  },
  applyNodeChanges(changes) {
    const activeProject = get().activeProject

    if (!activeProject) {
      return
    }

    set({
      activeProject: {
        ...activeProject,
        graph: {
          ...activeProject.graph,
          nodes: applyNodeChanges<Node<WorkflowNodeData>>(
            changes,
            activeProject.graph.nodes,
          ),
        },
      },
      isDirty: true,
      workflowMessage: '',
    })
  },
  applyEdgeChanges(changes) {
    const activeProject = get().activeProject

    if (!activeProject) {
      return
    }

    set({
      activeProject: {
        ...activeProject,
        graph: {
          ...activeProject.graph,
          edges: applyEdgeChanges(changes, activeProject.graph.edges),
        },
      },
      isDirty: true,
      workflowMessage: '',
    })
  },
  connectNodes(connection) {
    const activeProject = get().activeProject

    if (!activeProject || !connection.source || !connection.target) {
      return
    }

    const validation = validateWorkflowConnection({
      connection,
      nodes: activeProject.graph.nodes,
      edges: activeProject.graph.edges,
    })

    if (!validation.isValid) {
      set({
        workflowMessage: validation.reason ?? 'This connection is not allowed.',
      })
      return
    }

    set({
      activeProject: {
        ...activeProject,
        graph: {
          ...activeProject.graph,
          edges: addEdge(
            {
              ...connection,
              animated: true,
              style: { stroke: '#8e4d22', strokeWidth: 1.6 },
            },
            activeProject.graph.edges,
          ),
        },
      },
      isDirty: true,
      workflowMessage: '',
    })
  },
  setViewport(viewport) {
    const activeProject = get().activeProject

    if (!activeProject) {
      return
    }

    set({
      activeProject: {
        ...activeProject,
        graph: {
          ...activeProject.graph,
          viewport,
        },
      },
      isDirty: true,
      workflowMessage: '',
    })
  },
  clearWorkflowMessage() {
    set({ workflowMessage: '' })
  },
}))

function getErrorMessage(error: unknown) {
  if (typeof error === 'string') {
    return error
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object' && error && 'message' in error) {
    const { message } = error

    if (typeof message === 'string') {
      return message
    }
  }

  return 'Unexpected project error'
}

function toRuntimeOutputItem(output: Project['outputs'][number]): RuntimeOutputItem {
  return {
    id: output.id,
    nodeId: output.sourceNodeId,
    title: output.title,
    note: output.note,
    previewUrl: output.path,
  }
}
