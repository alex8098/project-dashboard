# 🎯 Agent Mission Control

A sophisticated dashboard for coordinating AI agents, managing development tasks, and tracking project progress with GitHub integration.

## Features

### 🤖 Agent Fleet Management
- **Spawn Agents:** Create new AI agents with specific tasks
- **Monitor Status:** Real-time view of agent status (idle/working/error)
- **Control:** Kill agents, reassign tasks
- **Auto-refresh:** Dashboard updates every 5 seconds

### 📋 Task Pipeline (Kanban Board)
- **Backlog:** Queue of work waiting to start
- **In Progress:** Tasks currently being worked on
- **Review:** Completed work awaiting approval
- **Completed:** Shipped features

### 📊 Project Intelligence
- GitHub repository sync
- Issue tracking
- Pull request monitoring
- Development metrics

### 💬 Communication Hub
- Agent reports and logs
- "Escalate to human" queue
- System alerts

## Quick Start

```bash
# Clone repo
git clone https://github.com/alex8098/project-dashboard.git
cd project-dashboard

# Install dependencies
npm install

# Setup environment
echo "GITHUB_TOKEN=your_github_token_here" > .env.local

# Create database directory
mkdir -p database

# Run development server
npm run dev

# Open http://localhost:3000
```

## How to Use

### 1. Spawn Your First Agent
1. Go to **Agents** tab
2. Click **"Spawn Agent"**
3. Give it a name and optional initial task
4. The agent appears in your fleet

### 2. Create Tasks
1. Go to **Tasks** tab
2. Type task name and click **"Add Task"**
3. Drag/drop between columns (coming soon)
4. Assign to agents

### 3. Sync with GitHub
1. Click **"Sync with GitHub"**
2. Imports all your repos as projects
3. Links open issues to tasks

### 4. Monitor Progress
- **Overview Tab:** Quick stats and recent activity
- **Agents Tab:** Full fleet management
- **Tasks Tab:** Kanban board view

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents` | GET | List all agents |
| `/api/agents` | POST | Spawn new agent |
| `/api/agents?id=x` | DELETE | Kill agent |
| `/api/tasks` | GET | List all tasks |
| `/api/tasks` | POST | Create task |
| `/api/tasks` | PATCH | Update task status |
| `/api/sync-github` | POST | Sync GitHub repos |

## Architecture

```
┌─────────────────┐
│  Next.js 15    │  ← React + TypeScript
│  (Frontend)    │
└────────┬────────┘
         │
┌────────▼────────┐
│  API Routes     │  ← Server-side logic
│  (Next.js)      │
└────────┬────────┘
         │
┌────────▼────────┐
│  SQLite         │  ← Local database
│  (better-sqlite3)│
└─────────────────┘
```

## Roadmap / Future Features

### Phase 2: Advanced Agent Coordination
- [ ] **Agent Teams:** Predefined squads (Frontend Team, Backend Team, QA Team)
- [ ] **Workflow Templates:** One-click "Build Feature X" workflows
- [ ] **Agent Communication:** Agents can message each other
- [ ] **Auto-scaling:** Spawn agents automatically when backlog grows

### Phase 3: Intelligence & Automation
- [ ] **Smart Assignment:** AI assigns tasks to best-suited agents
- [ ] **Estimation:** Agents estimate task completion time
- [ ] **Conflict Resolution:** Detect and resolve agent conflicts
- [ ] **Performance Analytics:** Agent success rates, velocity tracking

### Phase 4: Integration Hub
- [ ] **Slack/Discord:** Get notifications in your chat
- [ ] **Email Reports:** Daily/weekly summaries
- [ ] **Calendar Sync:** Schedule agent work sessions
- [ ] **VS Code Extension:** Control from your editor

### Phase 5: Deployment & Operations
- [ ] **Docker Support:** Containerize everything
- [ ] **Cloud Deploy:** One-click deploy to Vercel/Railway
- [ ] **Multi-user:** Team collaboration features
- [ ] **Webhooks:** Trigger external services

## Suggested Workflows

### "Build a Feature" Workflow
1. Create task: "Build user authentication"
2. Spawn 3 agents:
   - Frontend Agent → Build login UI
   - Backend Agent → Create auth API
   - QA Agent → Write tests
3. Agents work in parallel
4. Review completed work
5. Merge to main

### "Bug Squash" Workflow
1. GitHub issue created
2. Auto-spawn agent assigned to bug
3. Agent investigates and fixes
4. Creates PR for review
5. You approve/merge

### "Code Review" Workflow
1. Agent completes task
2. Dashboard shows "Ready for Review"
3. You review the code
4. Approve or request changes
5. Agent addresses feedback

## Development

```bash
# Add new feature
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## License

MIT

---

**Built for managing AI agents efficiently. Spawn, coordinate, ship! 🚀**