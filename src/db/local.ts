// Local SQLite DB via better-sqlite3
// Falls back to localStorage in browser env

export interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'urgent' | 'high' | 'normal' | 'low'
  listId: string
  parentId: string | null
  dueDate: string | null
  tags: string[]
  timeEstimate: number | null // minutes
  timeSpent: number // minutes
  recurring: string | null // cron-like string
  createdAt: string
  updatedAt: string
}

export interface TaskList {
  id: string
  name: string
  folderId: string
  color: string
  createdAt: string
}

export interface Folder {
  id: string
  name: string
  spaceId: string
  createdAt: string
}

export interface Space {
  id: string
  name: string
  color: string
  createdAt: string
}

const TASKS_KEY = 'adhd_tasks'
const LISTS_KEY = 'adhd_lists'
const FOLDERS_KEY = 'adhd_folders'
const SPACES_KEY = 'adhd_spaces'

function load<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]')
  } catch {
    return []
  }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

function uid(): string {
  return crypto.randomUUID()
}

function now(): string {
  return new Date().toISOString()
}

// --- Spaces ---

export function getSpaces(): Space[] {
  return load<Space>(SPACES_KEY)
}

export function createSpace(name: string, color = '#6366f1'): Space {
  const space: Space = { id: uid(), name, color, createdAt: now() }
  save(SPACES_KEY, [...getSpaces(), space])
  return space
}

export function deleteSpace(id: string): void {
  save(SPACES_KEY, getSpaces().filter(s => s.id !== id))
}

// --- Folders ---

export function getFolders(spaceId?: string): Folder[] {
  const all = load<Folder>(FOLDERS_KEY)
  return spaceId ? all.filter(f => f.spaceId === spaceId) : all
}

export function createFolder(name: string, spaceId: string): Folder {
  const folder: Folder = { id: uid(), name, spaceId, createdAt: now() }
  save(FOLDERS_KEY, [...getFolders(), folder])
  return folder
}

export function deleteFolder(id: string): void {
  save(FOLDERS_KEY, getFolders().filter(f => f.id !== id))
}

// --- Lists ---

export function getLists(folderId?: string): TaskList[] {
  const all = load<TaskList>(LISTS_KEY)
  return folderId ? all.filter(l => l.folderId === folderId) : all
}

export function createList(name: string, folderId: string, color = '#8b5cf6'): TaskList {
  const list: TaskList = { id: uid(), name, folderId, color, createdAt: now() }
  save(LISTS_KEY, [...getLists(), list])
  return list
}

export function deleteList(id: string): void {
  save(LISTS_KEY, getLists().filter(l => l.id !== id))
}

// --- Tasks ---

export function getTasks(listId?: string): Task[] {
  const all = load<Task>(TASKS_KEY)
  return listId ? all.filter(t => t.listId === listId) : all
}

export function getTask(id: string): Task | null {
  return getTasks().find(t => t.id === id) ?? null
}

export function getSubtasks(parentId: string): Task[] {
  return getTasks().filter(t => t.parentId === parentId)
}

export function createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'timeSpent'>): Task {
  const task: Task = {
    ...data,
    id: uid(),
    timeSpent: 0,
    createdAt: now(),
    updatedAt: now(),
  }
  save(TASKS_KEY, [...getTasks(), task])
  return task
}

export function updateTask(id: string, data: Partial<Omit<Task, 'id' | 'createdAt'>>): Task {
  const tasks = getTasks()
  const idx = tasks.findIndex(t => t.id === id)
  if (idx === -1) throw new Error(`Task ${id} not found`)
  const updated: Task = { ...tasks[idx], ...data, updatedAt: now() }
  const next = [...tasks.slice(0, idx), updated, ...tasks.slice(idx + 1)]
  save(TASKS_KEY, next)
  return updated
}

export function deleteTask(id: string): void {
  // Also delete subtasks
  const all = getTasks()
  const toDelete = new Set<string>([id])
  // Collect subtasks recursively
  let changed = true
  while (changed) {
    changed = false
    for (const t of all) {
      if (t.parentId && toDelete.has(t.parentId) && !toDelete.has(t.id)) {
        toDelete.add(t.id)
        changed = true
      }
    }
  }
  save(TASKS_KEY, all.filter(t => !toDelete.has(t.id)))
}

// --- Seed default data if empty ---

export function seedIfEmpty(): void {
  if (getSpaces().length > 0) return
  const space = createSpace('My Brain', '#6366f1')
  const folder = createFolder('Work', space.id)
  const list = createList('Tasks', folder.id, '#8b5cf6')
  createTask({
    title: 'Welcome to ADHD Brain',
    description: 'Click a task to see AI tools. Break it down. Estimate time. Focus.',
    status: 'todo',
    priority: 'normal',
    listId: list.id,
    parentId: null,
    dueDate: null,
    tags: ['welcome'],
    timeEstimate: 5,
    recurring: null,
  })
}
