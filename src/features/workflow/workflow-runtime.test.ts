import assert from 'node:assert/strict'
import test from 'node:test'
import { createDefaultProject } from '../../lib/project-defaults.ts'
import { executeWorkflow, validateWorkflowGraph } from './workflow-runtime.ts'

test('validateWorkflowGraph returns a stable execution order for the default project', () => {
  const project = createDefaultProject('Runtime test')
  const result = validateWorkflowGraph(project.graph)

  assert.equal(result.isValid, true)
  assert.deepEqual(result.executionOrder, [
    'prompt',
    'reference',
    'scene',
    'remove-bg',
    'place-product',
    'upscale',
  ])
})

test('validateWorkflowGraph rejects cycles', () => {
  const project = createDefaultProject('Cycle test')
  project.graph.edges.push({
    id: 'e-upscale-scene',
    source: 'upscale',
    target: 'scene',
  })

  const result = validateWorkflowGraph(project.graph)

  assert.equal(result.isValid, false)
  assert.match(result.reason ?? '', /acyclic/i)
})

test('executeWorkflow runs curated nodes in order and returns final outputs', async () => {
  const project = createDefaultProject('Execution test')
  project.moodboard[0].path = 'file:///reference.png'
  const seenOperations: string[] = []

  const result = await executeWorkflow(project, {
    falRunner: async (operationId, input) => {
      seenOperations.push(operationId)

      if (operationId === 'generate-scene') {
        assert.equal(
          (input as { prompt: string }).prompt,
          project.graph.nodes[0].data.description,
        )
      }

      return {
        requestId: `${operationId}-request`,
        operation: {
          id: operationId,
          label: operationId,
          summary: operationId,
          modelId: operationId,
          nodeKind: operationId,
          io: { inputs: [], outputs: [] },
        },
        outputUrls: [`https://cdn.example.com/${operationId}.png`],
        raw: {},
      }
    },
  })

  assert.deepEqual(seenOperations, [
    'generate-scene',
    'remove-background',
    'place-product',
    'upscale',
  ])
  assert.equal(result.outputs.length, 1)
  assert.equal(result.outputs[0]?.previewUrl, 'https://cdn.example.com/upscale.png')
})

test('executeWorkflow fails when a moodboard reference is missing', async () => {
  const project = createDefaultProject('Missing reference')
  project.moodboard = []

  await assert.rejects(
    () =>
      executeWorkflow(project, {
        falRunner: async () => {
          throw new Error('should not run')
        },
      }),
    /moodboard image/i,
  )
})
