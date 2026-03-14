# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **OAuth 2.1 authentication** via Auth0 + [`mcp-auth`](https://github.com/mcp-auth/js) for Claude.ai web/mobile Connectors
  - Dual auth mode: bearer token (`MCP_AUTH_TOKEN`) or OAuth 2.1 (`AUTH0_DOMAIN` + `AUTH0_AUDIENCE`)
  - Automatic `/.well-known/oauth-protected-resource` discovery endpoint
  - JWT validation via Auth0 JWKS
- **Health check endpoint** — `GET /health` returns server status, version, active sessions, and uptime (no auth required)
- **SIGTERM handler** — graceful shutdown on SIGTERM (needed by Railway, Fly.io, Kubernetes)
- **Deployment guide** — step-by-step docs for Railway, Fly.io, and Docker (`docs/DEPLOYMENT.md`)
- **Docker Compose** — `docker-compose.yml` for local HTTP transport testing with healthcheck
- **Fly.io config** — `fly.toml` with scale-to-zero, health checks, and Mumbai region
- **Docker image publishing** — GitHub Actions workflow auto-publishes to GHCR on release

## [1.2.0] - 2026-03-12

### Added

- **`delete_order` tool** — delete orders (moves to trash by default; `force=true` to permanently delete). Tool count: 100 → 101
- **Integration tests** against real WordPress 6.9.4 + WooCommerce 10.5.3 via `@wordpress/env`
  - 8 test suites: products, categories, orders, customers, coupons, tags, settings, full E2E workflow
  - Automated global setup: starts wp-env, creates API keys, seeds test data
  - CI pipeline: new `integration` job runs after unit tests on push/PR
  - New scripts: `pnpm test:integration`, `pnpm wp-env`
- **Streamable HTTP transport** for remote and mobile access (`MCP_TRANSPORT=http`)
  - Bearer token authentication via `MCP_AUTH_TOKEN` (required in HTTP mode)
  - Configurable port via `MCP_PORT` (default: 3000)
  - Session management with per-session MCP server instances
  - SSE streaming for server-to-client notifications
  - Graceful shutdown on SIGINT
- **Dual transport architecture** — `src/index.ts` auto-selects stdio (default) or HTTP based on `MCP_TRANSPORT` env var
- **Server factory pattern** — `createServer()` in `src/server.ts` enables per-session server instances for HTTP mode
- **Docker HTTP support** — `EXPOSE 3000` and HTTP env vars in Dockerfile
- **Safety warnings** — irreversible operations table and cascading effects documented
- **Read-only mode** — `WOOCOMMERCE_MCP_READ_ONLY=true` blocks all write/update/delete tools

### Changed

- CI pipeline runs build before HTTP transport tests

### Removed

- Paperclip agent orchestration

## [1.1.0] - 2026-03-11

### Added

- **18 new tools** across 6 modules (82 → 100 tools):
  - Order Refunds (3) — list, create, delete refunds on orders
  - Order Notes (3) — list, create, delete order notes
  - Payment Gateways (3) — list, get, update payment gateway settings
  - Product Reviews (4) — list, get, update, delete product reviews
  - System Status (3) — get system status, list and run system tools
  - Data (2) — list countries and currencies
- **2 new MCP resources** (5 → 7):
  - Refund field schema (`woo://schema/refund`)
  - Payment gateways reference (`woo://reference/payment-gateways`)
- **2 new MCP prompts** (3 → 5):
  - `handle_refund` — guided refund processing workflow
  - `moderate_reviews` — product review moderation workflow

### Fixed

- Registry metadata: added `mcpName` for Official MCP Registry verification
- Registry namespace casing and `server.json` validation fixes

## [1.0.0] - 2026-03-09

### Added

- **82 MCP tools** across 14 domains:
  - Products — CRUD, search, filtering, stock management
  - Orders — CRUD, status transitions, line items, notes
  - Customers — CRUD, search, order history
  - Coupons — CRUD, discount types, usage restrictions
  - Categories — CRUD, hierarchical product categories
  - Tags — CRUD, flat product labels
  - Brands — CRUD, product brand management (WooCommerce 9.6+)
  - Attributes — global attribute and term management with batch support
  - Variations — product variation CRUD with batch operations
  - Shipping — zones, zone methods, and shipping classes
  - Taxes — tax rates and tax classes
  - Webhooks — create, manage, and monitor webhook subscriptions
  - Settings — read and update store configuration
  - Reports — sales summaries, top sellers, totals
  - Media — WordPress media library upload and management
- **5 MCP resources** for agent context:
  - Product, order, and coupon field schemas
  - Product types reference
  - Order statuses reference
- **3 MCP prompts** for guided workflows:
  - `setup_variable_product` — step-by-step variable product creation
  - `process_order` — order processing workflow
  - `catalog_overview` — store catalog analysis
- **Tool annotations** on all 82 tools (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`)
- **Response field filtering** with configurable `fields` parameter — 60-97% token savings
- **Actionable error messages** mapping WooCommerce error codes to fix guidance
- **Docker support** with multi-stage build
- **Multi-store configuration** via environment variables
- **CI/CD** with GitHub Actions (Node 20 + 22)

[Unreleased]: https://github.com/AmitGurbani/mcp-server-woocommerce/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/AmitGurbani/mcp-server-woocommerce/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/AmitGurbani/mcp-server-woocommerce/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/AmitGurbani/mcp-server-woocommerce/releases/tag/v1.0.0
