# 🧠 ADHD Brain

A task management suite specifically designed for ADHD neurotypes. It combines hierarchical organization with AI-powered executive function support, inspired by ClickUp and Goblin.tools.

![Version](https://img.shields.io/badge/version-0.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-19-blue)
![Vite](https://img.shields.io/badge/Vite-8-purple)

## ✨ Features

- **Hierarchical Organization**: Organize your world with Spaces → Folders → Lists → Tasks.
- **Multiple Perspectives**:
  - **List View**: Classic grouping by status.
  - **Board View**: Kanban style for visual flow.
  - **Calendar View**: Manage deadlines and schedules.
  - **Focus Mode**: Single-task Pomodoro timer to combat paralysis.
- **AI Executive Function Tools**:
  - **Magic Breakdown**: Splinter large tasks into 5-15 minute subtasks.
  - **Reality Check**: Get ADHD-adjusted time estimations (+50% buffer).
  - **Brain Dump**: Convert raw streams of thought into prioritized task lists.
  - **Tone Rewriter**: Change the vibe of your notes (Formal, Casual, Gentle, Direct).
- **Privacy First**: All data is stored locally in your browser (**localStorage**). No cloud, no accounts, no tracking.

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **AI Integration**: Custom abstraction layer for Ollama, Anthropic (Claude), and OpenAI
- **Database**: LocalStorage (Browser-native)

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (Latest LTS recommended)
- [npm](https://www.npmjs.com/)

### Installation
```bash
git clone https://github.com/flippinhutt/adhd-brain.git
cd adhd-brain
npm install
```

### Development
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) to see the app.

## 🤖 AI Configuration

ADHD Brain supports multiple AI providers. Access settings via the **Gear Icon** in the top-right corner.

### 1. Ollama (Local & Private)
Best for total privacy and zero costs.
- Install [Ollama](https://ollama.com/)
- Run `ollama pull llama3.2`
- Select **Ollama** in settings.

### 2. Claude (Anthropic)
- Get an API key at [console.anthropic.com](https://console.anthropic.com)
- Select **Claude** in settings and paste your key.

### 3. OpenAI
- Get an API key at [platform.openai.com](https://platform.openai.com)
- Select **OpenAI** in settings and paste your key.

## 📁 Project Structure

```text
src/
├── ai/          # AI provider abstractions and prompt engineering
├── components/  # View-specific and shared UI components
├── db/          # LocalStorage CRUD and data models
├── store/       # Zustand state management
└── App.tsx      # Main layout and routing
```

## 📜 Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts development server with HMR |
| `npm run build` | Builds the app for production |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs ESLint for code quality |

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.

---
*Built with ❤️ for the neurodivergent community.*
