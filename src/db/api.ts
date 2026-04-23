import type { Space, Folder, TaskList, Task } from './local'

const BASE = '/api'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
  return res.json()
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`)
  return res.json()
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`)
  return res.json()
}

async function del(path: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`)
}

// Spaces
export const getSpaces = () => get<Space[]>('/spaces')
export const createSpace = (name: string, color?: string) => post<Space>('/spaces', { name, color })
export const deleteSpace = (id: string) => del(`/spaces/${id}`)

// Folders
export const getFolders = (spaceId?: string) =>
  get<Folder[]>(spaceId ? `/folders?spaceId=${spaceId}` : '/folders')
export const createFolder = (name: string, spaceId: string) => post<Folder>('/folders', { name, spaceId })
export const deleteFolder = (id: string) => del(`/folders/${id}`)

// Lists
export const getLists = (folderId?: string) =>
  get<TaskList[]>(folderId ? `/lists?folderId=${folderId}` : '/lists')
export const createList = (name: string, folderId: string, color?: string) =>
  post<TaskList>('/lists', { name, folderId, color })
export const deleteList = (id: string) => del(`/lists/${id}`)

// Tasks
export const getTasks = (listId?: string) =>
  get<Task[]>(listId ? `/tasks?listId=${listId}` : '/tasks')
export const getTask = (id: string) => get<Task>(`/tasks/${id}`)
export const createTask = (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'timeSpent'>) =>
  post<Task>('/tasks', data)
export const updateTask = (id: string, data: Partial<Task>) =>
  patch<Task>(`/tasks/${id}`, data)
export const deleteTask = (id: string) => del(`/tasks/${id}`)

// Settings
export const getSetting = (key: string) =>
  get<{ value: string }>(`/settings/${key}`).then(r => r.value).catch(() => null)
export const setSetting = (key: string, value: string) =>
  fetch(`${BASE}/settings/${key}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value }),
  })

// Seed helper (server handles this now, but expose no-op for compat)
export function seedIfEmpty() { /* server seeds on first request */ }
export type { Space, Folder, TaskList, Task } from './local'
