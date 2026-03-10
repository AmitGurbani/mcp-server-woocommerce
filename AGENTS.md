# AGENTS.md — mcp-server-woocommerce

## Overview

MCP server for managing WooCommerce stores through AI assistants. TypeScript, Node.js, communicates via stdio. 54 tools across 11 domains.

## Quick Start

```bash
pnpm install
pnpm build        # compiles src/ → build/ via tsc
pnpm dev          # watch mode
pnpm start        # run the server (node build/index.js)
pnpm test         # run vitest tests
pnpm inspector    # debug with MCP Inspector
```

## Project Structure

```
src/
├── index.ts              # Entry point — loads dotenv, starts stdio transport
├── server.ts             # Creates McpServer, registers all tool modules
├── services/
│   ├── base.ts           # Shared error handling, pagination, field filtering
│   ├── woo-client.ts     # WooCommerce REST API client (singleton)
│   └── wp-client.ts      # WordPress REST API client (for media)
└── tools/
    ├── products.ts       # Products CRUD + attributes/brands
    ├── categories.ts     # Product categories CRUD
    ├── tags.ts           # Product tags CRUD
    ├── brands.ts         # Product brands CRUD
    ├── attributes.ts     # Global attributes + attribute terms (batch)
    ├── variations.ts     # Product variations CRUD + batch
    ├── orders.ts         # Orders CRUD
    ├── customers.ts      # Customers CRUD
    ├── coupons.ts        # Coupons CRUD
    ├── reports.ts        # Sales reports, top sellers, totals
    └── media.ts          # WordPress media management
```

## Architecture

- **Transport**: stdio (stdin/stdout JSON-RPC via `@modelcontextprotocol/sdk`)
- **API clients**: `woo-client.ts` wraps `@woocommerce/woocommerce-rest-api`; `wp-client.ts` uses native fetch for WordPress REST
- **Tool registration**: each `src/tools/*.ts` exports a `register*Tools(server: McpServer)` function, called from `server.ts`
- **Error handling**: `handleRequest()` and `handleListRequest()` in `base.ts` wrap all API calls with consistent error extraction
- **Field filtering**: two layers — `_fields` query param (server-side) + `pickFields()` (client-side). Each tool defines `*_LIST_FIELDS` and `*_FIELDS` arrays for defaults. `resolveFields()` parses comma-separated `fields` param or falls back to defaults
- **Response format**: all tools return `{ content: [{ type: "text", text: JSON.stringify(...) }] }` with optional `isError: true`

## Key Patterns

- **CJS compat**: `@woocommerce/woocommerce-rest-api` default export requires `(pkg as any).default || pkg`
- **Tool response type**: must satisfy `{ content: [...]; [key: string]: unknown }` index signature
- **Pagination**: `handleListRequest` reads `x-wp-total` and `x-wp-totalpages` headers
- **ES modules**: project uses `"type": "module"` with Node16 module resolution; all imports use `.js` extensions

## Adding a New Tool Module

1. Create `src/tools/<domain>.ts`
2. Define field arrays: `const DOMAIN_LIST_FIELDS = [...]` and `const DOMAIN_FIELDS = [...]`
3. Export `register<Domain>Tools(server: McpServer)` — register tools via `server.registerTool()`
4. Each tool handler should use `handleRequest()` or `handleListRequest()` from `base.ts`
5. Accept an optional `fields` param (comma-separated string) and use `resolveFields(fields, defaults)`
6. Import and call your register function in `src/server.ts`
7. Run `pnpm build` to verify

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `WORDPRESS_SITE_URL` | Yes | WordPress store URL |
| `WOOCOMMERCE_CONSUMER_KEY` | Yes | WooCommerce REST API key (`ck_...`) |
| `WOOCOMMERCE_CONSUMER_SECRET` | Yes | WooCommerce REST API secret (`cs_...`) |
| `WORDPRESS_USERNAME` | No | WordPress admin username (media tools) |
| `WORDPRESS_APP_PASSWORD` | No | WordPress Application Password (media tools) |

## Tech Stack

- **Runtime**: Node.js (ES2022 target)
- **Language**: TypeScript 5.x (strict mode)
- **Package manager**: pnpm
- **Key deps**: `@modelcontextprotocol/sdk`, `@woocommerce/woocommerce-rest-api`, `zod`, `dotenv`
- **Build**: `tsc` → `build/` directory

## Testing

Uses [Vitest](https://vitest.dev/) for unit testing. Run `pnpm test` (or `pnpm test:watch` during development). Tests live alongside source files as `*.test.ts`. Validate changes by running `pnpm build` (type-check + compile) and `pnpm test` before submitting.

## Infrastructure

- **CI/CD**: GitHub Actions (`.github/workflows/ci.yml`) — runs on Node 20 + 22, steps: install, typecheck, test, build
- **Docker**: Multi-stage build via `Dockerfile` (node:22-alpine)
- **Registry**: Smithery config in `smithery.yaml` for one-click MCP server installation
