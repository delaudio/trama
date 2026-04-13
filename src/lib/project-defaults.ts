import type { Edge, Node } from '@xyflow/react'
import type { Project, WorkflowNodeData, WorkflowTemplate } from '../types/project.ts'

const defaultNodes: Node<WorkflowNodeData>[] = [
  {
    id: 'prompt',
    type: 'workflowNode',
    position: { x: 60, y: 90 },
    data: {
      kind: 'prompt',
      label: 'Campaign Brief',
      description:
        'Premium skincare hero shot with soft golden light, creamy neutrals, clean pack focus, and an editorial beauty finish.',
    },
  },
  {
    id: 'reference',
    type: 'workflowNode',
    position: { x: 60, y: 260 },
    data: {
      kind: 'reference-image',
      label: 'Packshot Reference',
      description: 'Use one product packshot or detail crop from the moodboard as the source image.',
    },
  },
  {
    id: 'remove-bg',
    type: 'workflowNode',
    position: { x: 360, y: 260 },
    data: {
      kind: 'remove-background',
      label: 'Prepare Cutout',
      description: 'Clean the product from its background so it can drop into the final composition.',
    },
  },
  {
    id: 'scene',
    type: 'workflowNode',
    position: { x: 360, y: 90 },
    data: {
      kind: 'generate-scene',
      label: 'Build Scene',
      description: 'Generate a warm studio set with premium skincare lighting and room for the product hero.',
    },
  },
  {
    id: 'place-product',
    type: 'workflowNode',
    position: { x: 680, y: 170 },
    data: {
      kind: 'place-product',
      label: 'Compose Hero Still',
      description: 'Place the cutout into the generated set and keep shadows, scale, and reflections believable.',
    },
  },
  {
    id: 'upscale',
    type: 'workflowNode',
    position: { x: 980, y: 170 },
    data: {
      kind: 'upscale',
      label: 'Final Review Render',
      description: 'Upscale the selected still so it is ready for review, export, and client signoff.',
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
        title: 'Skin light reference',
        note: 'Soft golden diffusion, premium skincare glow, and low-contrast highlight rolloff.',
        createdAt: timestamp,
      },
      {
        id: 'mb-bottle-angle',
        filename: 'bottle-angle.jpg',
        path: '',
        title: 'Primary packshot',
        note: 'Use this slot for the cleanest bottle angle or cropped product hero.',
        createdAt: timestamp,
      },
      {
        id: 'mb-gold-cream',
        filename: 'gold-and-cream.jpg',
        path: '',
        title: 'Palette direction',
        note: 'Cream, champagne, sand, and warm gold cues for the first scene pass.',
        createdAt: timestamp,
      },
      {
        id: 'mb-charcoal-contrast',
        filename: 'contrast-note.jpg',
        path: '',
        title: 'Contrast accent',
        note: 'Optional darker accent to keep typography and pack edges readable.',
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
