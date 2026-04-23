import { useState } from 'react'
import { Scale, X, Loader2 } from 'lucide-react'
import { judgeTone } from '../ai/features'

interface Props {
  onClose: () => void
}

export function Judge({ onClose }: Props) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleJudge() {
    if (!text.trim()) return
    setLoading(true)
    setError(null)
    try {
      const judgement = await judgeTone(text)
      setResult(judgement)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-2xl border border-gray-700 flex flex-col max-h-[90vh]">
        <div className="flex items-center gap-2 p-4 border-b border-gray-700">
          <Scale className="text-pink-400" size={20} />
          <h2 className="text-lg font-bold text-white flex-1">Tone Judge</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          {!result ? (
            <>
              <p className="text-sm text-gray-400 mb-4">
                Not sure how to interpret an email or text? Worried your own message sounds too harsh?
                Paste it here for an objective, RSD-friendly tone analysis.
              </p>
              <textarea
                autoFocus
                className="w-full h-48 bg-gray-800 text-gray-200 text-sm rounded-lg p-3 border border-gray-700 outline-none focus:border-pink-500 resize-none mb-4"
                placeholder="Paste the message here..."
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <div className="flex justify-end">
                <button
                  onClick={handleJudge}
                  disabled={loading || !text.trim()}
                  className="bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? 'Analyzing...' : 'Judge Tone'}
                </button>
              </div>
              {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Original Text</h3>
                <p className="text-sm text-gray-300 italic">"{text}"</p>
              </div>
              
              <div className="bg-pink-900/20 p-4 rounded-lg border border-pink-800/50">
                <h3 className="text-xs text-pink-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Scale size={12} />
                  Analysis
                </h3>
                <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                  {result}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setResult(null)}
                  className="text-gray-400 hover:text-white text-sm px-4 py-2"
                >
                  Judge another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
