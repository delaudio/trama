import type { Edge, Node, Viewport } from '@xyflow/react'

export type WorkflowTemplate = 'beauty-campaign'

export type WorkflowNodeKind =
  | 'prompt'
  | 'reference-image'
  | 'remove-background'
  | 'generate-scene'
  | 'place-product'
  | 'upscale'
  | 'export'

export type WorkflowDataType =
  | 'prompt-text'
  | 'reference-image'
  | 'cutout-image'
  | 'scene-image'
  | 'composite-image'
  | 'upscaled-image'
  | 'export-ready-image'

export type WorkflowNodeData = {
  kind: WorkflowNodeKind
  label: string
  description: string
}

export type WorkflowNodeRunStatus =
  | 'idle'
  | 'pending'
  | 'running'
  | 'succeeded'
  | 'failed'

export type WorkflowRunStatus =
  | 'idle'
  | 'running'
  | 'succeeded'
  | 'failed'

export type WorkflowNodeIo = {
  inputs: WorkflowDataType[]
  outputs: WorkflowDataType[]
}

export type WorkflowArtifact = {
  type: WorkflowDataType
  value: string
}

export type WorkflowNodeRunState = {
  nodeId: string
  label: string
  status: WorkflowNodeRunStatus
  outputCount: number
  errorMessage: string
}

export type RuntimeOutputItem = {
  id: string
  nodeId: string
  title: string
  note: string
  previewUrl: string
}

export type WorkflowRunState = {
  status: WorkflowRunStatus
  executionOrder: string[]
  nodeStates: Record<string, WorkflowNodeRunState>
  outputs: RuntimeOutputItem[]
  errorMessage: string
}

export type MoodboardItem = {
  id: string
  filename: string
  path: string
  title: string
  note: string
  createdAt: string
}

export type OutputItem = {
  id: string
  sourceNodeId: string
  filename: string
  path: string
  title: string
  note: string
  createdAt: string
}

export type ProjectSummary = {
  id: string
  name: string
  template: WorkflowTemplate
  createdAt: string
  updatedAt: string
  moodboardCount: number
}

export type Project = ProjectSummary & {
  graph: {
    nodes: Node<WorkflowNodeData>[]
    edges: Edge[]
    viewport: Viewport
  }
  moodboard: MoodboardItem[]
  outputs: OutputItem[]
}

export type MoodboardImportPayload = {
  name: string
  type: string
  dataUrl: string
}
