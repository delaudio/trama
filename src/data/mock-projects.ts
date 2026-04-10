import type { Edge, Node } from '@xyflow/react'
import type { Project, WorkflowNodeData } from '../types/project'

const nodes: Node<WorkflowNodeData>[] = [
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

const edges: Edge[] = [
  { id: 'e-prompt-scene', source: 'prompt', target: 'scene' },
  { id: 'e-reference-remove-bg', source: 'reference', target: 'remove-bg' },
  { id: 'e-scene-place', source: 'scene', target: 'place-product' },
  { id: 'e-remove-bg-place', source: 'remove-bg', target: 'place-product' },
  { id: 'e-place-upscale', source: 'place-product', target: 'upscale' },
]

export const mockProjects: Project[] = [
  {
    id: 'beauty-spring-drop',
    name: 'Beauty Spring Drop',
    template: 'beauty-campaign',
    updatedAt: 'Updated 2h ago',
    moodboardCount: 4,
    graph: {
      nodes,
      edges,
      viewport: { x: 0, y: 0, zoom: 0.85 },
    },
    moodboard: [
      {
        id: 'mb-soft-light',
        title: 'Soft skin light',
        note: 'Neutral warmth, diffusion, elegant glow on cheekbones.',
      },
      {
        id: 'mb-bottle-angle',
        title: 'Bottle angle',
        note: 'Slight top-left view with strong shadow discipline.',
      },
      {
        id: 'mb-gold-cream',
        title: 'Gold and cream',
        note: 'Good palette for premium but soft campaign visuals.',
      },
      {
        id: 'mb-charcoal-contrast',
        title: 'Contrast note',
        note: 'Useful accent for typography and pack contrast.',
      },
    ],
    outputs: [
      {
        id: 'out-01',
        title: 'Campaign still 01',
        note: 'Most balanced lighting and product placement.',
      },
      {
        id: 'out-02',
        title: 'Campaign still 02',
        note: 'More dramatic contrast, less suitable for print.',
      },
    ],
  },
  {
    id: 'lip-oil-concept',
    name: 'Lip Oil Concept',
    template: 'beauty-campaign',
    updatedAt: 'Updated yesterday',
    moodboardCount: 3,
    graph: {
      nodes,
      edges,
      viewport: { x: 0, y: 0, zoom: 0.85 },
    },
    moodboard: [
      {
        id: 'mb-ref-1',
        title: 'Liquid reflection',
        note: 'Use for glossy reflections and a more liquid feel.',
      },
      {
        id: 'mb-ref-2',
        title: 'Tight crop',
        note: 'Interesting for social crop and product-first framing.',
      },
      {
        id: 'mb-ref-3',
        title: 'Muted terracotta',
        note: 'Palette direction for spring variation tests.',
      },
    ],
    outputs: [
      {
        id: 'out-03',
        title: 'Lip Oil Variation',
        note: 'Good shelf realism but product highlights need tuning.',
      },
    ],
  },
]
