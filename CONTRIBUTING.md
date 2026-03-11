# Contributing to mcp-server-woocommerce

Thanks for your interest in contributing! This guide covers the patterns and conventions you need to follow.

## Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io/) package manager
- A WooCommerce store with REST API credentials (for manual testing)

## Setup

```bash
git clone https://github.com/AmitGurbani/mcp-server-woocommerce.git
cd mcp-server-woocommerce
pnpm install
pnpm build
```

## Project Structure

```
src/
├── index.ts              # Entry point — dual transport (stdio default, HTTP via MCP_TRANSPORT=http)
├── server.ts             # McpServer factory (createServer()) + tool/resource/prompt registration
├── http.ts               # HTTP transport server (StreamableHTTPServerTransport, bearer auth, sessions)
├── resources.ts          # MCP resources (schema references for agent context)
├── prompts.ts            # MCP prompts (guided multi-step workflows)
├── services/
│   ├── base.ts           # Shared error handling, pagination, field filtering
│   ├── woo-client.ts     # WooCommerce REST API client singleton
│   └── wp-client.ts      # WordPress REST API client (media)
└── tools/
    ├── products.ts       # Product CRUD tools
    ├── categories.ts     # Category CRUD tools
    ├── tags.ts           # Tag CRUD tools
    ├── brands.ts         # Brand CRUD tools
    ├── attributes.ts     # Global attributes + terms
    ├── variations.ts     # Product variation CRUD + batch
    ├── orders.ts         # Order CRUD tools
    ├── refunds.ts        # Order refund tools
    ├── order-notes.ts    # Order note tools
    ├── customers.ts      # Customer CRUD tools
    ├── coupons.ts        # Coupon CRUD tools
    ├── reviews.ts        # Product review tools
    ├── payment-gateways.ts # Payment gateway tools
    ├── shipping.ts       # Shipping zones, methods, classes
    ├── taxes.ts          # Tax rates and classes
    ├── webhooks.ts       # Webhook CRUD tools
    ├── settings.ts       # Store settings tools
    ├── system-status.ts  # System status and tools
    ├── data.ts           # Countries and currencies
    ├── reports.ts        # Sales reports + top sellers
    └── media.ts          # WordPress media management
```

## Adding a New Tool Module

### 1. Create the tool file

Create `src/tools/yourmodule.ts` following this pattern:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { wooApi } from "../services/woo-client.js";
import { handleListRequest, handleRequest, resolveFields } from "../services/base.js";

// Fields returned in list responses (keep minimal for token efficiency)
const WIDGET_LIST_FIELDS = ["id", "name", "slug", "status"];

// Fields returned in single-item responses (more detail is fine)
const WIDGET_FIELDS = [...WIDGET_LIST_FIELDS, "description", "date_created"];

export function registerWidgetTools(server: McpServer) {
  // List tool (readOnly — no side effects)
  server.registerTool(
    "list_widgets",
    {
      description: "List WooCommerce widgets. Use fields param to request only needed fields.",
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        search: z.string().optional().describe("Search term"),
        per_page: z.number().min(1).max(100).optional().default(20).describe("Items per page (max 100)"),
        page: z.number().min(1).optional().default(1).describe("Page number"),
        fields: z.string().optional().describe("Comma-separated fields to return (default: id,name,slug,status)"),
      },
    },
    async ({ fields, per_page, page, ...filters }) => {
      const f = resolveFields(fields, WIDGET_LIST_FIELDS);
      return await handleListRequest(
        wooApi.get("widgets", { per_page, page, _fields: f.join(","), ...filters }),
        page,
        per_page,
        f,
      );
    },
  );

  // Get single item (readOnly)
  server.registerTool(
    "get_widget",
    {
      description: "Get a single WooCommerce widget by ID. Use fields param to request only needed fields.",
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe("Widget ID"),
        fields: z.string().optional().describe("Comma-separated fields to return (default: id,name,slug,status,description,date_created)"),
      },
    },
    async ({ id, fields }) => {
      const f = resolveFields(fields, WIDGET_FIELDS);
      return await handleRequest(
        wooApi.get(`widgets/${id}`, { _fields: f.join(",") }),
        f,
      );
    },
  );

  // Create (no special annotations — default behavior)
  server.registerTool(
    "create_widget",
    {
      description: "Create a new WooCommerce widget",
      annotations: { openWorldHint: false },
      inputSchema: {
        name: z.string().describe("Widget name"),
        // ... other required/optional params
        fields: z.string().optional().describe("Comma-separated fields to return in response"),
      },
    },
    async ({ fields, ...params }) => {
      const f = resolveFields(fields, WIDGET_FIELDS);
      return await handleRequest(wooApi.post("widgets", params), f);
    },
  );

  // Update (idempotent — same input produces same result)
  server.registerTool(
    "update_widget",
    {
      description: "Update an existing WooCommerce widget",
      annotations: { idempotentHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe("Widget ID"),
        name: z.string().optional().describe("Widget name"),
        // ... other updatable params
        fields: z.string().optional().describe("Comma-separated fields to return in response"),
      },
    },
    async ({ id, fields, ...data }) => {
      const f = resolveFields(fields, WIDGET_FIELDS);
      return await handleRequest(wooApi.put(`widgets/${id}`, data), f);
    },
  );

  // Delete (destructive — removes data)
  server.registerTool(
    "delete_widget",
    {
      description: "Delete a WooCommerce widget",
      annotations: { destructiveHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe("Widget ID"),
        force: z.boolean().optional().default(false).describe("True to permanently delete"),
        fields: z.string().optional().describe("Comma-separated fields to return in response"),
      },
    },
    async ({ id, force, fields }) => {
      const f = resolveFields(fields, WIDGET_FIELDS);
      return await handleRequest(wooApi.delete(`widgets/${id}`, { force }), f);
    },
  );
}
```

### 2. Register in server.ts

```typescript
import { registerWidgetTools } from "./tools/widgets.js";

// Add to the registration block:
registerWidgetTools(server);
```

### 3. Build and verify

```bash
pnpm build
```

Fix any TypeScript errors before submitting.

## Key Patterns

### Error Handling & Response Formatting

All tools use two helpers from `src/services/base.ts`:

- **`handleListRequest(promise, page, perPage, fields)`** — For list endpoints. Wraps the API call, extracts pagination headers (`x-wp-total`, `x-wp-totalpages`), filters response fields, and formats the MCP response. Returns `{ data, pagination }`.
- **`handleRequest(promise, fields)`** — For single-item endpoints (get, create, update, delete). Wraps the API call, filters fields, and formats the response.

Both catch errors automatically via `extractError()` and return `{ isError: true }` with a readable message. You should **never** add try/catch in individual tools.

### Field Filtering

Every tool must support the `fields` parameter for token-efficient responses:

1. Define `*_LIST_FIELDS` (compact) and `*_FIELDS` (detailed) arrays at module scope
2. Use `resolveFields(fields, defaults)` to parse user input or fall back to defaults
3. Pass `_fields: f.join(",")` as a query param (server-side filtering)
4. Pass `f` to `handleListRequest`/`handleRequest` (client-side `pickFields` backup)

List tool descriptions should include: `"Use fields param to request only needed fields."`

### Tool Naming Convention

- `list_*` — paginated list with search/filter params
- `get_*` — single item by ID
- `create_*` — create new item
- `update_*` — update existing item by ID
- `delete_*` — delete item by ID

### Tool Description Guidelines

Descriptions are read by LLMs to decide which tool to use. Keep them:

- **Concise** — lead with what it does
- **Keyword-rich** — include "WooCommerce" and the entity name
- **Actionable** — mention the `fields` param on list/get tools

### Tool Annotations

Every tool must include `annotations` for safe AI agent behavior. The rules:

| Operation | Annotations |
|---|---|
| `list_*` / `get_*` / reports | `{ readOnlyHint: true, openWorldHint: false }` |
| `create_*` | `{ openWorldHint: false }` |
| `update_*` / `batch_update_*` | `{ idempotentHint: true, openWorldHint: false }` |
| `delete_*` / cleanup | `{ destructiveHint: true, openWorldHint: false }` |

All tools set `openWorldHint: false` because they only interact with WooCommerce — no external side effects.

### Actionable Error Messages

Error handling in `base.ts` maps WooCommerce error codes and HTTP statuses to helpful guidance messages. If you encounter a new common error, add it to `ERROR_GUIDANCE` or `HTTP_GUIDANCE` in `base.ts`.

### Adding Resources and Prompts

- **Resources** (`src/resources.ts`): Static schema references that agents can read for context. Add new resources using `server.registerResource()` with a `woo://` URI scheme.
- **Prompts** (`src/prompts.ts`): Multi-step guided workflows that orchestrate tool calls. Add new prompts using `server.registerPrompt()`. Prompts should describe a clear step-by-step sequence referencing specific tool names.

### Dual Transport Architecture

The server supports two transport modes, selected via the `MCP_TRANSPORT` env var:

- **stdio** (default): `src/index.ts` imports `server` from `src/server.ts` and connects via `StdioServerTransport`. This is the standard local mode for `npx` usage.
- **HTTP** (`MCP_TRANSPORT=http`): `src/index.ts` dynamically imports `src/http.ts`, which uses the SDK's `StreamableHTTPServerTransport` and `createMcpExpressApp()`. Each HTTP session gets its own `McpServer` instance via the `createServer()` factory in `src/server.ts`.

Key design points:
- `src/server.ts` exports both `createServer()` (factory for HTTP) and `server` (singleton for stdio backward compat)
- `src/http.ts` is a standalone module — all HTTP logic is isolated there
- Bearer token auth (`MCP_AUTH_TOKEN`) is required in HTTP mode
- No new dependencies — Express comes bundled with `@modelcontextprotocol/sdk`

### CJS Compatibility

The `@woocommerce/woocommerce-rest-api` package uses a CJS default export. The workaround in `woo-client.ts` handles this:

```typescript
const WooCommerceRestApi = (WooCommerceRestApiPkg as any).default || WooCommerceRestApiPkg;
```

Don't change this pattern — it's required for ESM/CJS interop.

### Zod Schemas

All tool parameters use [Zod](https://zod.dev/) for validation. Key conventions:

- Required params: `z.string().describe("...")`
- Optional params: `z.string().optional().describe("...")`
- With defaults: `z.number().optional().default(20).describe("...")`
- Always add `.describe()` — these become param descriptions for LLM consumers

## Testing

```bash
pnpm test                     # Run all vitest tests
pnpm test:watch               # Watch mode during development
pnpm build                    # TypeScript compilation check
npx @modelcontextprotocol/inspector node build/index.js  # Interactive tool testing
```

Tests live alongside source files as `*.test.ts`. Key test files:

- `src/services/base.test.ts` — tests for shared helpers (`resolveFields`, `handleRequest`, `handleListRequest`)
- `src/tools/products.test.ts` — product CRUD tool tests (good template for new tools)
- `src/tools/orders.test.ts` — order tool tests
- `src/tools/refunds.test.ts` — order refund tool tests
- `src/tools/order-notes.test.ts` — order note tool tests
- `src/tools/reviews.test.ts` — product review tool tests
- `src/tools/payment-gateways.test.ts` — payment gateway tool tests
- `src/tools/system-status.test.ts` — system status tool tests
- `src/tools/data.test.ts` — countries and currencies tool tests
- `src/tools/schema-validation.test.ts` — validates all 100 tools register correctly with proper schemas and naming conventions
- `src/resources.test.ts` — validates MCP resources register with correct URIs and content
- `src/prompts.test.ts` — validates MCP prompts register with correct names and arguments

When adding a new tool module, `schema-validation.test.ts` will automatically catch missing registrations — just add your tool names to the `EXPECTED_TOOLS` map.

You can also use the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) to manually test tools against a live WooCommerce store.

## Good First Issues

Looking for a way to start contributing? These areas are beginner-friendly:

- **Add a new WooCommerce entity** — e.g., downloadable files, product shipping classes, store notifications. Each follows the same CRUD pattern shown above.
- **Improve field defaults** — Review `*_LIST_FIELDS` / `*_FIELDS` arrays for existing tools and suggest additions or removals based on real usage.
- **Add a new MCP resource** — Create a schema reference in `src/resources.ts` for an undocumented WooCommerce entity (e.g., `woo://schema/customer`).
- **Add a new MCP prompt** — Design a guided workflow in `src/prompts.ts` for a common multi-step operation (e.g., `bulk_price_update`, `inventory_audit`).
- **Enhance error guidance** — Add new entries to `ERROR_GUIDANCE` or `HTTP_GUIDANCE` in `src/services/base.ts` for WooCommerce errors you've encountered.

## Pull Request Guidelines

1. **One module per PR** — Keep PRs focused on a single tool module or feature
2. **Tests must pass** — Run `pnpm test` and `pnpm build` before submitting
3. **Follow existing patterns** — Match the structure and conventions of existing tool files
4. **Descriptive tool descriptions** — Write for LLM consumption, not just humans
5. **Include field defaults** — Every list/get tool needs `*_LIST_FIELDS` / `*_FIELDS`
6. **No secrets** — Never commit API keys, credentials, or `.env` files

## Environment Variables

The server requires three environment variables (typically set via `.mcp.json` config):

| Variable | Description |
|---|---|
| `WORDPRESS_SITE_URL` | Your WooCommerce store URL |
| `WOOCOMMERCE_CONSUMER_KEY` | WooCommerce REST API consumer key |
| `WOOCOMMERCE_CONSUMER_SECRET` | WooCommerce REST API consumer secret |
