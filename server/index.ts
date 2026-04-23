import express from 'express'
import cors from 'cors'
import { initDb, getSpaces, createSpace, createFolder, createList, createTask } from './db'
import { buildRouter } from './routes'

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

export function buildApp(dbPath?: string) {
  initDb(dbPath)
  seedIfEmpty()
  const app = express()
  app.use(cors({ origin: process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173' }))
  app.use(express.json())
  app.use('/api', buildRouter())
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  })
  return app
}

if (process.env.NODE_ENV !== 'test') {
  const port = process.env.PORT ?? 3001
  buildApp(process.env.DB_PATH ?? './data/adhd.db').listen(port, () =>
    process.stdout.write(`API running on :${port}\n`)
  )
}
