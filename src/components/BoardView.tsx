import { useTaskStore } from '../store/tasks'
import { TaskCard } from './TaskCard'
import { TaskDetail } from './TaskDetail'
import type { Task } from '../db/local'

const COLUMNS: { status: Task['status']; label: string; color: string }[] = [
  { status: 'todo', label: 'To Do', color: 'border-gray-600' },
  { status: 'in_progress', label: 'In Progress', color: 'border-blue-500' },
  { status: 'done', label: 'Done', color: 'border-green-500' },
]

export function BoardView() {
  const { tasks, activeListId, activeTaskId, setActiveTask, updateTask } = useTaskStore()

  const listTasks = activeListId
    ? tasks.filter(t => t.listId === activeListId && t.parentId === null)
    : []

  function handleDrop(e: React.DragEvent, status: Task['status']) {
    const taskId = e.dataTransfer.getData('taskId')
    if (taskId) updateTask(taskId, { status })
  }

  if (!activeListId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
        Select a list from the sidebar
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-x-auto p-4">
      <div className="flex gap-4 h-full min-w-max">
        {COLUMNS.map(col => {
          const colTasks = listTasks.filter(t => t.status === col.status)
          return (
            <div
              key={col.status}
              className={`w-72 flex flex-col bg-gray-850 rounded-xl border-t-2 ${col.color} bg-gray-800/50`}
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleDrop(e, col.status)}
            >
              <div className="p-3 border-b border-gray-700">
                <span className="text-sm font-semibold text-gray-300">{col.label}</span>
                <span className="ml-2 text-xs text-gray-500">{colTasks.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {colTasks.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={e => e.dataTransfer.setData('taskId', task.id)}
                  >
                    <TaskCard task={task} onClick={() => setActiveTask(task.id)} />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {activeTaskId && (
        <TaskDetail taskId={activeTaskId} onClose={() => setActiveTask(null)} />
      )}
    </div>
  )
}
