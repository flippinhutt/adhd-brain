import { useState } from 'react'
import { X, Zap, Clock, Scissors, MessageSquare, Plus, Trash2 } from 'lucide-react'
import { useTaskStore } from '../store/tasks'
import { breakTask, estimateTime, formalize } from '../ai/features'
import type { Task } from '../db/local'

interface Props {
  taskId: string
  onClose: () => void
}

export function TaskDetail({ taskId, onClose }: Props) {
  const { tasks, updateTask, deleteTask, createTask } = useTaskStore()
  const task = tasks.find(t => t.id === taskId)
  const subtasks = tasks.filter(t => t.parentId === taskId)

  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState<string | null>(null)
  const [toneTarget, setToneTarget] = useState<'formal' | 'casual' | 'gentle' | 'direct'>('casual')

  if (!task) return null

  async function handleBreakTask() {
    if (!task) return
    setAiLoading('break')
    setAiResult(null)
    try {
      const steps = await breakTask(task.title, task.description)
      for (const step of steps) {
        createTask({
          title: step,
          description: '',
          status: 'todo',
          priority: task.priority,
          listId: task.listId,
          parentId: task.id,
          dueDate: null,
          tags: [],
          timeEstimate: null,
          recurring: null,
        })
      }
      setAiResult(`Created ${steps.length} subtasks`)
    } catch (e) {
      setAiResult(`Error: ${e instanceof Error ? e.message : String(e)}`)
    }
    setAiLoading(null)
  }

  async function handleEstimate() {
    if (!task) return
    setAiLoading('estimate')
    setAiResult(null)
    try {
      const mins = await estimateTime(task.title)
      updateTask(task.id, { timeEstimate: mins })
      setAiResult(`Estimated: ${mins} minutes`)
    } catch (e) {
      setAiResult(`Error: ${e instanceof Error ? e.message : String(e)}`)
    }
    setAiLoading(null)
  }

  async function handleFormalize() {
    if (!task) return
    setAiLoading('tone')
    setAiResult(null)
    try {
      const result = await formalize(task.description || task.title, toneTarget)
      setAiResult(result)
    } catch (e) {
      setAiResult(`Error: ${e instanceof Error ? e.message : String(e)}`)
    }
    setAiLoading(null)
  }

  function handleDelete() {
    if (!task) return
    deleteTask(task.id)
    onClose()
  }

  const priorities: Task['priority'][] = ['urgent', 'high', 'normal', 'low']
  const statuses: Task['status'][] = ['todo', 'in_progress', 'done']

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="flex items-start gap-3 p-4 border-b border-gray-700">
          <div className="flex-1">
            <input
              className="w-full bg-transparent text-white font-semibold text-lg outline-none placeholder-gray-500"
              value={task.title}
              onChange={e => updateTask(task.id, { title: e.target.value })}
              placeholder="Task title..."
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleDelete} className="text-red-400 hover:text-red-300">
              <Trash2 size={16} />
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Status + Priority */}
          <div className="flex gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Status</label>
              <select
                value={task.status}
                onChange={e => updateTask(task.id, { status: e.target.value as Task['status'] })}
                className="bg-gray-800 text-gray-200 text-sm rounded px-2 py-1 border border-gray-600"
              >
                {statuses.map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Priority</label>
              <select
                value={task.priority}
                onChange={e => updateTask(task.id, { priority: e.target.value as Task['priority'] })}
                className="bg-gray-800 text-gray-200 text-sm rounded px-2 py-1 border border-gray-600"
              >
                {priorities.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Due date</label>
              <input
                type="date"
                value={task.dueDate?.split('T')[0] ?? ''}
                onChange={e => updateTask(task.id, { dueDate: e.target.value || null })}
                className="bg-gray-800 text-gray-200 text-sm rounded px-2 py-1 border border-gray-600"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Description</label>
            <textarea
              className="w-full bg-gray-800 text-gray-200 text-sm rounded px-3 py-2 border border-gray-600 outline-none min-h-20 resize-none"
              value={task.description}
              onChange={e => updateTask(task.id, { description: e.target.value })}
              placeholder="Add notes..."
            />
          </div>

          {/* Time estimate */}
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-gray-400" />
            <span className="text-xs text-gray-400">Estimate:</span>
            <input
              type="number"
              value={task.timeEstimate ?? ''}
              onChange={e => updateTask(task.id, { timeEstimate: e.target.value ? parseInt(e.target.value) : null })}
              className="w-16 bg-gray-800 text-gray-200 text-sm rounded px-2 py-0.5 border border-gray-600"
              placeholder="min"
            />
            <span className="text-xs text-gray-500">minutes</span>
          </div>

          {/* AI Tools */}
          <div className="border border-indigo-800 rounded-lg p-3 bg-indigo-950/30">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-400">AI Tools</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleBreakTask}
                disabled={aiLoading !== null}
                className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded"
              >
                <Scissors size={12} />
                {aiLoading === 'break' ? 'Breaking...' : 'Break it down'}
              </button>

              <button
                onClick={handleEstimate}
                disabled={aiLoading !== null}
                className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded"
              >
                <Clock size={12} />
                {aiLoading === 'estimate' ? 'Estimating...' : 'Estimate time'}
              </button>

              <div className="flex items-center gap-1">
                <select
                  value={toneTarget}
                  onChange={e => setToneTarget(e.target.value as typeof toneTarget)}
                  className="bg-gray-800 text-gray-300 text-xs rounded px-2 py-1.5 border border-gray-600"
                >
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                  <option value="gentle">Gentle</option>
                  <option value="direct">Direct</option>
                </select>
                <button
                  onClick={handleFormalize}
                  disabled={aiLoading !== null}
                  className="flex items-center gap-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded"
                >
                  <MessageSquare size={12} />
                  {aiLoading === 'tone' ? 'Rewriting...' : 'Change tone'}
                </button>
              </div>
            </div>

            {aiResult && (
              <div className="mt-2 p-2 bg-gray-800 rounded text-xs text-gray-300 whitespace-pre-wrap">
                {aiResult}
              </div>
            )}
          </div>

          {/* Subtasks */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-400">Subtasks ({subtasks.length})</span>
              <button
                onClick={() => {
                  const title = prompt('Subtask title?')
                  if (!title) return
                  createTask({
                    title,
                    description: '',
                    status: 'todo',
                    priority: 'normal',
                    listId: task.listId,
                    parentId: task.id,
                    dueDate: null,
                    tags: [],
                    timeEstimate: null,
                    recurring: null,
                  })
                }}
                className="text-gray-500 hover:text-gray-300"
              >
                <Plus size={12} />
              </button>
            </div>
            <div className="space-y-1">
              {subtasks.map(sub => (
                <div key={sub.id} className="flex items-center gap-2 p-2 bg-gray-800 rounded">
                  <button
                    onClick={() => updateTask(sub.id, { status: sub.status === 'done' ? 'todo' : 'done' })}
                    className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${
                      sub.status === 'done' ? 'border-green-400 bg-green-400' : 'border-gray-500'
                    }`}
                  />
                  <span className={`text-xs flex-1 ${sub.status === 'done' ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                    {sub.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
