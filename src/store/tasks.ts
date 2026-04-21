import { create } from 'zustand'
import * as db from '../db/local'

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

  load: () => void
  setActiveSpace: (id: string | null) => void
  setActiveFolder: (id: string | null) => void
  setActiveList: (id: string | null) => void
  setActiveTask: (id: string | null) => void
  setView: (view: TaskStore['view']) => void

  createSpace: (name: string, color?: string) => db.Space
  createFolder: (name: string, spaceId: string) => db.Folder
  createList: (name: string, folderId: string, color?: string) => db.TaskList
  createTask: (data: Omit<db.Task, 'id' | 'createdAt' | 'updatedAt' | 'timeSpent'>) => db.Task
  updateTask: (id: string, data: Partial<db.Task>) => db.Task
  deleteTask: (id: string) => void
  deleteSpace: (id: string) => void
  deleteFolder: (id: string) => void
  deleteList: (id: string) => void
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

  load: () => {
    db.seedIfEmpty()
    const spaces = db.getSpaces()
    const folders = db.getFolders()
    const lists = db.getLists()
    const tasks = db.getTasks()
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

  createSpace: (name, color) => {
    const space = db.createSpace(name, color)
    set({ spaces: db.getSpaces() })
    return space
  },

  createFolder: (name, spaceId) => {
    const folder = db.createFolder(name, spaceId)
    set({ folders: db.getFolders() })
    return folder
  },

  createList: (name, folderId, color) => {
    const list = db.createList(name, folderId, color)
    set({ lists: db.getLists() })
    return list
  },

  createTask: (data) => {
    const task = db.createTask(data)
    set({ tasks: db.getTasks() })
    return task
  },

  updateTask: (id, data) => {
    const task = db.updateTask(id, data)
    set({ tasks: db.getTasks() })
    return task
  },

  deleteTask: (id) => {
    db.deleteTask(id)
    const { activeTaskId } = get()
    set({ tasks: db.getTasks(), activeTaskId: activeTaskId === id ? null : activeTaskId })
  },

  deleteSpace: (id) => {
    db.deleteSpace(id)
    set({ spaces: db.getSpaces() })
  },

  deleteFolder: (id) => {
    db.deleteFolder(id)
    set({ folders: db.getFolders() })
  },

  deleteList: (id) => {
    db.deleteList(id)
    set({ lists: db.getLists() })
  },
}))
