import { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw, ChevronRight, ChevronLeft } from 'lucide-react'
import { useTaskStore } from '../store/tasks'
import type { Task } from '../db/local'

const PRIORITY_ORDER: Task['priority'][] = ['urgent', 'high', 'normal', 'low']

export function FocusView() {
  const { tasks, activeListId, updateTask } = useTaskStore()
  const [focusIdx, setFocusIdx] = useState(0)
  const [seconds, setSeconds] = useState(25 * 60)
  const [running, setRunning] = useState(false)

  const listTasks = (activeListId
    ? tasks.filter(t => t.listId === activeListId && t.parentId === null)
    : tasks.filter(t => t.parentId === null)
  )
    .filter(t => t.status !== 'done')
    .sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority))

  const current = listTasks[focusIdx]

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { setRunning(false); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  function reset() {
    setRunning(false)
    setSeconds(25 * 60)
  }

  if (listTasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <p className="text-gray-400 text-lg">All done! No tasks left.</p>
        </div>
      </div>
    )
  }

  if (!current) return null

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-950">
      {/* Task navigation */}
      <div className="flex items-center gap-4 mb-2">
        <button
          disabled={focusIdx === 0}
          onClick={() => setFocusIdx(i => i - 1)}
          className="text-gray-500 hover:text-gray-300 disabled:opacity-30"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-xs text-gray-500">{focusIdx + 1} / {listTasks.length}</span>
        <button
          disabled={focusIdx >= listTasks.length - 1}
          onClick={() => setFocusIdx(i => i + 1)}
          className="text-gray-500 hover:text-gray-300 disabled:opacity-30"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Current task */}
      <div className="text-center max-w-lg mb-8">
        <div className="text-xs text-indigo-400 uppercase tracking-widest mb-2">Focus on this</div>
        <h1 className="text-3xl font-bold text-white mb-3">{current.title}</h1>
        {current.description && (
          <p className="text-gray-400 text-sm">{current.description}</p>
        )}
        {current.timeEstimate && (
          <p className="text-gray-500 text-xs mt-2">Estimated: {current.timeEstimate} min</p>
        )}
      </div>

      {/* Pomodoro timer */}
      <div className="bg-gray-800 rounded-2xl p-8 text-center mb-6 border border-gray-700">
        <div className="text-6xl font-mono font-bold text-white mb-4">
          {formatTime(seconds)}
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setRunning(r => !r)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg font-medium"
          >
            {running ? <Pause size={16} /> : <Play size={16} />}
            {running ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      {/* Done button */}
      <button
        onClick={() => {
          updateTask(current.id, { status: 'done' })
          setFocusIdx(i => Math.max(0, i - 1))
          reset()
        }}
        className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-semibold text-lg"
      >
        Mark Done
      </button>
    </div>
  )
}
