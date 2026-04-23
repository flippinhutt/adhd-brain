# Backend + Docker Migration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace localStorage with a shared Express+SQLite backend, served via Docker Compose for cross-device sync.

**Architecture:** React frontend (nginx) talks to Express API (Node) over REST. Both run as Docker services sharing a named volume for the SQLite file. In dev, Vite proxies `/api` to `localhost:3001`.

**Tech Stack:** React + Vite + Zustand (frontend), Express + better-sqlite3 (backend, `better-sqlite3` already installed), Docker Compose, nginx

---

## New Packages Needed

**Ask user approval before installing:**
```bash
npm install express cors
npm install --save-dev @types/express @types/cors tsx
```

---

## File Map

```
adhd-brain/
├── server/
│   ├── db.ts          ← SQLite schema + raw queries
│   ├── routes.ts      ← Express router (all CRUD + AI proxy)
│   └── index.ts       ← Express app entry point
├── src/
│   ├── db/
│   │   ├── local.ts   ← keep types only, delete all localStorage code
│   │   └── api.ts     ← NEW: fetch wrappers matching old local.ts API
│   ├── store/
│   │   └── tasks.ts   ← make all mutations async
│   └── ai/
│       └── provider.ts ← route AI calls through /api/ai
├── Dockerfile.api
├── Dockerfile.frontend
├── docker-compose.yml
├── nginx.conf
└── vite.config.ts     ← add /api proxy
```

---

## Task 1: Express + SQLite server skeleton

**Packages:** get user approval first (see above).

**Files:**
- Create: `server/db.ts`

**Step 1: Write failing test**

Create `server/db.test.ts`:
```typescript
import { initDb, getSpaces, createSpace } from './db'

test('createSpace returns space with id', () => {
  initDb(':memory:')
  const s = createSpace('Test', '#fff')
  expect(s.id).toBeTruthy()
  expect(s.name).toBe('Test')
})

test('getSpaces returns created spaces', () => {
  initDb(':memory:')
  createSpace('A', '#000')
  createSpace('B', '#111')
  expect(getSpaces()).toHaveLength(2)
})
```

**Step 2: Run test — confirm FAIL**
```bash
npx jest server/db.test.ts
```
Expected: `Cannot find module './db'`

**Step 3: Implement `server/db.ts`**
```typescript
import Database from 'better-sqlite3'

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
export function getSpaces() {
  return db.prepare('SELECT * FROM spaces ORDER BY createdAt').all() as Space[]
}
export function createSpace(name: string, color = '#6366f1'): Space {
  const space = { id: uid(), name, color, createdAt: now() }
  db.prepare('INSERT INTO spaces VALUES (@id,@name,@color,@createdAt)').run(space)
  return space
}
export function deleteSpace(id: string) {
  db.prepare('DELETE FROM spaces WHERE id=?').run(id)
}

// --- Folders ---
export function getFolders(spaceId?: string) {
  if (spaceId) return db.prepare('SELECT * FROM folders WHERE spaceId=? ORDER BY createdAt').all(spaceId) as Folder[]
  return db.prepare('SELECT * FROM folders ORDER BY createdAt').all() as Folder[]
}
export function createFolder(name: string, spaceId: string): Folder {
  const folder = { id: uid(), name, spaceId, createdAt: now() }
  db.prepare('INSERT INTO folders VALUES (@id,@name,@spaceId,@createdAt)').run(folder)
  return folder
}
export function deleteFolder(id: string) {
  db.prepare('DELETE FROM folders WHERE id=?').run(id)
}

// --- Lists ---
export function getLists(folderId?: string) {
  if (folderId) return db.prepare('SELECT * FROM lists WHERE folderId=? ORDER BY createdAt').all(folderId) as TaskList[]
  return db.prepare('SELECT * FROM lists ORDER BY createdAt').all() as TaskList[]
}
export function createList(name: string, folderId: string, color = '#8b5cf6'): TaskList {
  const list = { id: uid(), name, folderId, color, createdAt: now() }
  db.prepare('INSERT INTO lists VALUES (@id,@name,@folderId,@color,@createdAt)').run(list)
  return list
}
export function deleteList(id: string) {
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
export function deleteTask(id: string) {
  const toDelete = new Set([id])
  let changed = true
  while (changed) {
    changed = false
    const all = getTasks()
    for (const t of all) {
      if (t.parentId && toDelete.has(t.parentId) && !toDelete.has(t.id)) {
        toDelete.add(t.id); changed = true
      }
    }
  }
  for (const tid of toDelete) db.prepare('DELETE FROM tasks WHERE id=?').run(tid)
}

// --- Settings (for AI config) ---
export function getSetting(key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key=?').get(key) as any
  return row?.value ?? null
}
export function setSetting(key: string, value: string) {
  db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run(key, value)
}

// Re-export types from src for co-location
export type { Space, Folder, TaskList, Task } from '../src/db/local'
```

**Step 4: Run test — confirm PASS**
```bash
npx jest server/db.test.ts
```

**Step 5: Commit**
```bash
git add server/db.ts server/db.test.ts
git commit -m "feat: SQLite backend db layer"
```

---

## Task 2: Express routes

**Files:**
- Create: `server/routes.ts`
- Create: `server/routes.test.ts`

**Step 1: Write failing tests**

Create `server/routes.test.ts`:
```typescript
import request from 'supertest'
import { buildApp } from './index'

let app: Express.Application

beforeEach(() => { app = buildApp(':memory:') })

test('GET /api/spaces returns []', async () => {
  const res = await request(app).get('/api/spaces')
  expect(res.status).toBe(200)
  expect(res.body).toEqual([])
})

test('POST /api/spaces creates space', async () => {
  const res = await request(app).post('/api/spaces').send({ name: 'Work', color: '#fff' })
  expect(res.status).toBe(201)
  expect(res.body.name).toBe('Work')
})

test('DELETE /api/spaces/:id removes space', async () => {
  const created = await request(app).post('/api/spaces').send({ name: 'X', color: '#000' })
  await request(app).delete(`/api/spaces/${created.body.id}`)
  const list = await request(app).get('/api/spaces')
  expect(list.body).toHaveLength(0)
})
```

**Note:** needs `supertest` — ask user approval: `npm install --save-dev supertest @types/supertest`

**Step 2: Run — confirm FAIL**
```bash
npx jest server/routes.test.ts
```

**Step 3: Implement `server/routes.ts`**
```typescript
import { Router } from 'express'
import * as db from './db'

export function buildRouter(): Router {
  const r = Router()

  // Spaces
  r.get('/spaces', (_, res) => res.json(db.getSpaces()))
  r.post('/spaces', (req, res) => res.status(201).json(db.createSpace(req.body.name, req.body.color)))
  r.delete('/spaces/:id', (req, res) => { db.deleteSpace(req.params.id); res.sendStatus(204) })

  // Folders
  r.get('/folders', (req, res) => res.json(db.getFolders(req.query.spaceId as string)))
  r.post('/folders', (req, res) => res.status(201).json(db.createFolder(req.body.name, req.body.spaceId)))
  r.delete('/folders/:id', (req, res) => { db.deleteFolder(req.params.id); res.sendStatus(204) })

  // Lists
  r.get('/lists', (req, res) => res.json(db.getLists(req.query.folderId as string)))
  r.post('/lists', (req, res) => res.status(201).json(db.createList(req.body.name, req.body.folderId, req.body.color)))
  r.delete('/lists/:id', (req, res) => { db.deleteList(req.params.id); res.sendStatus(204) })

  // Tasks
  r.get('/tasks', (req, res) => res.json(db.getTasks(req.query.listId as string)))
  r.get('/tasks/:id', (req, res) => {
    const t = db.getTask(req.params.id)
    t ? res.json(t) : res.sendStatus(404)
  })
  r.post('/tasks', (req, res) => res.status(201).json(db.createTask(req.body)))
  r.patch('/tasks/:id', (req, res) => res.json(db.updateTask(req.params.id, req.body)))
  r.delete('/tasks/:id', (req, res) => { db.deleteTask(req.params.id); res.sendStatus(204) })

  // AI config (stored server-side so it syncs across devices)
  r.get('/settings/:key', (req, res) => {
    const v = db.getSetting(req.params.key)
    v !== null ? res.json({ value: v }) : res.sendStatus(404)
  })
  r.put('/settings/:key', (req, res) => {
    db.setSetting(req.params.key, req.body.value)
    res.sendStatus(204)
  })

  return r
}
```

**Step 4: Create `server/index.ts`**
```typescript
import express from 'express'
import cors from 'cors'
import { initDb } from './db'
import { buildRouter } from './routes'

export function buildApp(dbPath?: string) {
  initDb(dbPath)
  const app = express()
  app.use(cors())
  app.use(express.json())
  app.use('/api', buildRouter())
  return app
}

if (process.env.NODE_ENV !== 'test') {
  const port = process.env.PORT ?? 3001
  buildApp(process.env.DB_PATH ?? './data/adhd.db').listen(port, () =>
    console.log(`API running on :${port}`)
  )
}
```

**Step 5: Run tests — confirm PASS**
```bash
npx jest server/
```

**Step 6: Verify server starts**
```bash
npx tsx server/index.ts
# Should print: API running on :3001
# Ctrl+C to stop
```

**Step 7: Commit**
```bash
git add server/
git commit -m "feat: Express REST API with SQLite"
```

---

## Task 3: Frontend API client

**Files:**
- Create: `src/db/api.ts`
- Modify: `src/db/local.ts` — delete all localStorage/implementation code, keep only type exports

**Step 1: Strip `src/db/local.ts` down to types only**

Replace entire file contents with:
```typescript
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
  timeEstimate: number | null
  timeSpent: number
  recurring: string | null
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
```

**Step 2: Create `src/db/api.ts`**
```typescript
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
```

**Step 3: Commit**
```bash
git add src/db/local.ts src/db/api.ts
git commit -m "feat: frontend API client, strip localStorage from db layer"
```

---

## Task 4: Make Zustand store async

**Files:**
- Modify: `src/store/tasks.ts`

The store currently calls sync `db.*` functions. Swap import and make everything async.

**Step 1: Update `src/store/tasks.ts`**

Change import line at top:
```typescript
import * as db from '../db/api'
```

Update `TaskStore` interface — all mutations return `Promise`:
```typescript
load: () => Promise<void>
createSpace: (name: string, color?: string) => Promise<db.Space>
createFolder: (name: string, spaceId: string) => Promise<db.Folder>
createList: (name: string, folderId: string, color?: string) => Promise<db.TaskList>
createTask: (data: Omit<db.Task, 'id' | 'createdAt' | 'updatedAt' | 'timeSpent'>) => Promise<db.Task>
updateTask: (id: string, data: Partial<db.Task>) => Promise<db.Task>
deleteTask: (id: string) => Promise<void>
deleteSpace: (id: string) => Promise<void>
deleteFolder: (id: string) => Promise<void>
deleteList: (id: string) => Promise<void>
```

Update all implementations to use `await`:
```typescript
load: async () => {
  const [spaces, folders, lists, tasks] = await Promise.all([
    db.getSpaces(), db.getFolders(), db.getLists(), db.getTasks(),
  ])
  const activeSpaceId = spaces[0]?.id ?? null
  const activeFolderId = folders.find(f => f.spaceId === activeSpaceId)?.id ?? null
  const activeListId = lists.find(l => l.folderId === activeFolderId)?.id ?? null
  set({ spaces, folders, lists, tasks, activeSpaceId, activeFolderId, activeListId })
},

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
  set({ tasks: await db.getTasks() })
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
```

**Step 2: Fix TypeScript errors**

Run `npx tsc --noEmit` and fix any `await` call sites in components (e.g. `onClick={() => store.deleteTask(id)}` → `onClick={() => void store.deleteTask(id)}`).

**Step 3: Commit**
```bash
git add src/store/tasks.ts src/components/
git commit -m "feat: async Zustand store using REST API"
```

---

## Task 5: Move AI config to server

**Files:**
- Modify: `src/ai/provider.ts`

Replace localStorage reads/writes with `getSetting`/`setSetting` from `src/db/api.ts`.

**Step 1: Update `getAIConfig` and `setAIConfig`**
```typescript
import { getSetting, setSetting } from '../db/api'

export async function getAIConfig(): Promise<AIConfig> {
  const provider = ((await getSetting('ai_provider')) as AIProvider) ?? 'ollama'
  const raw = await getSetting(`ai_config_${provider}`)
  const cfg = raw ? JSON.parse(raw) : { model: DEFAULTS[provider].model, baseUrl: DEFAULTS[provider].baseUrl }
  return { provider, ...cfg }
}

export async function setAIConfig(config: Partial<AIConfig> & { provider: AIProvider }): Promise<void> {
  await setSetting('ai_provider', config.provider)
  const existing = await getProviderConfig(config.provider)
  const updated = {
    model: config.model ?? existing.model,
    apiKey: config.apiKey !== undefined ? config.apiKey : existing.apiKey,
    baseUrl: config.baseUrl !== undefined ? config.baseUrl : existing.baseUrl,
  }
  await setSetting(`ai_config_${config.provider}`, JSON.stringify(updated))
}

export async function getProviderConfig(p: AIProvider) {
  const raw = await getSetting(`ai_config_${p}`)
  if (raw) { try { return JSON.parse(raw) } catch { /* fall through */ } }
  return { model: DEFAULTS[p].model, baseUrl: DEFAULTS[p].baseUrl }
}
```

Make `aiComplete` async (it already is) — just update its `getAIConfig()` call to `await getAIConfig()`.

**Step 2: Update `AISettings.tsx` call sites** to `await setAIConfig(...)`.

**Step 3: Commit**
```bash
git add src/ai/provider.ts src/components/AISettings.tsx
git commit -m "feat: AI config persisted server-side"
```

---

## Task 6: Vite proxy for dev

**Files:**
- Modify: `vite.config.ts`

**Step 1: Read current vite.config.ts and add proxy**
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

**Step 2: Test dev flow**
```bash
# Terminal 1
npx tsx server/index.ts

# Terminal 2
npm run dev
```

Open `http://localhost:5173` — app should load, create a task, reload — task persists.

**Step 3: Commit**
```bash
git add vite.config.ts
git commit -m "feat: Vite proxy /api to Express backend"
```

---

## Task 7: Docker setup

**Files:**
- Create: `Dockerfile.api`
- Create: `Dockerfile.frontend`
- Create: `nginx.conf`
- Create: `docker-compose.yml`
- Create: `.dockerignore`

**Step 1: Create `Dockerfile.api`**
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY server/ ./server/
COPY src/db/local.ts ./src/db/local.ts
RUN mkdir -p /data
ENV DB_PATH=/data/adhd.db
ENV PORT=3001
EXPOSE 3001
CMD ["node", "--import", "tsx/esm", "server/index.ts"]
```

**Step 2: Create `Dockerfile.frontend`**
```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**Step 3: Create `nginx.conf`**
```nginx
server {
  listen 80;

  location /api/ {
    proxy_pass http://api:3001/api/;
    proxy_set_header Host $host;
  }

  location / {
    root /usr/share/nginx/html;
    try_files $uri $uri/ /index.html;
  }
}
```

**Step 4: Create `docker-compose.yml`**
```yaml
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    volumes:
      - db_data:/data
    environment:
      - DB_PATH=/data/adhd.db
      - PORT=3001
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "8080:80"
    depends_on:
      - api
    restart: unless-stopped

volumes:
  db_data:
```

**Step 5: Create `.dockerignore`**
```
node_modules
dist
data/
*.db
.env
```

**Step 6: Commit**
```bash
git add Dockerfile.api Dockerfile.frontend nginx.conf docker-compose.yml .dockerignore
git commit -m "feat: Docker Compose setup (frontend + API)"
```

---

## Task 8: Build and smoke test

**Step 1: Build images**
```bash
docker compose build
```
Expected: both images build without error.

**Step 2: Start stack**
```bash
docker compose up
```
Expected: `api` and `frontend` start. No crash loops.

**Step 3: Open app**

Open `http://localhost:8080`. Create a space, folder, list, task. Reload page. Task persists.

**Step 4: Verify cross-device**

From a second device on same network: open `http://<your-mac-ip>:8080`. Same tasks visible.

**Step 5: Stop and restart — data survives**
```bash
docker compose down
docker compose up
```
Open `http://localhost:8080` — tasks still there.

**Step 6: Commit**
```bash
git commit -m "chore: verify Docker stack working"
```

---

## Task 9: Seed on first run (server-side)

**Files:**
- Modify: `server/index.ts`

Add seed after `initDb()`:
```typescript
import { getSpaces, createSpace, createFolder, createList, createTask } from './db'

function seedIfEmpty() {
  if (getSpaces().length > 0) return
  const space = createSpace('My Brain', '#6366f1')
  const folder = createFolder('Work', space.id)
  const list = createList('Tasks', folder.id, '#8b5cf6')
  createTask({
    title: 'Welcome to ADHD Brain',
    description: 'Click a task to see AI tools. Break it down. Estimate time. Focus.',
    status: 'todo', priority: 'normal', listId: list.id,
    parentId: null, dueDate: null, tags: ['welcome'], timeEstimate: 5, recurring: null,
  })
}

// Call after initDb()
seedIfEmpty()
```

**Step 2: Remove `seedIfEmpty` call from `src/store/tasks.ts` `load` function.**

**Step 3: Commit**
```bash
git add server/index.ts src/store/tasks.ts
git commit -m "feat: server-side seed on first run"
```

---

## Done

App now:
- Runs as two Docker containers (nginx + node)
- Data shared via named volume (SQLite)
- All devices hit same URL, same data
- AI config synced across devices

**Access:** `http://<host-ip>:8080`
