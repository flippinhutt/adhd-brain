import { Router } from 'express'
import * as db from './db'

export function buildRouter(): Router {
  const r = Router()

  // Spaces
  r.get('/spaces', (_, res) => res.json(db.getSpaces()))
  r.post('/spaces', (req, res) => res.status(201).json(db.createSpace(req.body.name, req.body.color)))
  r.delete('/spaces/:id', (req, res) => { db.deleteSpace(req.params.id); res.sendStatus(204) })

  // Folders
  r.get('/folders', (req, res) => res.json(db.getFolders(req.query.spaceId as string | undefined)))
  r.post('/folders', (req, res) => res.status(201).json(db.createFolder(req.body.name, req.body.spaceId)))
  r.delete('/folders/:id', (req, res) => { db.deleteFolder(req.params.id); res.sendStatus(204) })

  // Lists
  r.get('/lists', (req, res) => res.json(db.getLists(req.query.folderId as string | undefined)))
  r.post('/lists', (req, res) => res.status(201).json(db.createList(req.body.name, req.body.folderId, req.body.color)))
  r.delete('/lists/:id', (req, res) => { db.deleteList(req.params.id); res.sendStatus(204) })

  // Tasks
  r.get('/tasks', (req, res) => res.json(db.getTasks(req.query.listId as string | undefined)))
  r.get('/tasks/:id', (req, res) => {
    const t = db.getTask(req.params.id)
    t ? res.json(t) : res.sendStatus(404)
  })
  r.post('/tasks', (req, res) => res.status(201).json(db.createTask(req.body)))
  r.patch('/tasks/:id', (req, res) => res.json(db.updateTask(req.params.id, req.body)))
  r.delete('/tasks/:id', (req, res) => { db.deleteTask(req.params.id); res.sendStatus(204) })

  // Settings
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
