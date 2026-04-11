import assert from 'node:assert/strict'
import test from 'node:test'
import { readFalConfig } from './fal-config.ts'

test('readFalConfig reports missing env values', () => {
  const config = readFalConfig({})

  assert.equal(config.hasApiKey, false)
  assert.equal(config.maskedApiKey, 'Not configured')
  assert.equal(config.sourceLabel, 'missing')
})

test('readFalConfig masks configured api keys', () => {
  const config = readFalConfig({
    VITE_FAL_API_KEY: 'abcd1234:efgh5678',
  })

  assert.equal(config.hasApiKey, true)
  assert.equal(config.maskedApiKey, 'abcd…5678')
  assert.equal(config.sourceLabel, '.env')
})
