# MCP Registry Submission Guide

Steps for listing mcp-server-woocommerce on MCP registries and directories.

## Pre-requisites

Before submitting to any registry:
1. Push repo to GitHub (`github.com/AmitGurbani/mcp-server-woocommerce`) ✅
2. Publish to npm ✅ (`@amitgurbani/mcp-server-woocommerce` v1.0.1)
3. Ensure README has clear setup instructions, tool list, and examples ✅
4. Verify server works via `npx @modelcontextprotocol/inspector node build/index.js`
5. `server.json` created in repo root for Official MCP Registry ✅
6. `smithery.yaml` configured for Smithery ✅

## npm ✅

**Status**: Published as `@amitgurbani/mcp-server-woocommerce` v1.0.1.

Name `mcp-server-woocommerce` is taken by hlos-ai. We use the scoped package name.

## Submission Status

| Registry | Status | Action Required |
|----------|--------|----------------|
| Official MCP Registry | ✅ Published | `io.github.AmitGurbani/mcp-server-woocommerce` |
| Smithery | ⏳ Skipped | Web form requires hosted HTTP URL; CLI available |
| Cursor Directory | ⏳ Submitted | Pending review |
| Glama | ⏳ Pending | Auto-syncs from Official Registry, or submit manually |
| PulseMCP | ✅ Auto | Auto-crawls Official Registry |
| awesome-mcp-servers | ⏳ Pending | Submit PR to punkpeye/awesome-mcp-servers |
| Windsurf | ✅ Auto | Auto-syncs from Official Registry |

## Priority 1: Core Registries

### Official MCP Registry (publish first — highest ROI)

**URL**: [registry.modelcontextprotocol.io](https://registry.modelcontextprotocol.io)

Many other directories (PulseMCP, Windsurf, Glama) auto-crawl this registry, so publishing here maximizes reach.

**Pre-requisite**: `server.json` already created in repo root with the correct schema and metadata.

**Quick start** (run from repo root):
```bash
mcp-publisher login github    # opens browser for GitHub OAuth
mcp-publisher validate        # verify server.json (already passes ✅)
mcp-publisher publish          # submit to registry
```

**Registry name**: `io.github.AmitGurbani/mcp-server-woocommerce` (reverse DNS format per registry convention)

**Note**: Token expires periodically — re-run `mcp-publisher login github` if you get a 401.

### Smithery

**Status**: `smithery.yaml` already configured in repo.

**Option A — CLI** (requires API key from smithery.ai/account/api-keys):
```bash
npx -y @smithery/cli mcp publish github.com/AmitGurbani/mcp-server-woocommerce
```

**Option B — Web**:
1. Go to [smithery.ai](https://smithery.ai) and sign in with GitHub
2. Click "Submit Server" and connect the `AmitGurbani/mcp-server-woocommerce` repository
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
1. Submit via web form at [mcp.so](https://mcp.so)
2. Or open a submission issue if available

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

**Primary list**: [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) (linked to glama.ai directory)

**Steps**: Fork repo, add the line below to `README.md` under "Other Tools and Integrations" (alphabetical order), submit PR.

**Ready-to-use entry** (copy-paste into README.md):
```
- [AmitGurbani/mcp-server-woocommerce](https://github.com/AmitGurbani/mcp-server-woocommerce) 📇 ☁️ - Comprehensive WooCommerce MCP server with 82 tools for store management — products, orders, customers, coupons, shipping, taxes, and more. Features token-optimized field filtering (60-97% savings), 5 MCP resources, 3 guided prompts, and tool annotations.
```

### Cline Marketplace

**URL**: [github.com/cline/mcp-marketplace](https://github.com/cline/mcp-marketplace)

For users of the Cline VS Code extension.

### Windsurf Directory

Built into Windsurf IDE; primarily pulls from Official MCP Registry and Smithery. No separate submission needed if listed on those.

## Key Differentiators (for registry descriptions)

Use these points in all submissions:
- **82 tools** across 14 domains — most comprehensive WooCommerce MCP server
- **Token optimization** — field filtering reduces response size by 60-97%
- **MCP resources** — 5 schema references for agent context
- **Guided prompts** — 3 multi-step workflows for common operations
- **Tool annotations** — readOnly, destructive, idempotent hints for safe AI behavior
- **Actionable errors** — error responses include fix guidance
- **Full CRUD** — products, categories, tags, brands, attributes, variations, orders, customers, coupons, reports, media, shipping, taxes, webhooks, settings

### Registry Description Template

> Comprehensive WooCommerce MCP server with 82 tools for full store management — products, orders, customers, coupons, categories, tags, brands, attributes, variations, reports, media, shipping, taxes, webhooks, and settings. Features token-optimized field filtering (60-97% savings), 5 MCP resources, 3 guided prompts, tool annotations, and actionable error messages.

## Landscape (March 2026)

Other WooCommerce MCP servers in the ecosystem:

| Server | Tools | Field Filtering | Resources | Prompts | Annotations | Stack |
|--------|-------|----------------|-----------|---------|-------------|-------|
| **@amitgurbani/mcp-server-woocommerce** | 82 | Yes (60-97%) | 5 | 3 | Yes | TypeScript |
| Techspawn/Opestro (Smithery) | 91+ | No | No | No | No | Node.js |
| Automattic (native, WC 10.3+) | ~15 | No | No | No | No | Node.js |
| hlos-ai (npm) | ~30 | No | No | No | No | Node.js |
| saifnasserer/Woo-MCP | ~20 | No | No | No | No | Python/FastMCP |
| Webkul | ~25 | No | No | No | No | Python/FastMCP |
| CData | ~10 | No | No | No | No | SQL-like read-only |

**Our positioning**: Quality over quantity — token optimization, MCP resources/prompts/annotations, actionable errors, and TypeScript/npx ecosystem compatibility. No other server offers field filtering, resources, prompts, or tool annotations.
