import { useState, useEffect, useCallback } from 'react'
import { Play, Pause, RotateCcw, ChevronRight, ChevronLeft, EyeOff, Eye } from 'lucide-react'
import { useTaskStore } from '../store/tasks'
import type { Task } from '../db/local'

const PRIORITY_ORDER: Task['priority'][] = ['urgent', 'high', 'normal', 'low']

export function FocusView() {
  const { tasks, activeListId, updateTask } = useTaskStore()
  const [focusIdx, setFocusIdx] = useState(0)
  
  const [ultraFocus, setUltraFocus] = useState(false)
  const [running, setRunning] = useState(false)
  const [confetti, setConfetti] = useState<{ id: number, x: number, y: number, color: string, tx: number, ty: number, r: number }[]>([])

  const listTasks = (activeListId
    ? tasks.filter(t => t.listId === activeListId && t.parentId === null)
    : tasks.filter(t => t.parentId === null)
  )
    .filter(t => t.status !== 'done')
    .sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority))

  const current = listTasks[focusIdx]

  // Track timer state in a ref or state
  const totalSeconds = current?.timeEstimate ? current.timeEstimate * 60 : 25 * 60
  const [seconds, setSeconds] = useState(totalSeconds)

  // Reset timer when task changes
  useEffect(() => {
    setSeconds(current?.timeEstimate ? current.timeEstimate * 60 : 25 * 60)
    setRunning(false)
  }, [current?.id, current?.timeEstimate])

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
    setSeconds(totalSeconds)
  }

  const triggerConfetti = useCallback(() => {
    const colors = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981']
    const newConfetti = Array.from({ length: 50 }).map((_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: -20 - Math.random() * 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      tx: (Math.random() - 0.5) * 200,
      ty: 100 + Math.random() * 100,
      r: Math.random() * 360,
    }))
    setConfetti(newConfetti)
    setTimeout(() => setConfetti([]), 3000)
  }, [])

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

  const radius = 100
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (seconds / totalSeconds) * circumference

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-950 relative overflow-hidden">
      {/* Confetti overlay */}
      {confetti.map(c => (
        <div
          key={c.id}
          className="absolute w-3 h-3 rounded-sm z-50 pointer-events-none transition-all duration-[3000ms] ease-out"
          style={{
            backgroundColor: c.color,
            left: `${c.x}%`,
            top: `${c.y}%`,
            transform: `translate(${c.tx}px, ${c.ty}vh) rotate(${c.r + 360}deg)`,
          }}
        />
      ))}

      {/* Toggle Ultra Focus */}
      <button 
        onClick={() => setUltraFocus(!ultraFocus)}
        className="absolute top-6 right-6 flex items-center gap-2 text-gray-500 hover:text-gray-300 text-xs"
      >
        {ultraFocus ? <Eye size={14} /> : <EyeOff size={14} />}
        {ultraFocus ? 'Exit Ultra Focus' : 'Ultra Focus'}
      </button>

      {/* Task navigation */}
      {!ultraFocus && (
        <div className="flex items-center gap-4 mb-2">
          <button
            disabled={focusIdx === 0}
            onClick={() => { setFocusIdx(i => i - 1); reset() }}
            className="text-gray-500 hover:text-gray-300 disabled:opacity-30"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-xs text-gray-500">{focusIdx + 1} / {listTasks.length}</span>
          <button
            disabled={focusIdx >= listTasks.length - 1}
            onClick={() => { setFocusIdx(i => i + 1); reset() }}
            className="text-gray-500 hover:text-gray-300 disabled:opacity-30"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Current task */}
      <div className="text-center max-w-lg mb-8">
        {!ultraFocus && <div className="text-xs text-indigo-400 uppercase tracking-widest mb-2">Focus on this</div>}
        <h1 className={`${ultraFocus ? 'text-5xl' : 'text-3xl'} font-bold text-white mb-3 transition-all`}>
          {current.title}
        </h1>
        {!ultraFocus && current.description && (
          <p className="text-gray-400 text-sm">{current.description}</p>
        )}
      </div>

      {/* Visual Pomodoro timer */}
      <div className="relative flex flex-col items-center justify-center mb-8">
        <svg width="240" height="240" className="transform -rotate-90">
          <circle cx="120" cy="120" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-800" />
          <circle 
            cx="120" cy="120" r={radius} 
            stroke="currentColor" 
            strokeWidth="6" 
            fill="transparent" 
            strokeDasharray={circumference} 
            strokeDashoffset={strokeDashoffset} 
            className={`${seconds < 60 ? 'text-red-500' : 'text-indigo-500'} transition-all duration-1000 ease-linear`} 
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`${ultraFocus ? 'text-5xl' : 'text-4xl'} font-mono font-bold text-white`}>
            {formatTime(seconds)}
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-center mb-8">
        <button
          onClick={() => setRunning(r => !r)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg font-medium"
        >
          {running ? <Pause size={16} /> : <Play size={16} />}
          {running ? 'Pause' : 'Start'}
        </button>
        {!ultraFocus && (
          <button
            onClick={reset}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        )}
      </div>

      {/* Done button */}
      <button
        onClick={() => {
          triggerConfetti()
          setTimeout(() => {
            updateTask(current.id, { status: 'done' })
            setFocusIdx(i => Math.max(0, i - 1))
            reset()
          }, 800) // Delay update to see confetti
        }}
        className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-semibold text-lg shadow-[0_0_20px_rgba(22,163,74,0.3)] hover:shadow-[0_0_30px_rgba(22,163,74,0.5)] transition-all"
      >
        Mark Done
      </button>
    </div>
  )
}
