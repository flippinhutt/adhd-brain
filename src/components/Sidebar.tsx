import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Folder, List, Zap } from 'lucide-react'
import { useTaskStore } from '../store/tasks'

export function Sidebar() {
  const {
    spaces, folders, lists,
    activeSpaceId, activeFolderId, activeListId,
    setActiveSpace, setActiveFolder, setActiveList, view, setView,
    createSpace, createFolder, createList,
  } = useTaskStore()

  const [expandedSpaces, setExpandedSpaces] = useState<Set<string>>(new Set())
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  function toggleSpace(id: string) {
    setExpandedSpaces(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleFolder(id: string) {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleAddSpace() {
    const name = prompt('Space name?')
    if (!name) return
    const space = await createSpace(name)
    setActiveSpace(space.id)
    setExpandedSpaces(prev => new Set([...prev, space.id]))
  }

  async function handleAddFolder(spaceId: string) {
    const name = prompt('Folder name?')
    if (!name) return
    const folder = await createFolder(name, spaceId)
    setActiveFolder(folder.id)
    setExpandedFolders(prev => new Set([...prev, folder.id]))
  }

  async function handleAddList(folderId: string) {
    const name = prompt('List name?')
    if (!name) return
    const list = await createList(name, folderId)
    setActiveList(list.id)
  }

  const views: Array<{ id: typeof view; label: string }> = [
    { id: 'list', label: 'List' },
    { id: 'board', label: 'Board' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'focus', label: 'Focus' },
  ]

  return (
    <aside className="w-64 bg-gray-900 text-gray-100 flex flex-col h-screen border-r border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2 font-bold text-lg text-indigo-400">
          <Zap size={20} />
          ADHD Brain
        </div>
      </div>

      {/* View switcher */}
      <div className="p-2 border-b border-gray-700">
        <div className="flex gap-1">
          {views.map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`flex-1 text-xs py-1 rounded transition-colors ${
                view === v.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tree */}
      <nav className="flex-1 overflow-y-auto p-2">
        {spaces.map(space => {
          const spaceFolders = folders.filter(f => f.spaceId === space.id)
          const isExpanded = expandedSpaces.has(space.id)
          return (
            <div key={space.id}>
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer group hover:bg-gray-800 ${
                  activeSpaceId === space.id ? 'bg-gray-800' : ''
                }`}
              >
                <button onClick={() => toggleSpace(space.id)} className="text-gray-400">
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <span
                  className="flex-1 text-sm font-medium truncate"
                  onClick={() => { setActiveSpace(space.id); toggleSpace(space.id) }}
                  style={{ color: space.color }}
                >
                  {space.name}
                </span>
                <button
                  onClick={() => handleAddFolder(space.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-300"
                >
                  <Plus size={12} />
                </button>
              </div>

              {isExpanded && spaceFolders.map(folder => {
                const folderLists = lists.filter(l => l.folderId === folder.id)
                const isFolderExpanded = expandedFolders.has(folder.id)
                return (
                  <div key={folder.id} className="ml-4">
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer group hover:bg-gray-800 ${
                        activeFolderId === folder.id ? 'bg-gray-800' : ''
                      }`}
                    >
                      <button onClick={() => toggleFolder(folder.id)} className="text-gray-400">
                        {isFolderExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </button>
                      <Folder size={12} className="text-yellow-400 shrink-0" />
                      <span
                        className="flex-1 text-xs truncate text-gray-300"
                        onClick={() => { setActiveFolder(folder.id); toggleFolder(folder.id) }}
                      >
                        {folder.name}
                      </span>
                      <button
                        onClick={() => handleAddList(folder.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-300"
                      >
                        <Plus size={10} />
                      </button>
                    </div>

                    {isFolderExpanded && folderLists.map(list => (
                      <div
                        key={list.id}
                        className={`ml-4 flex items-center gap-1 px-2 py-1 rounded cursor-pointer hover:bg-gray-800 ${
                          activeListId === list.id ? 'bg-gray-800 text-white' : 'text-gray-400'
                        }`}
                        onClick={() => setActiveList(list.id)}
                      >
                        <List size={10} style={{ color: list.color }} />
                        <span className="text-xs truncate">{list.name}</span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )
        })}

        <button
          onClick={handleAddSpace}
          className="mt-2 w-full flex items-center gap-2 px-2 py-1 text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded"
        >
          <Plus size={12} /> Add Space
        </button>
      </nav>
    </aside>
  )
}
