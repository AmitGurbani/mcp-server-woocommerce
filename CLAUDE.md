# WooCommerce MCP Server

## Build & Test

```bash
pnpm build        # TypeScript compilation
pnpm test         # Run vitest tests
pnpm test:watch   # Watch mode
```

## Architecture

- `src/services/base.ts` — shared error handling & pagination for all tools
- `src/services/woo-client.ts` — WooCommerce API client singleton
- `src/services/wp-client.ts` — WordPress REST API client (for media management)
- `src/tools/*.ts` — each file registers tools for a domain (products, orders, etc.)
- `src/server.ts` — creates McpServer and registers all tool modules
- `src/index.ts` — entry point (dotenv + stdio transport)

## Adding New Tools

1. Create a new file in `src/tools/` following the existing pattern
2. Export a `register*Tools(server: McpServer)` function
3. Import and call it in `src/server.ts`
4. Run `pnpm build`

## Key Patterns

- `@woocommerce/woocommerce-rest-api` default export needs CJS compat: `(pkg as any).default || pkg`
- `handleListRequest` / `handleRequest` in `base.ts` handle all error + response formatting
- Each tool defines `*_LIST_FIELDS` and `*_FIELDS` arrays for default field filtering
- `resolveFields()` in `base.ts` parses comma-separated `fields` or falls back to defaults

## Commits

- Do NOT add Co-Authored-By lines to commit messages

## Git Policy (Agents)

- Paperclip agents are blocked from git write operations via a PreToolUse hook (`.claude/hooks/block-git-writes.sh`)
- The hook detects Paperclip agents by the `PAPERCLIP_RUN_ID` env var — manual Claude Code sessions are unaffected
- Blocked operations: git commit, push, tag, merge, rebase, reset, stash, branch -d/-D
- Agents may use read-only git commands: git status, git diff, git log, git show, git branch (list)
- If work is ready to commit, inform the human — do not commit yourself

## Infrastructure

- **CI/CD**: GitHub Actions (`.github/workflows/ci.yml`) — Node 20+22, typecheck, test, build
- **Docker**: Multi-stage build via `Dockerfile`
- **Registry**: Smithery config in `smithery.yaml`
- **Tests**: Vitest — tests live as `*.test.ts` alongside source files

## Paperclip Agent Orchestration

This project uses [Paperclip](https://github.com/paperclipai/paperclip) for AI agent task management.

- Dashboard: `http://localhost:3100`
- Run `source .env` to load Paperclip credentials before launching Claude Code as an agent
- Paperclip skill docs: `~/.claude/skills/paperclip/SKILL.md`
- Run heartbeats: `cd <path-to-paperclip> && pnpm paperclipai heartbeat run --agent-id <id>`
