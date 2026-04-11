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

export type WorkflowNodeIo = {
  inputs: WorkflowDataType[]
  outputs: WorkflowDataType[]
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
  title: string
  note: string
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
