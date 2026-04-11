import assert from 'node:assert/strict'
import test from 'node:test'
import type { Edge, Node } from '@xyflow/react'
import type { WorkflowNodeData } from '../../types/project.ts'
import { getWorkflowNodeIo, validateWorkflowConnection } from './workflow-io.ts'

const nodes: Node<WorkflowNodeData>[] = [
  createNode('prompt', 'prompt', 'Prompt'),
  createNode('reference', 'reference-image', 'Reference Image'),
  createNode('scene', 'generate-scene', 'Generate Scene'),
  createNode('scene-alt', 'generate-scene', 'Generate Scene Alt'),
  createNode('remove-bg', 'remove-background', 'Remove Background'),
  createNode('place-product', 'place-product', 'Place Product'),
  createNode('upscale', 'upscale', 'Upscale'),
]

test('workflow node definitions expose typed io', () => {
  assert.deepEqual(getWorkflowNodeIo('prompt'), {
    inputs: [],
    outputs: ['prompt-text'],
  })
  assert.deepEqual(getWorkflowNodeIo('place-product'), {
    inputs: ['scene-image', 'cutout-image'],
    outputs: ['composite-image'],
  })
})

test('validates compatible connections between curated nodes', () => {
  const result = validateWorkflowConnection({
    connection: { source: 'prompt', sourceHandle: null, target: 'scene', targetHandle: null },
    nodes,
    edges: [],
  })

  assert.equal(result.isValid, true)
})

test('rejects incompatible connections with a useful reason', () => {
  const result = validateWorkflowConnection({
    connection: { source: 'reference', sourceHandle: null, target: 'scene', targetHandle: null },
    nodes,
    edges: [],
  })

  assert.equal(result.isValid, false)
  assert.match(result.reason ?? '', /cannot connect/i)
})

test('rejects duplicate input types on the same target node', () => {
  const edges: Edge[] = [{ id: 'e-scene-place', source: 'scene', target: 'place-product' }]
  const result = validateWorkflowConnection({
    connection: { source: 'scene-alt', sourceHandle: null, target: 'place-product', targetHandle: null },
    nodes,
    edges,
  })

  assert.equal(result.isValid, false)
  assert.match(result.reason ?? '', /already has/i)
})

function createNode(
  id: string,
  kind: WorkflowNodeData['kind'],
  label: string,
): Node<WorkflowNodeData> {
  return {
    id,
    type: 'workflowNode',
    position: { x: 0, y: 0 },
    data: {
      kind,
      label,
      description: label,
    },
  }
}
