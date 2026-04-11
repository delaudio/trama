type FalConfigEnv = {
  VITE_FAL_API_KEY?: string
}

export type FalConfig = {
  apiKey: string
  hasApiKey: boolean
  maskedApiKey: string
  sourceLabel: string
}

export function readFalConfig(env: FalConfigEnv): FalConfig {
  const apiKey = env.VITE_FAL_API_KEY?.trim() ?? ''

  return {
    apiKey,
    hasApiKey: apiKey.length > 0,
    maskedApiKey: maskApiKey(apiKey),
    sourceLabel: apiKey ? '.env' : 'missing',
  }
}

export const falConfig = readFalConfig((import.meta as ImportMeta & { env?: FalConfigEnv }).env ?? {})

function maskApiKey(apiKey: string) {
  if (!apiKey) {
    return 'Not configured'
  }

  if (apiKey.length <= 8) {
    return 'Configured'
  }

  return `${apiKey.slice(0, 4)}…${apiKey.slice(-4)}`
}
