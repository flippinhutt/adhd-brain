import { useState, useEffect } from 'react'
import { X, Settings } from 'lucide-react'
import { getAIConfig, getProviderConfig, setAIConfig, type AIProvider } from '../ai/provider'

interface Props {
  onClose: () => void
}

const PROVIDER_META: Record<AIProvider, { needsKey: boolean }> = {
  ollama: { needsKey: false },
  claude: { needsKey: true },
  openai: { needsKey: true },
}

export function AISettings({ onClose }: Props) {
  const [provider, setProvider] = useState<AIProvider>('ollama')
  const [model, setModel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void getAIConfig().then(config => {
      setProvider(config.provider)
      setModel(config.model)
      setApiKey(config.apiKey ?? '')
      setBaseUrl(config.baseUrl ?? '')
      setLoading(false)
    })
  }, [])

  async function handleProviderChange(p: AIProvider) {
    const saved = await getProviderConfig(p)
    setProvider(p)
    setModel(saved.model)
    setApiKey(saved.apiKey ?? '')
    setBaseUrl(saved.baseUrl ?? '')
  }

  async function handleSave() {
    await setAIConfig({ provider, model, apiKey: apiKey || undefined, baseUrl })
    onClose()
  }

  const meta = PROVIDER_META[provider]

  if (loading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-md border border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-gray-400" />
            <span className="font-semibold text-gray-100">AI Settings</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">AI Provider</label>
            <div className="flex gap-2">
              {(['ollama', 'claude', 'openai'] as AIProvider[]).map(p => (
                <button
                  key={p}
                  onClick={() => handleProviderChange(p)}
                  className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                    provider === p
                      ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
                      : 'border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {p === 'ollama' ? 'Ollama' : p === 'claude' ? 'Claude' : 'OpenAI'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Model</label>
            <input
              value={model}
              onChange={e => setModel(e.target.value)}
              className="w-full bg-gray-800 text-gray-200 text-sm rounded px-3 py-2 border border-gray-600 outline-none"
              placeholder={model}
            />
          </div>

          {provider !== 'claude' && (
            <div>
              <label className="text-xs text-gray-400 block mb-1">Base URL</label>
              <input
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                className="w-full bg-gray-800 text-gray-200 text-sm rounded px-3 py-2 border border-gray-600 outline-none"
                placeholder={baseUrl}
              />
              {provider === 'openai' && (
                <p className="text-xs text-gray-500 mt-1">Change to use OpenAI-compatible APIs (LM Studio, etc.)</p>
              )}
            </div>
          )}

          {meta.needsKey && (
            <div>
              <label className="text-xs text-gray-400 block mb-1">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                className="w-full bg-gray-800 text-gray-200 text-sm rounded px-3 py-2 border border-gray-600 outline-none"
                placeholder="sk-..."
              />
              <p className="text-xs text-gray-500 mt-1">Stored in browser localStorage only.</p>
            </div>
          )}

          {provider === 'ollama' && (
            <div className="text-xs text-gray-400 bg-gray-800 rounded p-3">
              Needs <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-indigo-400">Ollama</a> running at the Base URL above.
              Pull model: <code className="bg-gray-700 px-1 rounded">ollama pull {model}</code>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
