import type { Edge, Node } from '@xyflow/react'
import { runFalOperation, type FalRunResult } from '../fal/fal-client.ts'
import { getWorkflowNodeIo } from './workflow-io.ts'
import type {
  MoodboardItem,
  Project,
  RuntimeOutputItem,
  WorkflowArtifact,
  WorkflowDataType,
  WorkflowNodeData,
  WorkflowNodeRunState,
  WorkflowRunState,
} from '../../types/project.ts'

type WorkflowGraphValidationResult = {
  isValid: boolean
  executionOrder: string[]
  reason?: string
}

type RuntimeHooks = {
  onNodeStateChange?: (state: WorkflowNodeRunState) => void
}

type FalRunner = typeof runFalOperation

type WorkflowExecutionResult = {
  executionOrder: string[]
  outputs: RuntimeOutputItem[]
  artifactsByNodeId: Record<string, WorkflowArtifact[]>
}

export function createIdleWorkflowRunState(): WorkflowRunState {
  return {
    status: 'idle',
    executionOrder: [],
    nodeStates: {},
    outputs: [],
    errorMessage: '',
  }
}

export function validateWorkflowGraph({
  nodes,
  edges,
}: {
  nodes: Node<WorkflowNodeData>[]
  edges: Edge[]
}): WorkflowGraphValidationResult {
  if (!nodes.length) {
    return {
      isValid: false,
      executionOrder: [],
      reason: 'Workflow graph is empty.',
    }
  }

  const executionOrder = computeExecutionOrder(nodes, edges)

  if (executionOrder.length !== nodes.length) {
    return {
      isValid: false,
      executionOrder: [],
      reason: 'Workflow graph must stay acyclic before it can run.',
    }
  }

  const nodeMap = new Map(nodes.map((node) => [node.id, node]))

  for (const nodeId of executionOrder) {
    const node = nodeMap.get(nodeId)

    if (!node) {
      continue
    }

    const requiredInputs = getWorkflowNodeIo(node.data.kind).inputs

    if (!requiredInputs.length) {
      continue
    }

    const upstreamTypes = edges
      .filter((edge) => edge.target === node.id)
      .flatMap((edge) => {
        const upstreamNode = nodeMap.get(edge.source)
        return upstreamNode ? getWorkflowNodeIo(upstreamNode.data.kind).outputs : []
      })

    const missingInputs = requiredInputs.filter((input) => !upstreamTypes.includes(input))

    if (missingInputs.length) {
      return {
        isValid: false,
        executionOrder: [],
        reason: `${node.data.label} is missing ${missingInputs.join(', ').replaceAll('-', ' ')}.`,
      }
    }
  }

  return {
    isValid: true,
    executionOrder,
  }
}

export async function executeWorkflow(
  project: Project,
  {
    falRunner = runFalOperation,
    onNodeStateChange,
  }: RuntimeHooks & {
    falRunner?: FalRunner
  } = {},
): Promise<WorkflowExecutionResult> {
  const validation = validateWorkflowGraph({
    nodes: project.graph.nodes,
    edges: project.graph.edges,
  })

  if (!validation.isValid) {
    throw new Error(validation.reason ?? 'Workflow graph is invalid.')
  }

  const nodeMap = new Map(project.graph.nodes.map((node) => [node.id, node]))
  const artifactsByNodeId: Record<string, WorkflowArtifact[]> = {}

  for (const nodeId of validation.executionOrder) {
    const node = nodeMap.get(nodeId)

    if (!node) {
      continue
    }

    onNodeStateChange?.(createNodeRunState(node, 'running'))

    try {
      const artifacts = await executeWorkflowNode({
        project,
        node,
        edges: project.graph.edges,
        nodeMap,
        artifactsByNodeId,
        falRunner,
      })

      artifactsByNodeId[node.id] = artifacts

      onNodeStateChange?.({
        ...createNodeRunState(node, 'succeeded'),
        outputCount: artifacts.length,
      })
    } catch (error) {
      onNodeStateChange?.({
        ...createNodeRunState(node, 'failed'),
        errorMessage: getErrorMessage(error),
      })
      throw error
    }
  }

  return {
    executionOrder: validation.executionOrder,
    outputs: buildRuntimeOutputs(project, artifactsByNodeId),
    artifactsByNodeId,
  }
}

export function computeExecutionOrder(
  nodes: Node<WorkflowNodeData>[],
  edges: Edge[],
) {
  const adjacency = new Map<string, string[]>()
  const inDegree = new Map<string, number>()

  for (const node of nodes) {
    adjacency.set(node.id, [])
    inDegree.set(node.id, 0)
  }

  for (const edge of edges) {
    adjacency.set(edge.source, [...(adjacency.get(edge.source) ?? []), edge.target])
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1)
  }

  const queue = nodes
    .filter((node) => (inDegree.get(node.id) ?? 0) === 0)
    .map((node) => node.id)
  const ordered: string[] = []

  while (queue.length) {
    const nodeId = queue.shift()

    if (!nodeId) {
      continue
    }

    ordered.push(nodeId)

    for (const targetId of adjacency.get(nodeId) ?? []) {
      const nextInDegree = (inDegree.get(targetId) ?? 0) - 1
      inDegree.set(targetId, nextInDegree)

      if (nextInDegree === 0) {
        queue.push(targetId)
      }
    }
  }

  return ordered
}

async function executeWorkflowNode({
  project,
  node,
  edges,
  nodeMap,
  artifactsByNodeId,
  falRunner,
}: {
  project: Project
  node: Node<WorkflowNodeData>
  edges: Edge[]
  nodeMap: Map<string, Node<WorkflowNodeData>>
  artifactsByNodeId: Record<string, WorkflowArtifact[]>
  falRunner: FalRunner
}): Promise<WorkflowArtifact[]> {
  switch (node.data.kind) {
    case 'prompt':
      return [
        {
          type: 'prompt-text',
          value: node.data.description.trim() || node.data.label,
        },
      ]
    case 'reference-image':
      return [
        {
          type: 'reference-image',
          value: getPrimaryMoodboardReference(project.moodboard),
        },
      ]
    case 'remove-background': {
      const inputImage = getRequiredInput({
        node,
        edges,
        nodeMap,
        artifactsByNodeId,
        type: 'reference-image',
      })
      const result = await falRunner('remove-background', {
        image: inputImage,
      })
      return toImageArtifacts(result, 'cutout-image')
    }
    case 'generate-scene': {
      const prompt = getRequiredInput({
        node,
        edges,
        nodeMap,
        artifactsByNodeId,
        type: 'prompt-text',
      })
      const result = await falRunner('generate-scene', {
        prompt,
      })
      return toImageArtifacts(result, 'scene-image')
    }
    case 'place-product': {
      const cutoutImage = getRequiredInput({
        node,
        edges,
        nodeMap,
        artifactsByNodeId,
        type: 'cutout-image',
      })
      const sceneImage = getRequiredInput({
        node,
        edges,
        nodeMap,
        artifactsByNodeId,
        type: 'scene-image',
      })
      const result = await falRunner('place-product', {
        image: cutoutImage,
        prompt: `${node.data.description}. Match the lighting and mood of this scene reference: ${sceneImage}`,
      })
      return toImageArtifacts(result, 'composite-image')
    }
    case 'upscale': {
      const image = getRequiredInput({
        node,
        edges,
        nodeMap,
        artifactsByNodeId,
        type: 'composite-image',
      })
      const result = await falRunner('upscale', {
        image,
      })
      return toImageArtifacts(result, 'upscaled-image')
    }
    case 'export': {
      const upscaledImage = getRequiredInput({
        node,
        edges,
        nodeMap,
        artifactsByNodeId,
        type: 'upscaled-image',
      })
      return [
        {
          type: 'export-ready-image',
          value: upscaledImage,
        },
      ]
    }
  }
}

function getRequiredInput({
  node,
  edges,
  nodeMap,
  artifactsByNodeId,
  type,
}: {
  node: Node<WorkflowNodeData>
  edges: Edge[]
  nodeMap: Map<string, Node<WorkflowNodeData>>
  artifactsByNodeId: Record<string, WorkflowArtifact[]>
  type: WorkflowDataType
}) {
  const upstreamNodeIds = edges
    .filter((edge) => edge.target === node.id)
    .map((edge) => edge.source)

  for (const upstreamNodeId of upstreamNodeIds) {
    const upstreamNode = nodeMap.get(upstreamNodeId)

    if (!upstreamNode) {
      continue
    }

    const artifact = (artifactsByNodeId[upstreamNode.id] ?? []).find((item) => item.type === type)

    if (artifact) {
      return artifact.value
    }
  }

  throw new Error(`${node.data.label} is missing ${type.replace(/-/g, ' ')}.`)
}

function getPrimaryMoodboardReference(items: MoodboardItem[]) {
  const primaryItem = items.find((item) => Boolean(item.path))

  if (!primaryItem?.path) {
    throw new Error('Import at least one moodboard image before running the workflow.')
  }

  return primaryItem.path
}

function toImageArtifacts(result: FalRunResult, type: WorkflowDataType): WorkflowArtifact[] {
  return result.outputUrls.map((value) => ({ type, value }))
}

function buildRuntimeOutputs(
  project: Project,
  artifactsByNodeId: Record<string, WorkflowArtifact[]>,
): RuntimeOutputItem[] {
  const terminalNodeIds = project.graph.nodes
    .filter((node) => !project.graph.edges.some((edge) => edge.source === node.id))
    .map((node) => node.id)

  const outputs = terminalNodeIds.flatMap((nodeId) => {
    const node = project.graph.nodes.find((candidate) => candidate.id === nodeId)

    return (artifactsByNodeId[nodeId] ?? [])
      .filter((artifact) => artifact.type.endsWith('image'))
      .map((artifact, index) => ({
        id: `${nodeId}-${index}`,
        nodeId,
        title: node ? `${node.data.label} result ${index + 1}` : `Output ${index + 1}`,
        note: node ? `${node.data.label} finished successfully.` : 'Workflow output',
        previewUrl: artifact.value,
      }))
  })

  return outputs
}

function createNodeRunState(
  node: Node<WorkflowNodeData>,
  status: WorkflowNodeRunState['status'],
): WorkflowNodeRunState {
  return {
    nodeId: node.id,
    label: node.data.label,
    status,
    outputCount: 0,
    errorMessage: '',
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return typeof error === 'string' ? error : 'Unexpected workflow error'
}
