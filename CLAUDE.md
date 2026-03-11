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

## Infrastructure

- **CI/CD**: GitHub Actions (`.github/workflows/ci.yml`) — Node 20+22, typecheck, test, build
- **Docker**: Multi-stage build via `Dockerfile`
- **Registry**: Smithery config in `smithery.yaml`
- **Tests**: Vitest — tests live as `*.test.ts` alongside source files

