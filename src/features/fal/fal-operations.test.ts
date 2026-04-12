import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getFalOperationForNodeKind,
  getWorkflowIoForNodeKind,
  listFalOperations,
} from './fal-operations.ts'

test('catalog exposes curated fal operations for ai workflow nodes', () => {
  const operations = listFalOperations()

  assert.equal(operations.length, 4)
  assert.deepEqual(
    operations.map((operation) => operation.label),
    ['Background Cleanup', 'Scene Generation', 'Product Placement', 'Upscale'],
  )
})

test('workflow node kinds map to human-readable fal operations', () => {
  const operation = getFalOperationForNodeKind('place-product')

  assert.ok(operation)
  assert.equal(operation?.label, 'Product Placement')
  assert.equal(operation?.modelId, 'fal-ai/image-editing/background-change')
})

test('workflow io comes from the curated operation catalog for ai nodes', () => {
  assert.deepEqual(getWorkflowIoForNodeKind('generate-scene'), {
    inputs: ['prompt-text'],
    outputs: ['scene-image'],
  })

  assert.deepEqual(getWorkflowIoForNodeKind('export'), {
    inputs: ['upscaled-image'],
    outputs: ['export-ready-image'],
  })
})
