import Database from 'better-sqlite3'
import type { Space, Folder, TaskList, Task } from '../src/db/local'

let db: Database.Database

export function initDb(path = './data/adhd.db') {
  db = new Database(path)
  db.exec(`
    CREATE TABLE IF NOT EXISTS spaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      spaceId TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      folderId TEXT NOT NULL,
      color TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'todo',
      priority TEXT NOT NULL DEFAULT 'normal',
      listId TEXT NOT NULL,
      parentId TEXT,
      dueDate TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      timeEstimate INTEGER,
      timeSpent INTEGER NOT NULL DEFAULT 0,
      recurring TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)
}

function uid() { return crypto.randomUUID() }
function now() { return new Date().toISOString() }

// --- Spaces ---
export function getSpaces(): Space[] {
  return db.prepare('SELECT * FROM spaces ORDER BY createdAt').all() as Space[]
}
export function createSpace(name: string, color = '#6366f1'): Space {
  const space: Space = { id: uid(), name, color, createdAt: now() }
  db.prepare('INSERT INTO spaces VALUES (@id,@name,@color,@createdAt)').run(space)
  return space
}
export function deleteSpace(id: string): void {
  db.prepare('DELETE FROM spaces WHERE id=?').run(id)
}

// --- Folders ---
export function getFolders(spaceId?: string): Folder[] {
  if (spaceId) return db.prepare('SELECT * FROM folders WHERE spaceId=? ORDER BY createdAt').all(spaceId) as Folder[]
  return db.prepare('SELECT * FROM folders ORDER BY createdAt').all() as Folder[]
}
export function createFolder(name: string, spaceId: string): Folder {
  const folder: Folder = { id: uid(), name, spaceId, createdAt: now() }
  db.prepare('INSERT INTO folders VALUES (@id,@name,@spaceId,@createdAt)').run(folder)
  return folder
}
export function deleteFolder(id: string): void {
  db.prepare('DELETE FROM folders WHERE id=?').run(id)
}

// --- Lists ---
export function getLists(folderId?: string): TaskList[] {
  if (folderId) return db.prepare('SELECT * FROM lists WHERE folderId=? ORDER BY createdAt').all(folderId) as TaskList[]
  return db.prepare('SELECT * FROM lists ORDER BY createdAt').all() as TaskList[]
}
export function createList(name: string, folderId: string, color = '#8b5cf6'): TaskList {
  const list: TaskList = { id: uid(), name, folderId, color, createdAt: now() }
  db.prepare('INSERT INTO lists VALUES (@id,@name,@folderId,@color,@createdAt)').run(list)
  return list
}
export function deleteList(id: string): void {
  db.prepare('DELETE FROM lists WHERE id=?').run(id)
}

// --- Tasks ---
export function getTasks(listId?: string): Task[] {
  const rows = listId
    ? db.prepare('SELECT * FROM tasks WHERE listId=? ORDER BY createdAt').all(listId)
    : db.prepare('SELECT * FROM tasks ORDER BY createdAt').all()
  return (rows as any[]).map(r => ({ ...r, tags: JSON.parse(r.tags) }))
}
export function getTask(id: string): Task | null {
  const row = db.prepare('SELECT * FROM tasks WHERE id=?').get(id) as any
  return row ? { ...row, tags: JSON.parse(row.tags) } : null
}
export function createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'timeSpent'>): Task {
  const task: Task = { ...data, id: uid(), timeSpent: 0, createdAt: now(), updatedAt: now() }
  db.prepare(`INSERT INTO tasks VALUES (
    @id,@title,@description,@status,@priority,@listId,@parentId,
    @dueDate,@tags,@timeEstimate,@timeSpent,@recurring,@createdAt,@updatedAt
  )`).run({ ...task, tags: JSON.stringify(task.tags) })
  return task
}
export function updateTask(id: string, data: Partial<Omit<Task, 'id' | 'createdAt'>>): Task {
  const existing = getTask(id)
  if (!existing) throw new Error(`Task ${id} not found`)
  const updated: Task = { ...existing, ...data, updatedAt: now() }
  db.prepare(`UPDATE tasks SET
    title=@title,description=@description,status=@status,priority=@priority,
    listId=@listId,parentId=@parentId,dueDate=@dueDate,tags=@tags,
    timeEstimate=@timeEstimate,timeSpent=@timeSpent,recurring=@recurring,
    updatedAt=@updatedAt WHERE id=@id
  `).run({ ...updated, tags: JSON.stringify(updated.tags) })
  return updated
}
export function deleteTask(id: string): void {
  const toDelete = new Set([id])
  let changed = true
  while (changed) {
    changed = false
    for (const t of getTasks()) {
      if (t.parentId && toDelete.has(t.parentId) && !toDelete.has(t.id)) {
        toDelete.add(t.id); changed = true
      }
    }
  }
  for (const tid of toDelete) db.prepare('DELETE FROM tasks WHERE id=?').run(tid)
}

// --- Settings ---
export function getSetting(key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key=?').get(key) as any
  return row?.value ?? null
}
export function setSetting(key: string, value: string): void {
  db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run(key, value)
}
