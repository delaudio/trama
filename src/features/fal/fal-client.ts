import { fal } from '@fal-ai/client'
import { falConfig } from '../../lib/fal-config.ts'
import {
  getFalOperation,
  type FalOperationDefinition,
  type FalOperationId,
} from './fal-operations.ts'

type FalMediaSource = Blob | File | string

type RemoveBackgroundInput = {
  image: FalMediaSource
}

type GenerateSceneInput = {
  prompt: string
  imageSize?: 'landscape_4_3' | 'landscape_16_9' | 'portrait_4_3' | 'portrait_16_9' | 'square'
  numImages?: number
}

type PlaceProductInput = {
  image: FalMediaSource
  prompt: string
}

type UpscaleInput = {
  image: FalMediaSource
  prompt?: string
  upscaleFactor?: number
}

export type FalOperationInputMap = {
  'remove-background': RemoveBackgroundInput
  'generate-scene': GenerateSceneInput
  'place-product': PlaceProductInput
  upscale: UpscaleInput
}

export type FalRunResult = {
  requestId: string
  operation: FalOperationDefinition
  outputUrls: string[]
  raw: unknown
}

let isConfigured = false

export async function runFalOperation<TOperationId extends FalOperationId>(
  operationId: TOperationId,
  input: FalOperationInputMap[TOperationId],
): Promise<FalRunResult> {
  ensureFalClientConfigured()

  const operation = getFalOperation(operationId)
  const response = await fal.subscribe(operation.modelId, {
    input: buildFalOperationInput(operationId, input),
    logs: true,
  })

  return {
    requestId: response.requestId,
    operation,
    outputUrls: extractFalOutputUrls(response.data),
    raw: response.data,
  }
}

export function buildFalOperationInput<TOperationId extends FalOperationId>(
  operationId: TOperationId,
  input: FalOperationInputMap[TOperationId],
) {
  switch (operationId) {
    case 'remove-background': {
      const operationInput = input as FalOperationInputMap['remove-background']
      return {
        image_url: operationInput.image,
      }
    }
    case 'generate-scene': {
      const operationInput = input as FalOperationInputMap['generate-scene']
      return {
        prompt: operationInput.prompt,
        image_size: operationInput.imageSize ?? 'landscape_4_3',
        num_images: operationInput.numImages ?? 1,
      }
    }
    case 'place-product': {
      const operationInput = input as FalOperationInputMap['place-product']
      return {
        image_url: operationInput.image,
        prompt: operationInput.prompt,
      }
    }
    case 'upscale': {
      const operationInput = input as FalOperationInputMap['upscale']
      return {
        image_url: operationInput.image,
        prompt: operationInput.prompt ?? 'masterpiece, best quality, highres',
        upscale_factor: operationInput.upscaleFactor ?? 2,
      }
    }
  }
}

export function extractFalOutputUrls(data: unknown): string[] {
  if (!data || typeof data !== 'object') {
    return []
  }

  const imageUrl = getNestedString(data, 'image', 'url')

  if (imageUrl) {
    return [imageUrl]
  }

  const images = 'images' in data ? data.images : undefined

  if (!Array.isArray(images)) {
    return []
  }

  return images
    .map((item) => getNestedString(item, 'url'))
    .filter((item): item is string => Boolean(item))
}

function ensureFalClientConfigured() {
  if (!falConfig.hasApiKey) {
    throw new Error('Fal API key missing. Add VITE_FAL_API_KEY to your local .env file.')
  }

  if (isConfigured) {
    return
  }

  fal.config({
    credentials: falConfig.apiKey,
  })

  isConfigured = true
}

function getNestedString(value: unknown, ...path: string[]) {
  let current: unknown = value

  for (const segment of path) {
    if (!current || typeof current !== 'object' || !(segment in current)) {
      return ''
    }

    current = current[segment as keyof typeof current]
  }

  return typeof current === 'string' ? current : ''
}
