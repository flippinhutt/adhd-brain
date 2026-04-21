import { useState } from 'react'
import { Brain, Zap } from 'lucide-react'
import { brainDump } from '../ai/features'
import { useTaskStore } from '../store/tasks'

export function BrainDump() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { activeListId, createTask } = useTaskStore()

  async function handleDump() {
    if (!text.trim() || !activeListId) return
    setLoading(true)
    setError(null)
    try {
      const extracted = await brainDump(text)
      for (const item of extracted) {
        createTask({
          title: item.title,
          description: '',
          status: 'todo',
          priority: item.priority,
          listId: activeListId,
          parentId: null,
          dueDate: null,
          tags: [],
          timeEstimate: null,
          recurring: null,
        })
      }
      setText('')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
    setLoading(false)
  }

  if (!activeListId) return null

  return (
    <div className="border-t border-gray-700 p-3 bg-gray-900">
      <div className="flex items-center gap-2 mb-2">
        <Brain size={14} className="text-purple-400" />
        <span className="text-xs font-semibold text-purple-400">Brain Dump</span>
        <span className="text-xs text-gray-500">— paste chaos, AI sorts it</span>
      </div>
      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type everything on your mind..."
          className="flex-1 bg-gray-800 text-gray-200 text-xs rounded px-3 py-2 border border-gray-600 outline-none focus:border-purple-500 resize-none h-16 placeholder-gray-500"
        />
        <button
          onClick={handleDump}
          disabled={loading || !text.trim()}
          className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs px-3 rounded self-stretch"
        >
          <Zap size={12} />
          {loading ? 'Sorting...' : 'Sort'}
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
