import { describe, it, expect, beforeEach } from 'vitest'
import { initDb, getSpaces, createSpace, deleteSpace, getFolders, createFolder, getLists, createList, getTasks, createTask, updateTask, deleteTask, getTask, getSetting, setSetting } from './db'

describe('spaces', () => {
  beforeEach(() => initDb(':memory:'))

  it('returns empty array initially', () => {
    expect(getSpaces()).toEqual([])
  })

  it('createSpace returns space with id', () => {
    const s = createSpace('Test', '#fff')
    expect(s.id).toBeTruthy()
    expect(s.name).toBe('Test')
    expect(s.color).toBe('#fff')
  })

  it('getSpaces returns all created spaces', () => {
    createSpace('A', '#000')
    createSpace('B', '#111')
    expect(getSpaces()).toHaveLength(2)
  })

  it('deleteSpace removes it', () => {
    const s = createSpace('X', '#000')
    deleteSpace(s.id)
    expect(getSpaces()).toHaveLength(0)
  })
})

describe('tasks', () => {
  beforeEach(() => initDb(':memory:'))

  it('createTask stores and retrieves task', () => {
    const space = createSpace('S', '#fff')
    const folder = createFolder('F', space.id)
    const list = createList('L', folder.id)
    const task = createTask({
      title: 'Test task',
      description: '',
      status: 'todo',
      priority: 'normal',
      listId: list.id,
      parentId: null,
      dueDate: null,
      tags: ['a', 'b'],
      timeEstimate: 30,
      recurring: null,
    })
    expect(task.id).toBeTruthy()
    expect(task.tags).toEqual(['a', 'b'])
    expect(getTask(task.id)).toMatchObject({ title: 'Test task' })
  })

  it('updateTask merges fields', () => {
    const space = createSpace('S', '#fff')
    const folder = createFolder('F', space.id)
    const list = createList('L', folder.id)
    const task = createTask({ title: 'Old', description: '', status: 'todo', priority: 'normal', listId: list.id, parentId: null, dueDate: null, tags: [], timeEstimate: null, recurring: null })
    const updated = updateTask(task.id, { title: 'New', status: 'done' })
    expect(updated.title).toBe('New')
    expect(updated.status).toBe('done')
  })

  it('deleteTask also deletes subtasks', () => {
    const space = createSpace('S', '#fff')
    const folder = createFolder('F', space.id)
    const list = createList('L', folder.id)
    const parent = createTask({ title: 'Parent', description: '', status: 'todo', priority: 'normal', listId: list.id, parentId: null, dueDate: null, tags: [], timeEstimate: null, recurring: null })
    const child = createTask({ title: 'Child', description: '', status: 'todo', priority: 'normal', listId: list.id, parentId: parent.id, dueDate: null, tags: [], timeEstimate: null, recurring: null })
    deleteTask(parent.id)
    expect(getTask(parent.id)).toBeNull()
    expect(getTask(child.id)).toBeNull()
  })
})

describe('settings', () => {
  beforeEach(() => initDb(':memory:'))

  it('getSetting returns null for unknown key', () => {
    expect(getSetting('missing')).toBeNull()
  })

  it('setSetting then getSetting round-trips value', () => {
    setSetting('ai_provider', 'ollama')
    expect(getSetting('ai_provider')).toBe('ollama')
  })

  it('setSetting overwrites existing value', () => {
    setSetting('key', 'v1')
    setSetting('key', 'v2')
    expect(getSetting('key')).toBe('v2')
  })
})
