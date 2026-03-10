# Agent Orchestration

This project uses [Paperclip](https://github.com/paperclipai/paperclip) to coordinate a team of AI agents that maintain and develop the MCP server.

## Why Paperclip?

Instead of manually managing tasks across multiple Claude Code sessions, Paperclip provides:

- **Task management** — issues, priorities, and assignments tracked in one place
- **Agent coordination** — multiple AI agents with specialized roles working in parallel
- **Heartbeat system** — agents wake on schedule, check their work queue, and execute
- **Audit trail** — every action logged and traceable

## Agent Team

```
Board (You)
└── CEO (Lead Maintainer)
    ├── Founding Engineer (Architect & Engineer)
    ├── QA (Testing & Code Review)
    ├── DevRel (Developer Advocate)
    └── Community (Growth & Ecosystem)
```

| Agent | Role | Responsibilities |
|-------|------|-----------------|
| **CEO** | Lead Maintainer | Roadmap, prioritization, task delegation, triage, strategic direction |
| **Founding Engineer** | Architect & Engineer | Feature development, bug fixes, MCP protocol compliance, code quality, security |
| **QA** | Testing & Code Review | Code review, testing, CI/CD, PR validation, security audits |
| **DevRel** | Developer Advocate | Documentation, tutorials, tool descriptions optimized for LLM discovery |
| **Community** | Growth & Ecosystem | Registry submissions, GitHub issue triage, contributor onboarding |

All agents use the `claude_local` adapter and run in this project's working directory.

## Setting Up Paperclip (for contributors/forkers)

### 1. Install and run Paperclip

```bash
git clone https://github.com/paperclipai/paperclip.git
cd paperclip
pnpm install
pnpm dev
```

This starts the API and dashboard at `http://localhost:3100`.

### 2. Create a company

In the Paperclip UI, create a new company for your fork of the project.

### 3. Create agents

Hire agents via the UI with the `claude_local` adapter. Set the working directory (`cwd`) to your local clone of this repo.

### 4. Install Paperclip skills for Claude Code

```bash
cd /path/to/paperclip
pnpm paperclipai agent local-cli <agent-name> --company-id <company-id>
```

This installs Paperclip skills to `~/.claude/skills/` and prints environment variable exports.

### 5. Configure environment variables

Create a `.env` file in the project root (already gitignored):

```bash
PAPERCLIP_API_URL=http://localhost:3100
PAPERCLIP_COMPANY_ID=your_company_id
PAPERCLIP_AGENT_ID=your_agent_id
PAPERCLIP_API_KEY=pcp_your_api_key
```

Run `source .env` before launching Claude Code as a Paperclip agent.

### 6. Run heartbeats

Trigger an agent to check its task queue and work:

```bash
cd /path/to/paperclip
pnpm paperclipai heartbeat run --agent-id <agent-id>
```

## How Tasks Flow

1. **You (Board)** create high-level tasks or goals in the Paperclip dashboard
2. **CEO** breaks them down and delegates to the appropriate agent
3. **Agents** check out tasks, do the work, and update status
4. **You** review and approve changes via the dashboard

Agents can also create subtasks and delegate to each other following the org hierarchy.
