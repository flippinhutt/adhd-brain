# ADHD Brain API Reference

This document outlines the REST API endpoints provided by the ADHD Brain Express backend.

## Base URL
All API requests should be prefixed with `/api`.

---

## Settings & AI Configuration

### `GET /api/settings/:key`
Fetch a specific setting value (e.g. AI provider configurations).
- **Params:** `key`
- **Returns:** `{ value: string }`

### `PUT /api/settings/:key`
Upsert a setting value.
- **Params:** `key`
- **Body:** `{ value: string }`

---

## Spaces

### `GET /api/spaces`
Get all spaces ordered by creation date.
- **Returns:** `Space[]`

### `POST /api/spaces`
Create a new space.
- **Body:** `{ name: string, color?: string }`
- **Returns:** `Space`

### `DELETE /api/spaces/:id`
Delete a space by ID.

---

## Folders

### `GET /api/folders?spaceId={id}`
Get folders, optionally filtered by `spaceId`.
- **Query:** `spaceId` (optional)
- **Returns:** `Folder[]`

### `POST /api/folders`
Create a new folder.
- **Body:** `{ name: string, spaceId: string }`
- **Returns:** `Folder`

### `DELETE /api/folders/:id`
Delete a folder by ID.

---

## Lists

### `GET /api/lists?folderId={id}`
Get lists, optionally filtered by `folderId`.
- **Query:** `folderId` (optional)
- **Returns:** `TaskList[]`

### `POST /api/lists`
Create a new task list.
- **Body:** `{ name: string, folderId: string, color?: string }`
- **Returns:** `TaskList`

### `DELETE /api/lists/:id`
Delete a list by ID.

---

## Tasks

### `GET /api/tasks?listId={id}`
Get all tasks, optionally filtered by `listId`.
- **Query:** `listId` (optional)
- **Returns:** `Task[]`

### `GET /api/tasks/:id`
Get a specific task by ID.
- **Returns:** `Task`

### `POST /api/tasks`
Create a new task.
- **Body:** `Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'timeSpent'>`
- **Returns:** `Task`

### `PATCH /api/tasks/:id`
Update an existing task.
- **Body:** `Partial<Task>`
- **Returns:** `Task` (updated)

### `DELETE /api/tasks/:id`
Delete a task by ID. Note: Also recursively deletes any subtasks.
