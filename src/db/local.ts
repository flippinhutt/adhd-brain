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
