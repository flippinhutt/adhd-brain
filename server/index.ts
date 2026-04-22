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
