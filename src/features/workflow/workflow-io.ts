import type { Connection, Edge, Node } from '@xyflow/react'
import type {
  WorkflowDataType,
  WorkflowNodeData,
} from '../../types/project'
import { getWorkflowIoForNodeKind } from '../fal/fal-operations.ts'

type ConnectionValidationResult = {
  isValid: boolean
  reason?: string
}

export function getWorkflowNodeIo(kind: WorkflowNodeData['kind']) {
  return getWorkflowIoForNodeKind(kind)
}

export function validateWorkflowConnection({
  connection,
  nodes,
  edges,
}: {
  connection: Connection
  nodes: Node<WorkflowNodeData>[]
  edges: Edge[]
}): ConnectionValidationResult {
  const sourceNode = nodes.find((node) => node.id === connection.source)
  const targetNode = nodes.find((node) => node.id === connection.target)

  if (!sourceNode || !targetNode) {
    return {
      isValid: false,
      reason: 'Connection requires both a source node and a target node.',
    }
  }

  if (sourceNode.id === targetNode.id) {
    return {
      isValid: false,
      reason: 'A workflow node cannot connect to itself.',
    }
  }

  if (edges.some((edge) => edge.source === sourceNode.id && edge.target === targetNode.id)) {
    return {
      isValid: false,
      reason: `${sourceNode.data.label} is already connected to ${targetNode.data.label}.`,
    }
  }

  const sourceIo = getWorkflowNodeIo(sourceNode.data.kind)
  const targetIo = getWorkflowNodeIo(targetNode.data.kind)
  const compatibleTypes = sourceIo.outputs.filter((output) => targetIo.inputs.includes(output))

  if (!compatibleTypes.length) {
    return {
      isValid: false,
      reason: `${sourceNode.data.label} cannot connect to ${targetNode.data.label}. ${sourceNode.data.label} outputs ${formatIoList(sourceIo.outputs)}, while ${targetNode.data.label} accepts ${formatIoList(targetIo.inputs)}.`,
    }
  }

  const targetIncomingOutputTypes = edges
    .filter((edge) => edge.target === targetNode.id)
    .flatMap((edge) => {
      const node = nodes.find((candidate) => candidate.id === edge.source)
      return node ? getWorkflowNodeIo(node.data.kind).outputs : []
    })

  const duplicateInputType = compatibleTypes.find((type) =>
    targetIncomingOutputTypes.includes(type),
  )

  if (duplicateInputType) {
    return {
      isValid: false,
      reason: `${targetNode.data.label} already has a ${formatIoType(duplicateInputType)} input.`,
    }
  }

  return { isValid: true }
}

export function formatIoList(types: WorkflowDataType[]) {
  if (!types.length) {
    return 'no compatible inputs'
  }

  return types.map(formatIoType).join(', ')
}

export function formatIoType(type: WorkflowDataType) {
  return type.replace(/-/g, ' ')
}
