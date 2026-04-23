import { Clock, Tag, AlertTriangle, ChevronUp, Minus, ChevronDown, Circle } from 'lucide-react'
import type { Task } from '../db/local'
import { useTaskStore } from '../store/tasks'

const PRIORITY_CONFIG = {
  urgent: { color: 'text-red-400', icon: AlertTriangle, label: 'Urgent' },
  high: { color: 'text-orange-400', icon: ChevronUp, label: 'High' },
  normal: { color: 'text-blue-400', icon: Minus, label: 'Normal' },
  low: { color: 'text-gray-400', icon: ChevronDown, label: 'Low' },
}

const STATUS_CONFIG = {
  todo: { color: 'border-gray-500', label: 'To Do' },
  in_progress: { color: 'border-blue-400', label: 'In Progress' },
  done: { color: 'border-green-400', label: 'Done' },
}

interface Props {
  task: Task
  onClick: () => void
}

export function TaskCard({ task, onClick }: Props) {
  const { tasks, updateTask } = useTaskStore()
  const priority = PRIORITY_CONFIG[task.priority]
  const PriorityIcon = priority.icon
  const status = STATUS_CONFIG[task.status]

  const subtasks = tasks.filter(t => t.parentId === task.id)
  const completedSubtasks = subtasks.filter(t => t.status === 'done')
  const progress = subtasks.length > 0 ? Math.round((completedSubtasks.length / subtasks.length) * 100) : 0

  function cycleStatus(e: React.MouseEvent) {
    e.stopPropagation()
    const order: Task['status'][] = ['todo', 'in_progress', 'done']
    const idx = order.indexOf(task.status)
    const next = order[(idx + 1) % order.length]
    updateTask(task.id, { status: next })
  }

  return (
    <div
      onClick={onClick}
      className="bg-gray-800 rounded-lg p-3 mb-2 cursor-pointer hover:bg-gray-750 border border-gray-700 hover:border-indigo-500 transition-all group"
    >
      <div className="flex items-start gap-2">
        <button
          onClick={cycleStatus}
          className={`mt-0.5 shrink-0 w-4 h-4 rounded-full border-2 ${status.color} flex items-center justify-center`}
        >
          {task.status === 'done' && <Circle size={8} className="fill-green-400 text-green-400" />}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-100'}`}>
            {task.title}
          </p>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`flex items-center gap-0.5 text-xs ${priority.color}`}>
              <PriorityIcon size={10} />
              {priority.label}
            </span>

            {task.timeEstimate && (
              <span className="flex items-center gap-0.5 text-xs text-gray-500">
                <Clock size={10} />
                {task.timeEstimate}m
              </span>
            )}

            {task.dueDate && (
              <span className="text-xs text-gray-500">
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}

            {task.tags.map(tag => (
              <span key={tag} className="flex items-center gap-0.5 text-xs text-purple-400">
                <Tag size={8} />
                {tag}
              </span>
            ))}
          </div>

          {subtasks.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-300" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
              <span className="text-[10px] text-gray-500 font-mono">
                {completedSubtasks.length}/{subtasks.length}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
