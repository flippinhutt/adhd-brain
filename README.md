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
  - **Executive Chef**: Tells you exactly what task to do based on your time and energy levels.
  - **Tone Judge**: Rejection Sensitive Dysphoria (RSD) tool that evaluates the tone and intent of messages.
  - **Magic Breakdown**: Splinter large tasks into 5-15 minute subtasks (with visual progress tracking).
  - **Reality Check**: Get ADHD-adjusted time estimations (+50% buffer).
  - **Brain Dump**: Convert raw streams of thought into prioritized task lists.
  - **Tone Rewriter**: Change the vibe of your notes (Formal, Casual, Gentle, Direct).
- **Dopamine & UX Optimizations**:
  - **Ultra Focus Mode**: Hides all other tasks and distractions, featuring a visual pie-chart timer.
  - **Dopamine Celebrations**: Satisfying confetti bursts upon task completion to reinforce habits.
- **Self-Hosted Privacy**: Runs as a Docker stack on your own hardware. Your data lives in an SQLite database that never leaves your network. AI configuration syncs across your devices.

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Zustand
- **Backend**: Node.js, Express, better-sqlite3
- **Deployment**: Docker Compose, Nginx
- **AI Integration**: Custom abstraction layer for Ollama, Anthropic (Claude), and OpenAI

## 🚀 Quick Start

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Installation

```bash
git clone https://github.com/flippinhutt/adhd-brain.git
cd adhd-brain
docker compose up -d
```

Open [http://localhost:8080](http://localhost:8080) to access the application.

### Development

For local development without Docker:
```bash
npm install
npm run build

# Terminal 1: Run Backend
npx tsx server/index.ts

# Terminal 2: Run Frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🤖 AI Configuration

ADHD Brain supports multiple AI providers. Access settings via the **Gear Icon** in the top-right corner.

### 1. Ollama (Local & Private)
Best for total privacy and zero costs.
- Install [Ollama](https://ollama.com/)
- Run `ollama pull llama3.2`
- Select **Ollama** in settings. Make sure your Ollama instance is accessible from the container if using Docker (e.g. `http://host.docker.internal:11434`).

### 2. Claude (Anthropic)
- Get an API key at [console.anthropic.com](https://console.anthropic.com)
- Select **Claude** in settings and paste your key.

### 3. OpenAI
- Get an API key at [platform.openai.com](https://platform.openai.com)
- Select **OpenAI** in settings and paste your key.

## 📁 Project Structure

```text
adhd-brain/
├── server/      # Express API, REST routes, and SQLite database setup
├── src/         # React frontend source code
│   ├── ai/          # AI provider abstractions and prompt engineering
│   ├── components/  # View-specific and shared UI components
│   ├── db/          # API client for frontend-backend communication
│   └── store/       # Zustand state management
├── docker-compose.yml # Docker multi-container setup
├── Dockerfile.api   # Backend container image
└── Dockerfile.frontend # Frontend container image (Nginx)
```

## 📜 Documentation

- [API Reference](docs/API.md) - Details on the backend REST API endpoints.

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.

---
*Built with ❤️ for the neurodivergent community.*
