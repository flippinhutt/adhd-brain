# ADHD Brain

Task manager built for ADHD brains. Combines ClickUp-style organization with Goblin.tools-style AI features.

## Features

- **Spaces → Folders → Lists → Tasks** hierarchy
- **4 Views**: List, Board (Kanban), Calendar, Focus (Pomodoro)
- **AI Tools**: Break tasks down, estimate time, brain dump, tone rewriter
- **Multi-provider AI**: Ollama (local/free), Claude, or OpenAI
- **Subtasks**, priority levels, due dates, tags, time tracking
- **Brain Dump**: Paste raw thoughts → AI extracts prioritized tasks
- **Focus Mode**: Single-task Pomodoro timer with auto-sort by priority

## Quick Start

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`.

For production build:

```bash
npm run build
npm run preview
```

## AI Setup

Open **AI Settings** (gear icon, top right) and choose a provider:

### Ollama (local, free)
1. Install [Ollama](https://ollama.ai)
2. Run: `ollama pull llama3.2`
3. Select Ollama in AI Settings — no API key needed
4. For remote Ollama, set the Base URL to your server address

### Claude (Anthropic)
1. Get API key from [console.anthropic.com](https://console.anthropic.com)
2. Select Claude, paste key

### OpenAI
1. Get API key from [platform.openai.com](https://platform.openai.com)
2. Select OpenAI, paste key

## Data Storage

All data stored in browser **localStorage** — no backend, no account, no cloud.

Keys used:
- `adhd_spaces`, `adhd_folders`, `adhd_lists`, `adhd_tasks`
- `ai_provider`, `ai_config_{provider}`

## Architecture

```
src/
├── ai/
│   ├── provider.ts     # Multi-provider AI abstraction (Ollama/Claude/OpenAI)
│   └── features.ts     # AI prompts: breakTask, estimateTime, brainDump, formalize
├── components/
│   ├── Sidebar.tsx     # Hierarchical org tree + view switcher
│   ├── ListView.tsx    # Tasks grouped by status
│   ├── BoardView.tsx   # Kanban columns
│   ├── CalendarView.tsx # Monthly calendar with due dates
│   ├── FocusView.tsx   # Pomodoro timer, single-task focus
│   ├── TaskCard.tsx    # Task display card
│   ├── TaskDetail.tsx  # Task editor modal + AI tools
│   ├── BrainDump.tsx   # Raw text → prioritized tasks
│   └── AISettings.tsx  # Provider config modal
├── db/
│   └── local.ts        # localStorage CRUD, data models
├── store/
│   └── tasks.ts        # Zustand state, all app actions
└── App.tsx             # Root layout + routing
```

## Data Models

| Model | Fields |
|-------|--------|
| Space | id, name, color, createdAt |
| Folder | id, name, spaceId, createdAt |
| TaskList | id, name, folderId, color, createdAt |
| Task | id, title, description, status, priority, dueDate, timeEstimate, timeSpent, listId, parentId, tags, recurring, createdAt, updatedAt |

Task status: `todo` / `in_progress` / `done`  
Task priority: `urgent` / `high` / `normal` / `low`

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server with HMR |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Serve production build locally |
| `npm run lint` | ESLint check |
