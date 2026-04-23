import { create } from 'zustand'
import * as db from '../db/api'

interface TaskStore {
  spaces: db.Space[]
  folders: db.Folder[]
  lists: db.TaskList[]
  tasks: db.Task[]
  activeSpaceId: string | null
  activeFolderId: string | null
  activeListId: string | null
  activeTaskId: string | null
  view: 'list' | 'board' | 'calendar' | 'focus'

  load: () => Promise<void>
  setActiveSpace: (id: string | null) => void
  setActiveFolder: (id: string | null) => void
  setActiveList: (id: string | null) => void
  setActiveTask: (id: string | null) => void
  setView: (view: TaskStore['view']) => void

  createSpace: (name: string, color?: string) => Promise<db.Space>
  createFolder: (name: string, spaceId: string) => Promise<db.Folder>
  createList: (name: string, folderId: string, color?: string) => Promise<db.TaskList>
  createTask: (data: Omit<db.Task, 'id' | 'createdAt' | 'updatedAt' | 'timeSpent'>) => Promise<db.Task>
  updateTask: (id: string, data: Partial<db.Task>) => Promise<db.Task>
  deleteTask: (id: string) => Promise<void>
  deleteSpace: (id: string) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  deleteList: (id: string) => Promise<void>
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  spaces: [],
  folders: [],
  lists: [],
  tasks: [],
  activeSpaceId: null,
  activeFolderId: null,
  activeListId: null,
  activeTaskId: null,
  view: 'list',

  load: async () => {
    const [spaces, folders, lists, tasks] = await Promise.all([
      db.getSpaces(), db.getFolders(), db.getLists(), db.getTasks(),
    ])
    const activeSpaceId = spaces[0]?.id ?? null
    const activeFolderId = folders.find(f => f.spaceId === activeSpaceId)?.id ?? null
    const activeListId = lists.find(l => l.folderId === activeFolderId)?.id ?? null
    set({ spaces, folders, lists, tasks, activeSpaceId, activeFolderId, activeListId })
  },

  setActiveSpace: (id) => set({ activeSpaceId: id, activeFolderId: null, activeListId: null }),
  setActiveFolder: (id) => set({ activeFolderId: id, activeListId: null }),
  setActiveList: (id) => set({ activeListId: id }),
  setActiveTask: (id) => set({ activeTaskId: id }),
  setView: (view) => set({ view }),

  createSpace: async (name, color) => {
    const space = await db.createSpace(name, color)
    set({ spaces: await db.getSpaces() })
    return space
  },

  createFolder: async (name, spaceId) => {
    const folder = await db.createFolder(name, spaceId)
    set({ folders: await db.getFolders() })
    return folder
  },

  createList: async (name, folderId, color) => {
    const list = await db.createList(name, folderId, color)
    set({ lists: await db.getLists() })
    return list
  },

  createTask: async (data) => {
    const task = await db.createTask(data)
    set({ tasks: await db.getTasks() })
    return task
  },

  updateTask: async (id, data) => {
    const task = await db.updateTask(id, data)
    let tasks = await db.getTasks()
    
    // Basic Automation: Auto-update parent task status based on subtasks
    if (task.parentId && data.status) {
      const parentId = task.parentId
      const parent = tasks.find(t => t.id === parentId)
      if (parent) {
        const subtasks = tasks.filter(t => t.parentId === parentId)
        const allDone = subtasks.length > 0 && subtasks.every(t => t.status === 'done')
        const anyStarted = subtasks.some(t => t.status !== 'todo')
        
        let newParentStatus = parent.status
        if (allDone) {
          newParentStatus = 'done'
        } else if (parent.status === 'done' && !allDone) {
          newParentStatus = 'in_progress'
        } else if (parent.status === 'todo' && anyStarted) {
          newParentStatus = 'in_progress'
        }

        if (newParentStatus !== parent.status) {
          await db.updateTask(parentId, { status: newParentStatus })
          tasks = await db.getTasks()
        }
      }
    }

    set({ tasks })
    return task
  },

  deleteTask: async (id) => {
    await db.deleteTask(id)
    const { activeTaskId } = get()
    set({ tasks: await db.getTasks(), activeTaskId: activeTaskId === id ? null : activeTaskId })
  },

  deleteSpace: async (id) => {
    await db.deleteSpace(id)
    set({ spaces: await db.getSpaces() })
  },

  deleteFolder: async (id) => {
    await db.deleteFolder(id)
    set({ folders: await db.getFolders() })
  },

  deleteList: async (id) => {
    await db.deleteList(id)
    set({ lists: await db.getLists() })
  },
}))
