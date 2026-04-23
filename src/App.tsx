import { useEffect, useState } from 'react'
import { Settings, Scale, ChefHat } from 'lucide-react'
import { useTaskStore } from './store/tasks'
import { Sidebar } from './components/Sidebar'
import { ListView } from './components/ListView'
import { BoardView } from './components/BoardView'
import { CalendarView } from './components/CalendarView'
import { FocusView } from './components/FocusView'
import { BrainDump } from './components/BrainDump'
import { AISettings } from './components/AISettings'
import { Judge } from './components/Judge'
import { ExecutiveChef } from './components/ExecutiveChef'
import { PromptModal } from './components/PromptModal'

export default function App() {
  const { load, view } = useTaskStore()
  const [showSettings, setShowSettings] = useState(false)
  const [showJudge, setShowJudge] = useState(false)
  const [showChef, setShowChef] = useState(false)

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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChef(true)}
              className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 px-2 py-1 rounded hover:bg-gray-800"
            >
              <ChefHat size={14} />
              Pick for me
            </button>
            <button
              onClick={() => setShowJudge(true)}
              className="flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 px-2 py-1 rounded hover:bg-gray-800"
            >
              <Scale size={14} />
              Judge Tone
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 px-2 py-1 rounded hover:bg-gray-800"
            >
              <Settings size={14} />
              Settings
            </button>
          </div>
        </header>

        <ViewComponent />

        {view !== 'focus' && <BrainDump />}
      </div>

      {showSettings && <AISettings onClose={() => setShowSettings(false)} />}
      {showJudge && <Judge onClose={() => setShowJudge(false)} />}
      {showChef && <ExecutiveChef onClose={() => setShowChef(false)} />}
      <PromptModal />
    </div>
  )
}
