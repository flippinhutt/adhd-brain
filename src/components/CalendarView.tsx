import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTaskStore } from '../store/tasks'
import { TaskDetail } from './TaskDetail'

export function CalendarView() {
  const { tasks, activeListId, activeTaskId, setActiveTask } = useTaskStore()
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const listTasks = activeListId
    ? tasks.filter(t => t.listId === activeListId && t.dueDate)
    : tasks.filter(t => t.dueDate)

  function tasksOnDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return listTasks.filter(t => t.dueDate?.startsWith(dateStr))
  }

  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December']
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      {/* Nav */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
          className="text-gray-400 hover:text-gray-200"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold text-gray-100">
          {MONTHS[month]} {year}
        </h2>
        <button
          onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
          className="text-gray-400 hover:text-gray-200"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs text-gray-500 font-medium py-1">{d}</div>
        ))}

        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const dayTasks = tasksOnDay(day)
          const isToday =
            day === new Date().getDate() &&
            month === new Date().getMonth() &&
            year === new Date().getFullYear()

          return (
            <div
              key={day}
              className={`min-h-16 p-1 rounded border ${
                isToday ? 'border-indigo-500 bg-indigo-950/30' : 'border-gray-700'
              }`}
            >
              <span className={`text-xs font-medium ${isToday ? 'text-indigo-400' : 'text-gray-400'}`}>
                {day}
              </span>
              <div className="mt-0.5 space-y-0.5">
                {dayTasks.slice(0, 3).map(task => (
                  <div
                    key={task.id}
                    onClick={() => setActiveTask(task.id)}
                    className="text-xs px-1 py-0.5 rounded bg-indigo-600/60 text-indigo-200 truncate cursor-pointer hover:bg-indigo-600"
                  >
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-gray-500">+{dayTasks.length - 3} more</div>
                )}
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
