import type {
  WorkflowDataType,
  WorkflowNodeIo,
  WorkflowNodeKind,
} from '../../types/project'

export type FalOperationId =
  | 'remove-background'
  | 'generate-scene'
  | 'place-product'
  | 'upscale'

export type FalOperationDefinition = {
  id: FalOperationId
  label: string
  summary: string
  modelId: string
  nodeKind: WorkflowNodeKind
  io: WorkflowNodeIo
}

const falOperations: Record<FalOperationId, FalOperationDefinition> = {
  'remove-background': {
    id: 'remove-background',
    label: 'Background Cleanup',
    summary: 'Cuts the product from its original background for clean compositing.',
    modelId: 'fal-ai/imageutils/rembg',
    nodeKind: 'remove-background',
    io: {
      inputs: ['reference-image'],
      outputs: ['cutout-image'],
    },
  },
  'generate-scene': {
    id: 'generate-scene',
    label: 'Scene Generation',
    summary: 'Generates a campaign-ready set from the approved prompt direction.',
    modelId: 'fal-ai/flux/schnell',
    nodeKind: 'generate-scene',
    io: {
      inputs: ['prompt-text'],
      outputs: ['scene-image'],
    },
  },
  'place-product': {
    id: 'place-product',
    label: 'Product Placement',
    summary: 'Places the cleaned product into the target scene composition.',
    modelId: 'fal-ai/image-editing/background-change',
    nodeKind: 'place-product',
    io: {
      inputs: ['scene-image', 'cutout-image'],
      outputs: ['composite-image'],
    },
  },
  upscale: {
    id: 'upscale',
    label: 'Upscale',
    summary: 'Enhances the selected campaign still for review and export.',
    modelId: 'fal-ai/clarity-upscaler',
    nodeKind: 'upscale',
    io: {
      inputs: ['composite-image'],
      outputs: ['upscaled-image'],
    },
  },
}

const falOperationByNodeKind = Object.values(falOperations).reduce<
  Partial<Record<WorkflowNodeKind, FalOperationDefinition>>
>((catalog, operation) => {
  catalog[operation.nodeKind] = operation
  return catalog
}, {})

const workflowNodeIo: Record<
  Exclude<WorkflowNodeKind, FalOperationId>,
  WorkflowNodeIo
> = {
  prompt: {
    inputs: [],
    outputs: ['prompt-text'],
  },
  'reference-image': {
    inputs: [],
    outputs: ['reference-image'],
  },
  export: {
    inputs: ['upscaled-image'],
    outputs: ['export-ready-image'],
  },
}

export function listFalOperations() {
  return Object.values(falOperations)
}

export function getFalOperation(operationId: FalOperationId) {
  return falOperations[operationId]
}

export function getFalOperationForNodeKind(kind: WorkflowNodeKind) {
  return falOperationByNodeKind[kind] ?? null
}

export function getWorkflowIoForNodeKind(kind: WorkflowNodeKind): WorkflowNodeIo {
  const operation = getFalOperationForNodeKind(kind)

  if (operation) {
    return operation.io
  }

  if (kind in workflowNodeIo) {
    return workflowNodeIo[kind as keyof typeof workflowNodeIo]
  }

  throw new Error(`Workflow IO definition missing for node kind: ${kind}`)
}

export function formatWorkflowIo(types: WorkflowDataType[]) {
  if (!types.length) {
    return 'none'
  }

  return types.map((type) => type.replace(/-/g, ' ')).join(', ')
}
