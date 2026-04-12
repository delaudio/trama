import test from 'node:test'
import assert from 'node:assert/strict'
import { buildFalOperationInput, extractFalOutputUrls } from './fal-client.ts'

test('buildFalOperationInput normalizes curated remove background input', () => {
  assert.deepEqual(
    buildFalOperationInput('remove-background', {
      image: 'file:///product.png',
    }),
    {
      image_url: 'file:///product.png',
    },
  )
})

test('buildFalOperationInput applies defaults for scene generation and upscaling', () => {
  assert.deepEqual(
    buildFalOperationInput('generate-scene', {
      prompt: 'soft premium beauty campaign set',
    }),
    {
      prompt: 'soft premium beauty campaign set',
      image_size: 'landscape_4_3',
      num_images: 1,
    },
  )

  assert.deepEqual(
    buildFalOperationInput('upscale', {
      image: 'file:///campaign.jpg',
    }),
    {
      image_url: 'file:///campaign.jpg',
      prompt: 'masterpiece, best quality, highres',
      upscale_factor: 2,
    },
  )
})

test('extractFalOutputUrls normalizes both single-image and multi-image responses', () => {
  assert.deepEqual(
    extractFalOutputUrls({
      image: {
        url: 'https://cdn.example.com/cutout.png',
      },
    }),
    ['https://cdn.example.com/cutout.png'],
  )

  assert.deepEqual(
    extractFalOutputUrls({
      images: [
        { url: 'https://cdn.example.com/scene-1.jpg' },
        { url: 'https://cdn.example.com/scene-2.jpg' },
      ],
    }),
    ['https://cdn.example.com/scene-1.jpg', 'https://cdn.example.com/scene-2.jpg'],
  )
})
