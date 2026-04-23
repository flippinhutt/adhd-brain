import { getSetting, setSetting } from '../db/api'

export type AIProvider = 'ollama' | 'claude' | 'openai'

export interface AIConfig {
  provider: AIProvider
  model: string
  apiKey?: string
  baseUrl?: string
}

const DEFAULTS: Record<AIProvider, { model: string; baseUrl: string }> = {
  ollama: { model: 'llama3.2', baseUrl: 'http://localhost:11434' },
  claude: { model: 'claude-haiku-4-5-20251001', baseUrl: '' },
  openai: { model: 'gpt-4o-mini', baseUrl: 'https://api.openai.com' },
}

export async function getProviderConfig(p: AIProvider): Promise<{ model: string; apiKey?: string; baseUrl?: string }> {
  const raw = await getSetting(`ai_config_${p}`)
  if (raw) { try { return JSON.parse(raw) } catch { /* fall through */ } }
  return { model: DEFAULTS[p].model, baseUrl: DEFAULTS[p].baseUrl }
}

export async function getAIConfig(): Promise<AIConfig> {
  const provider = ((await getSetting('ai_provider')) as AIProvider) ?? 'ollama'
  const cfg = await getProviderConfig(provider)
  return { provider, ...cfg }
}

export async function setAIConfig(config: Partial<AIConfig> & { provider: AIProvider }): Promise<void> {
  await setSetting('ai_provider', config.provider)
  const existing = await getProviderConfig(config.provider)
  const updated = {
    model: config.model ?? existing.model,
    apiKey: config.apiKey !== undefined ? config.apiKey : existing.apiKey,
    baseUrl: config.baseUrl !== undefined ? config.baseUrl : existing.baseUrl,
  }
  await setSetting(`ai_config_${config.provider}`, JSON.stringify(updated))
}

export async function aiComplete(prompt: string): Promise<string> {
  const config = await getAIConfig()
  switch (config.provider) {
    case 'ollama':
      return ollamaComplete(prompt, config)
    case 'claude':
      return claudeComplete(prompt, config)
    case 'openai':
      return openaiComplete(prompt, config)
    default:
      throw new Error(`Unknown provider: ${config.provider}`)
  }
}

async function ollamaComplete(prompt: string, config: AIConfig): Promise<string> {
  const base = config.baseUrl ?? 'http://localhost:11434'
  const res = await fetch(`${base}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: config.model, prompt, stream: false }),
  })
  if (!res.ok) {
    let detail = res.statusText
    try { const body = await res.json(); detail = body.error ?? detail } catch { /* ignore */ }
    throw new Error(`Ollama error: ${detail} (model: ${config.model}, url: ${base})`)
  }
  const data = await res.json()
  return data.response as string
}

async function claudeComplete(prompt: string, config: AIConfig): Promise<string> {
  if (!config.apiKey) throw new Error('Claude API key not set')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model || 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`Claude error: ${res.statusText}`)
  const data = await res.json()
  return data.content[0].text as string
}

async function openaiComplete(prompt: string, config: AIConfig): Promise<string> {
  if (!config.apiKey) throw new Error('OpenAI API key not set')
  const base = config.baseUrl ?? 'https://api.openai.com'
  const res = await fetch(`${base}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`OpenAI error: ${res.statusText}`)
  const data = await res.json()
  return data.choices[0].message.content as string
}
