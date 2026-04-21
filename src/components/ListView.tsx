import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTaskStore } from '../store/tasks'
import { TaskCard } from './TaskCard'
import { TaskDetail } from './TaskDetail'

export function ListView() {
  const { tasks, activeListId, activeTaskId, setActiveTask, createTask } = useTaskStore()
  const [newTitle, setNewTitle] = useState('')

  const listTasks = activeListId
    ? tasks.filter(t => t.listId === activeListId && t.parentId === null)
    : []

  const grouped = {
    todo: listTasks.filter(t => t.status === 'todo'),
    in_progress: listTasks.filter(t => t.status === 'in_progress'),
    done: listTasks.filter(t => t.status === 'done'),
  }

  function handleAddTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim() || !activeListId) return
    createTask({
      title: newTitle.trim(),
      description: '',
      status: 'todo',
      priority: 'normal',
      listId: activeListId,
      parentId: null,
      dueDate: null,
      tags: [],
      timeEstimate: null,
      recurring: null,
    })
    setNewTitle('')
  }

  if (!activeListId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
        Select a list from the sidebar
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Add task */}
      <form onSubmit={handleAddTask} className="mb-4 flex gap-2">
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="Add task... (Enter to save)"
          className="flex-1 bg-gray-800 text-gray-200 text-sm rounded-lg px-3 py-2 border border-gray-600 outline-none focus:border-indigo-500 placeholder-gray-500"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg"
        >
          <Plus size={16} />
        </button>
      </form>

      {/* Groups */}
      {(['in_progress', 'todo', 'done'] as const).map(status => {
        const group = grouped[status]
        if (group.length === 0 && status === 'done') return null
        const labels = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' }
        return (
          <div key={status} className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {labels[status]} ({group.length})
            </h3>
            {group.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => setActiveTask(task.id)}
              />
            ))}
          </div>
        )
      })}

      {listTasks.length === 0 && (
        <div className="text-center text-gray-500 text-sm mt-8">
          No tasks yet. Add one above.
        </div>
      )}

      {activeTaskId && (
        <TaskDetail taskId={activeTaskId} onClose={() => setActiveTask(null)} />
      )}
    </div>
  )
}
