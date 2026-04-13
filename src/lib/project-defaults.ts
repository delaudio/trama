import type { Edge, Node } from '@xyflow/react'
import type { Project, WorkflowNodeData, WorkflowTemplate } from '../types/project.ts'

const defaultNodes: Node<WorkflowNodeData>[] = [
  {
    id: 'prompt',
    type: 'workflowNode',
    position: { x: 60, y: 90 },
    data: {
      kind: 'prompt',
      label: 'Prompt',
      description: 'Campaign intent, color direction, skin finish.',
    },
  },
  {
    id: 'reference',
    type: 'workflowNode',
    position: { x: 60, y: 260 },
    data: {
      kind: 'reference-image',
      label: 'Reference Image',
      description: 'Bottle shot and art-direction reference.',
    },
  },
  {
    id: 'remove-bg',
    type: 'workflowNode',
    position: { x: 360, y: 260 },
    data: {
      kind: 'remove-background',
      label: 'Remove Background',
      description: 'Prepare cutout for placement and cleanup.',
    },
  },
  {
    id: 'scene',
    type: 'workflowNode',
    position: { x: 360, y: 90 },
    data: {
      kind: 'generate-scene',
      label: 'Generate Scene',
      description: 'Warm studio set with cosmetic campaign lighting.',
    },
  },
  {
    id: 'place-product',
    type: 'workflowNode',
    position: { x: 680, y: 170 },
    data: {
      kind: 'place-product',
      label: 'Place Product',
      description: 'Merge product and scene into a campaign still.',
    },
  },
  {
    id: 'upscale',
    type: 'workflowNode',
    position: { x: 980, y: 170 },
    data: {
      kind: 'upscale',
      label: 'Upscale',
      description: 'Prepare the selected output for review.',
    },
  },
]

const defaultEdges: Edge[] = [
  { id: 'e-prompt-scene', source: 'prompt', target: 'scene' },
  { id: 'e-reference-remove-bg', source: 'reference', target: 'remove-bg' },
  { id: 'e-scene-place', source: 'scene', target: 'place-product' },
  { id: 'e-remove-bg-place', source: 'remove-bg', target: 'place-product' },
  { id: 'e-place-upscale', source: 'place-product', target: 'upscale' },
]

export function createDefaultProject(
  name: string,
  template: WorkflowTemplate = 'beauty-campaign',
): Project {
  const timestamp = new Date().toISOString()
  const id = slugify(`${name}-${Date.now().toString(36)}`)

  return {
    id,
    name,
    template,
    createdAt: timestamp,
    updatedAt: timestamp,
    moodboardCount: 4,
    graph: {
      nodes: structuredClone(defaultNodes),
      edges: structuredClone(defaultEdges),
      viewport: { x: 0, y: 0, zoom: 0.85 },
    },
    moodboard: [
      {
        id: 'mb-soft-light',
        filename: 'soft-skin-light.jpg',
        path: '',
        title: 'Soft skin light',
        note: 'Neutral warmth, diffusion, elegant glow on cheekbones.',
        createdAt: timestamp,
      },
      {
        id: 'mb-bottle-angle',
        filename: 'bottle-angle.jpg',
        path: '',
        title: 'Bottle angle',
        note: 'Slight top-left view with strong shadow discipline.',
        createdAt: timestamp,
      },
      {
        id: 'mb-gold-cream',
        filename: 'gold-and-cream.jpg',
        path: '',
        title: 'Gold and cream',
        note: 'Good palette for premium but soft campaign visuals.',
        createdAt: timestamp,
      },
      {
        id: 'mb-charcoal-contrast',
        filename: 'contrast-note.jpg',
        path: '',
        title: 'Contrast note',
        note: 'Useful accent for typography and pack contrast.',
        createdAt: timestamp,
      },
    ],
    outputs: [],
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
