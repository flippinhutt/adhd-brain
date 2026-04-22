import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { buildApp } from './index'
import type { Express } from 'express'

let app: Express

beforeEach(() => { app = buildApp(':memory:') })

describe('spaces', () => {
  it('GET /api/spaces returns []', async () => {
    const res = await request(app).get('/api/spaces')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('POST /api/spaces creates space', async () => {
    const res = await request(app).post('/api/spaces').send({ name: 'Work', color: '#fff' })
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Work')
    expect(res.body.id).toBeTruthy()
  })

  it('DELETE /api/spaces/:id removes space', async () => {
    const created = await request(app).post('/api/spaces').send({ name: 'X', color: '#000' })
    await request(app).delete(`/api/spaces/${created.body.id}`)
    const list = await request(app).get('/api/spaces')
    expect(list.body).toHaveLength(0)
  })
})

describe('tasks', () => {
  async function setupList(a: typeof app) {
    const space = await request(a).post('/api/spaces').send({ name: 'S', color: '#fff' })
    const folder = await request(a).post('/api/folders').send({ name: 'F', spaceId: space.body.id })
    const list = await request(a).post('/api/lists').send({ name: 'L', folderId: folder.body.id })
    return list.body.id as string
  }

  it('POST /api/tasks creates task', async () => {
    const listId = await setupList(app)
    const res = await request(app).post('/api/tasks').send({
      title: 'My task', description: '', status: 'todo', priority: 'normal',
      listId, parentId: null, dueDate: null, tags: ['x'], timeEstimate: null, recurring: null,
    })
    expect(res.status).toBe(201)
    expect(res.body.title).toBe('My task')
    expect(res.body.tags).toEqual(['x'])
  })

  it('PATCH /api/tasks/:id updates task', async () => {
    const listId = await setupList(app)
    const task = await request(app).post('/api/tasks').send({
      title: 'Old', description: '', status: 'todo', priority: 'normal',
      listId, parentId: null, dueDate: null, tags: [], timeEstimate: null, recurring: null,
    })
    const res = await request(app).patch(`/api/tasks/${task.body.id}`).send({ title: 'New' })
    expect(res.status).toBe(200)
    expect(res.body.title).toBe('New')
  })

  it('GET /api/tasks/:id returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/tasks/nonexistent')
    expect(res.status).toBe(404)
  })
})

describe('settings', () => {
  it('GET /api/settings/:key returns 404 when unset', async () => {
    const res = await request(app).get('/api/settings/missing')
    expect(res.status).toBe(404)
  })

  it('PUT /api/settings/:key then GET round-trips value', async () => {
    await request(app).put('/api/settings/ai_provider').send({ value: 'ollama' })
    const res = await request(app).get('/api/settings/ai_provider')
    expect(res.status).toBe(200)
    expect(res.body.value).toBe('ollama')
  })
})
