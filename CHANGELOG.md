# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.0.0]: https://github.com/AmitGurbani/mcp-server-woocommerce/releases/tag/v1.0.0
