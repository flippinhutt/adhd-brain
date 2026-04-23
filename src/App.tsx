import { useEffect, useState } from 'react'
import { Settings } from 'lucide-react'
import { useTaskStore } from './store/tasks'
import { Sidebar } from './components/Sidebar'
import { ListView } from './components/ListView'
import { BoardView } from './components/BoardView'
import { CalendarView } from './components/CalendarView'
import { FocusView } from './components/FocusView'
import { BrainDump } from './components/BrainDump'
import { AISettings } from './components/AISettings'

export default function App() {
  const { load, view } = useTaskStore()
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => { void load() }, [load])

  const ViewComponent = {
    list: ListView,
    board: BoardView,
    calendar: CalendarView,
    focus: FocusView,
  }[view]

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-900">
          <h1 className="text-sm font-semibold text-gray-300 capitalize">
            {view} view
          </h1>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 px-2 py-1 rounded hover:bg-gray-800"
          >
            <Settings size={14} />
            AI Settings
          </button>
        </header>

        <ViewComponent />

        {view !== 'focus' && <BrainDump />}
      </div>

      {showSettings && <AISettings onClose={() => setShowSettings(false)} />}
    </div>
  )
}
