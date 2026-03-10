# mcp-server-woocommerce

[![CI](https://github.com/AmitGurbani/mcp-server-woocommerce/actions/workflows/ci.yml/badge.svg)](https://github.com/AmitGurbani/mcp-server-woocommerce/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@amitgurbani/mcp-server-woocommerce)](https://www.npmjs.com/package/@amitgurbani/mcp-server-woocommerce)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

MCP server for managing WooCommerce stores through AI assistants like Claude. Provides 82 tools covering products, orders, customers, coupons, shipping, taxes, webhooks, settings, reports, and more.

## Quick Start

**1. Get WooCommerce API keys**

In your WordPress admin: **WooCommerce > Settings > Advanced > REST API > Add key** with Read/Write permissions.

**2. Add to your AI tool**

No install needed — runs directly via `npx`:

<details open>
<summary><strong>Claude Code</strong></summary>

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "woocommerce": {
      "command": "npx",
      "args": ["-y", "@amitgurbani/mcp-server-woocommerce"],
      "env": {
        "WORDPRESS_SITE_URL": "https://store.example.com",
        "WOOCOMMERCE_CONSUMER_KEY": "ck_your_key",
        "WOOCOMMERCE_CONSUMER_SECRET": "cs_your_secret"
      }
    }
  }
}
```

</details>

<details>
<summary><strong>Claude Desktop</strong></summary>

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS, `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "woocommerce": {
      "command": "npx",
      "args": ["-y", "@amitgurbani/mcp-server-woocommerce"],
      "env": {
        "WORDPRESS_SITE_URL": "https://store.example.com",
        "WOOCOMMERCE_CONSUMER_KEY": "ck_your_key",
        "WOOCOMMERCE_CONSUMER_SECRET": "cs_your_secret"
      }
    }
  }
}
```

</details>

<details>
<summary><strong>Cursor</strong></summary>

[Install in Cursor](cursor://settings/mcp/add?name=woocommerce&type=stdio&command=npx&args=-y,@amitgurbani/mcp-server-woocommerce) (one-click) or add to `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "woocommerce": {
      "command": "npx",
      "args": ["-y", "@amitgurbani/mcp-server-woocommerce"],
      "env": {
        "WORDPRESS_SITE_URL": "https://store.example.com",
        "WOOCOMMERCE_CONSUMER_KEY": "ck_your_key",
        "WOOCOMMERCE_CONSUMER_SECRET": "cs_your_secret"
      }
    }
  }
}
```

</details>

**4. Start using it** — ask your AI assistant things like:

> "List all products that are out of stock"
> "Create a 10% off coupon for orders over $50"
> "Show me this week's sales report"

## Features

- **Full store management** — CRUD operations for products, categories, tags, brands, orders, customers, and coupons
- **Product taxonomy** — attributes, attribute terms, and variations with batch support
- **Shipping** — zones, zone methods, and shipping classes
- **Taxes** — tax rates and tax classes
- **Webhooks** — create, manage, and monitor webhook subscriptions
- **Settings** — read and update store configuration
- **Reports** — sales reports, top sellers, order/product/customer totals
- **Media management** — list, delete, and cleanup orphaned media via WordPress REST API
- **Token optimization** — all tools support a `fields` param to return only specific fields, reducing response size by 60-97%
- **MCP resources** — schema references for products, orders, and coupons that agents can read for context
- **Guided prompts** — multi-step workflows for variable product setup, order processing, and catalog overview
- **Tool annotations** — `readOnlyHint`, `destructiveHint`, and `idempotentHint` on all 82 tools for safe agent behavior
- **Actionable errors** — error responses include guidance on how to fix common issues

## Available Tools (82)

| Domain | Tools |
| --- | --- |
| **Products** | list, get, create, update, delete |
| **Categories** | list, get, create, update, delete |
| **Tags** | list, get, create, update, delete |
| **Brands** | list, get, create, update, delete |
| **Attributes** | list, get, create, delete |
| **Attribute Terms** | list, create, delete, batch update |
| **Variations** | list, get, create, update, batch update |
| **Orders** | list, get, create, update |
| **Customers** | list, get, create, update |
| **Coupons** | list, get, create, update, delete |
| **Shipping Zones** | list, get, create, update, delete |
| **Shipping Zone Methods** | list, get, create, update, delete |
| **Shipping Classes** | list, create |
| **Tax Rates** | list, get, create, update, delete |
| **Tax Classes** | list, create, delete |
| **Webhooks** | list, get, create, update, delete |
| **Settings** | list groups, get, update |
| **Reports** | sales, top sellers, order/product/customer totals |
| **Media** | list, delete, cleanup orphaned |

## Resources

The server exposes 5 MCP resources that provide schema references and guides for AI agents:

| URI | Description |
| --- | --- |
| `woo://schema/product` | Product fields, types, statuses, and key rules |
| `woo://schema/order` | Order fields, status lifecycle, and payment info |
| `woo://schema/coupon` | Coupon types, limits, restrictions, and rules |
| `woo://reference/product-types` | When to use simple, variable, grouped, or external products |
| `woo://reference/order-statuses` | Order status transitions and lifecycle diagram |

Resources are read-only context that agents can fetch to understand WooCommerce data structures before making API calls.

## Prompts

3 guided workflow prompts that orchestrate multi-step operations:

| Prompt | Args | What it does |
| --- | --- | --- |
| `setup_variable_product` | `product_name`, `attribute_name`, `variations` | Creates a variable product end-to-end: attribute → terms → product → variations → publish |
| `process_order` | `order_id` | Reviews an order's details and recommends the appropriate status transition |
| `catalog_overview` | _(none)_ | Runs 5 tools in parallel to produce a store dashboard (products, orders, customers, categories, top sellers) |

## Tool Annotations

Every tool is annotated with behavior hints so AI agents can make safe decisions:

| Annotation | Meaning | Applied to |
| --- | --- | --- |
| `readOnlyHint` | No side effects, safe to call anytime | All `list_*`, `get_*`, and report tools (36) |
| `destructiveHint` | Deletes or removes data | All `delete_*` tools + `cleanup_orphaned_media` (15) |
| `idempotentHint` | Safe to retry, same result each time | All `update_*` and `batch_update_*` tools (13) |

All tools also set `openWorldHint: false` — they only interact with WooCommerce, no external side effects.

## Configuration

### Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `WORDPRESS_SITE_URL` | Yes | WordPress store URL (e.g. `https://store.example.com`) |
| `WOOCOMMERCE_CONSUMER_KEY` | Yes | WooCommerce REST API consumer key (`ck_...`) |
| `WOOCOMMERCE_CONSUMER_SECRET` | Yes | WooCommerce REST API consumer secret (`cs_...`) |
| `WORDPRESS_USERNAME` | No | WordPress admin username (for media tools) |
| `WORDPRESS_APP_PASSWORD` | No | WordPress Application Password (for media tools) |

### Using a `.env` file

Instead of inlining credentials, point to a directory with a `.env` file:

```json
{
  "mcpServers": {
    "woocommerce": {
      "command": "npx",
      "args": ["-y", "@amitgurbani/mcp-server-woocommerce"],
      "cwd": "/path/to/your/project"
    }
  }
}
```

### Multiple Stores

Use different server names to manage multiple stores from one project:

```json
{
  "mcpServers": {
    "store-a": {
      "command": "npx",
      "args": ["-y", "@amitgurbani/mcp-server-woocommerce"],
      "env": { "WORDPRESS_SITE_URL": "https://store-a.com", "..." }
    },
    "store-b": {
      "command": "npx",
      "args": ["-y", "@amitgurbani/mcp-server-woocommerce"],
      "env": { "WORDPRESS_SITE_URL": "https://store-b.com", "..." }
    }
  }
}
```

## Token Optimization

All tools support an optional `fields` param (comma-separated) to return only specific fields:

```text
# Browsing products — just names and prices
fields: "id,name,price"

# Stock check
fields: "id,name,stock_status,stock_quantity"

# Order overview
fields: "id,number,status,total"
```

This reduces response size by **60-97%**, keeping AI context windows focused and costs low.

## Agent Orchestration

This project is maintained by a team of AI agents coordinated via [Paperclip](https://github.com/paperclipai/paperclip). See [docs/ORCHESTRATION.md](docs/ORCHESTRATION.md) for details.

## Development

```bash
git clone https://github.com/AmitGurbani/mcp-server-woocommerce.git
cd mcp-server-woocommerce
pnpm install
```

```bash
pnpm dev          # Watch mode
pnpm build        # Build
pnpm start        # Run directly
pnpm test         # Run tests
pnpm test:watch   # Run tests in watch mode
pnpm inspector    # Debug with MCP Inspector
```

### Docker

```bash
docker build -t mcp-server-woocommerce .
docker run \
  -e WORDPRESS_SITE_URL=https://store.example.com \
  -e WOOCOMMERCE_CONSUMER_KEY=ck_your_key \
  -e WOOCOMMERCE_CONSUMER_SECRET=cs_your_secret \
  mcp-server-woocommerce
```

## License

MIT

---

WooCommerce is a registered trademark of Automattic Inc. This project is not affiliated with, endorsed by, or sponsored by Automattic Inc.
