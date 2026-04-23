import { useState } from 'react'
import { ChefHat, X, Loader2, Play } from 'lucide-react'
import { useTaskStore } from '../store/tasks'
import { pickTaskForMe } from '../ai/features'

interface Props {
  onClose: () => void
}

export function ExecutiveChef({ onClose }: Props) {
  const { tasks, setActiveTask, setView } = useTaskStore()
  
  const [timeAvail, setTimeAvail] = useState<number>(30)
  const [energy, setEnergy] = useState<'high' | 'low' | 'brain dead'>('low')
  const [loading, setLoading] = useState(false)
  const [resultId, setResultId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const openTasks = tasks.filter(t => t.status !== 'done' && t.parentId === null)

  async function handleAskChef() {
    if (openTasks.length === 0) {
      setError("You don't have any open tasks!")
      return
    }
    
    setLoading(true)
    setError(null)
    
    const tasksJson = JSON.stringify(openTasks.map(t => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      timeEstimate: t.timeEstimate
    })))

    try {
      const recommendedId = await pickTaskForMe(tasksJson, timeAvail, energy)
      // verify the ID exists
      if (tasks.some(t => t.id === recommendedId.trim())) {
        setResultId(recommendedId.trim())
      } else {
        // fallback to random if AI returns invalid ID
        setResultId(openTasks[Math.floor(Math.random() * openTasks.length)].id)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
    setLoading(false)
  }

  const recommendedTask = tasks.find(t => t.id === resultId)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-md border border-gray-700 flex flex-col">
        <div className="flex items-center gap-2 p-4 border-b border-gray-700">
          <ChefHat className="text-orange-400" size={20} />
          <h2 className="text-lg font-bold text-white flex-1">Executive Chef</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex-1">
          {!resultId ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-400 mb-4">
                Decision paralysis? Tell me what you're working with, and I'll pick exactly one task for you to do right now.
              </p>
              
              <div>
                <label className="text-xs text-gray-400 block mb-1">Time Available (minutes)</label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={timeAvail}
                  onChange={e => setTimeAvail(parseInt(e.target.value) || 5)}
                  className="w-full bg-gray-800 text-gray-200 text-sm rounded px-3 py-2 border border-gray-600 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Energy Level</label>
                <div className="flex gap-2">
                  {(['high', 'low', 'brain dead'] as const).map(level => (
                    <button
                      key={level}
                      onClick={() => setEnergy(level)}
                      className={`flex-1 py-2 rounded text-xs font-medium capitalize border transition-colors ${
                        energy === level
                          ? 'bg-orange-600 border-orange-500 text-white'
                          : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-750'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleAskChef}
                  disabled={loading || openTasks.length === 0}
                  className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? 'Cooking...' : 'Pick for me!'}
                </button>
              </div>
              
              {openTasks.length === 0 && (
                <p className="text-orange-400 text-sm text-center">No open tasks to pick from.</p>
              )}
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-2">Here is your recommended task:</p>
                <div className="bg-gray-800 p-6 rounded-xl border border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                  <h3 className="text-2xl font-bold text-white mb-2">{recommendedTask?.title}</h3>
                  {recommendedTask?.timeEstimate && (
                    <span className="text-xs text-orange-400 font-medium bg-orange-950/50 px-2 py-1 rounded">
                      Est: {recommendedTask.timeEstimate}m
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setResultId(null)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 rounded-lg font-medium text-sm"
                >
                  No, pick another
                </button>
                <button
                  onClick={() => {
                    setActiveTask(resultId)
                    setView('focus')
                    onClose()
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(22,163,74,0.3)]"
                >
                  <Play size={16} />
                  Do it now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
