# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Streamable HTTP transport** for remote and mobile access (`MCP_TRANSPORT=http`)
  - Bearer token authentication via `MCP_AUTH_TOKEN` (required in HTTP mode)
  - Configurable port via `MCP_PORT` (default: 3000)
  - Session management with per-session MCP server instances
  - SSE streaming for server-to-client notifications
  - Graceful shutdown on SIGINT
- **Dual transport architecture** — `src/index.ts` auto-selects stdio (default) or HTTP based on `MCP_TRANSPORT` env var
- **Server factory pattern** — `createServer()` in `src/server.ts` enables per-session server instances for HTTP mode
- **Docker HTTP support** — `EXPOSE 3000` and HTTP env vars in Dockerfile

## [1.0.0] - 2026-03-09

### Added

- **100 MCP tools** across 14 domains:
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
  - Order Refunds — list, create, and delete refunds on orders
  - Order Notes — list, create, and delete order notes
  - Product Reviews — list, get, update, and delete product reviews
  - Payment Gateways — list, get, and update payment gateway settings
  - System Status — get system status, list and run system tools
  - Data — list countries and currencies
  - Media — WordPress media library upload and management
- **7 MCP resources** for agent context:
  - Product, order, and coupon field schemas
  - Refund field schema
  - Product types reference
  - Order statuses reference
  - Payment gateways reference
- **5 MCP prompts** for guided workflows:
  - `setup_variable_product` — step-by-step variable product creation
  - `process_order` — order processing workflow
  - `catalog_overview` — store catalog analysis
  - `handle_refund` — guided refund processing workflow
  - `moderate_reviews` — product review moderation workflow
- **Tool annotations** on all 100 tools (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`)
- **Response field filtering** with configurable `fields` parameter — 60-97% token savings
- **Actionable error messages** mapping WooCommerce error codes to fix guidance
- **Docker support** with multi-stage build
- **Multi-store configuration** via environment variables
- **CI/CD** with GitHub Actions (Node 20 + 22)

[1.0.0]: https://github.com/AmitGurbani/mcp-server-woocommerce/releases/tag/v1.0.0
