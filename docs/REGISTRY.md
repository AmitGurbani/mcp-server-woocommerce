# MCP Registry Submission Guide

Steps for listing mcp-server-woocommerce on MCP registries and directories.

## Pre-requisites

Before submitting to any registry:
1. Push repo to GitHub (`github.com/AmitGurbani/mcp-server-woocommerce`) ✅
2. Publish to npm (see npm section below) ❌ **BLOCKER**
3. Ensure README has clear setup instructions, tool list, and examples ✅
4. Verify server works via `npx @modelcontextprotocol/inspector node build/index.js`
5. `server.json` created in repo root for Official MCP Registry ✅
6. `smithery.yaml` configured for Smithery ✅

## npm

**Status**: Name `mcp-server-woocommerce` is taken by hlos-ai — actively maintained (~30 tools, updated 2025). Not a placeholder; dispute won't succeed.

**Decision**: Publish as scoped package `@amitgurbani/mcp-server-woocommerce`.

**Steps**:
```bash
npm login
pnpm build
npm publish --access public  # required for scoped packages
```

## Priority 1: Core Registries

### Official MCP Registry (publish first — highest ROI)

**URL**: [registry.modelcontextprotocol.io](https://registry.modelcontextprotocol.io)

Many other directories (PulseMCP, Windsurf, Glama) auto-crawl this registry, so publishing here maximizes reach.

**Pre-requisite**: `server.json` already created in repo root with the correct schema and metadata.

**Steps**:
1. Install publisher CLI: `npm install -g @modelcontextprotocol/publisher`
2. Auth: `mcp-publisher login github`
3. Publish: `mcp-publisher publish`
4. *Alternative*: Fork [modelcontextprotocol/registry](https://github.com/modelcontextprotocol/registry), add entry to `data/seed.json`, and submit a PR

**Registry name**: `io.github.amitgurbani/mcp-server-woocommerce` (reverse DNS format per registry convention)

### Smithery

**Status**: `smithery.yaml` already configured in repo.

**Steps**:
1. Go to [smithery.ai](https://smithery.ai) and sign in with GitHub
2. Connect the `AmitGurbani/mcp-server-woocommerce` repository
3. Smithery auto-builds using `Dockerfile` + `smithery.yaml`
4. Users get one-click install: `npx @smithery/cli install @AmitGurbani/mcp-server-woocommerce`

### Cursor Directory

**URL**: [cursor.directory](https://cursor.directory)

Primary destination for Cursor IDE users. Supports "Add MCP" web interface.

**Steps**:
1. Add `cursor-mcp` topic tag to GitHub repo
2. Submit via "Add MCP" button on [cursor.directory](https://cursor.directory)
3. Add deep link to README for one-click install:
   ```
   cursor://settings/mcp/add?name=WooCommerce&type=stdio&command=npx&args=-y,@amitgurbani/mcp-server-woocommerce
   ```

## Priority 2: Major Directories

### Glama

**URL**: [glama.ai/mcp](https://glama.ai/mcp)

**Steps**:
1. Submit repo URL via "Add Server" button on Glama
2. They run security review + dependency scanning
3. May auto-sync from Official MCP Registry

### mcp.so

**Steps**:
1. Open a GitHub issue on [mcp-so/mcp-servers](https://github.com/mcp-so/mcp-servers)
2. Include: name, repo URL, description, tags (woocommerce, ecommerce, wordpress)

### PulseMCP

**URL**: [pulsemcp.com](https://pulsemcp.com)

**Steps**:
1. Auto-crawls the Official MCP Registry
2. Also accepts manual submissions via web form

### MCP Market

**URL**: [mcp.market](https://mcp.market)

**Steps**:
1. Submit via web form on mcp.market

## Priority 3: Community Lists & Emerging

### Awesome MCP Servers (GitHub)

**Steps**:
1. Submit PR to [appcypher/awesome-mcp-servers](https://github.com/appcypher/awesome-mcp-servers) — largest list
2. Also submit to [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers)

### Cline Marketplace

**URL**: [github.com/cline/mcp-marketplace](https://github.com/cline/mcp-marketplace)

For users of the Cline VS Code extension.

### Windsurf Directory

Built into Windsurf IDE; primarily pulls from Official MCP Registry and Smithery. No separate submission needed if listed on those.

## Key Differentiators (for registry descriptions)

Use these points in all submissions:
- **54 tools** across 10 domains — most comprehensive WooCommerce MCP server
- **Token optimization** — field filtering reduces response size by 60-97%
- **MCP resources** — 5 schema references for agent context
- **Guided prompts** — 3 multi-step workflows for common operations
- **Tool annotations** — readOnly, destructive, idempotent hints for safe AI behavior
- **Actionable errors** — error responses include fix guidance
- **Full CRUD** — products, categories, tags, brands, attributes, variations, orders, customers, coupons, reports, media

### Registry Description Template

> Comprehensive WooCommerce MCP server with 54 tools for full store management — products, orders, customers, coupons, categories, tags, brands, attributes, variations, reports, and media. Features token-optimized field filtering (60-97% savings), 5 MCP resources, 3 guided prompts, tool annotations, and actionable error messages.

## Landscape (March 2026)

Other WooCommerce MCP servers in the ecosystem:

| Server | Tools | Field Filtering | Resources | Prompts | Annotations | Stack |
|--------|-------|----------------|-----------|---------|-------------|-------|
| **@amitgurbani/mcp-server-woocommerce** | 54 | Yes (60-97%) | 5 | 3 | Yes | TypeScript |
| Techspawn/Opestro (Smithery) | 91+ | No | No | No | No | Node.js |
| Automattic (native, WC 10.3+) | ~15 | No | No | No | No | Node.js |
| hlos-ai (npm) | ~30 | No | No | No | No | Node.js |
| saifnasserer/Woo-MCP | ~20 | No | No | No | No | Python/FastMCP |
| Webkul | ~25 | No | No | No | No | Python/FastMCP |
| CData | ~10 | No | No | No | No | SQL-like read-only |

**Our positioning**: Quality over quantity — token optimization, MCP resources/prompts/annotations, actionable errors, and TypeScript/npx ecosystem compatibility. No other server offers field filtering, resources, prompts, or tool annotations.
