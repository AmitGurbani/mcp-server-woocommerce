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
| Glama | ✅ Auto-synced | Listed under E-commerce Solutions via Official Registry |
| PulseMCP | ✅ Auto | Auto-crawls Official Registry |
| Windsurf | ✅ Auto | Auto-syncs from Official Registry |
| Cursor Directory | ⏳ Submitted | Submitted March 10; verify by March 12-13, re-submit if not visible |
| Smithery | ⏭️ Skipped | Web form requires hosted HTTP URL; revisit after Streamable HTTP |
| mcp.so | ❗ Not Submitted | A generic "WooCommerce" slug exists — submit ours as comprehensive alternative via mcp.so/submit |
| awesome-mcp-servers | ❗ Not Submitted | Techspawn already listed in E-commerce section; submit PR with our entry |
| MCP Market | ⏳ Pending | Monitor — may not be accepting submissions yet |

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
- [AmitGurbani/mcp-server-woocommerce](https://github.com/AmitGurbani/mcp-server-woocommerce) 📇 ☁️ - Comprehensive WooCommerce MCP server with 100 tools for store management — products, orders, customers, coupons, shipping, taxes, and more. Features token-optimized field filtering (60-97% savings), 7 MCP resources, 5 guided prompts, and tool annotations.
```

### Cline Marketplace

**URL**: [github.com/cline/mcp-marketplace](https://github.com/cline/mcp-marketplace)

For users of the Cline VS Code extension.

### Windsurf Directory

Built into Windsurf IDE; primarily pulls from Official MCP Registry and Smithery. No separate submission needed if listed on those.

## Key Differentiators (for registry descriptions)

Use these points in all submissions:
- **100 tools** across 20 domains — most comprehensive WooCommerce MCP server
- **Token optimization** — field filtering reduces response size by 60-97%
- **MCP resources** — 7 schema references for agent context
- **Guided prompts** — 5 multi-step workflows for common operations
- **Tool annotations** — readOnly, destructive, idempotent hints for safe AI behavior
- **Actionable errors** — error responses include fix guidance
- **Full CRUD** — products, categories, tags, brands, attributes, variations, orders, refunds, order notes, customers, coupons, reviews, payment gateways, reports, media, shipping, taxes, webhooks, settings, system status, data

### Registry Description Template

> Comprehensive WooCommerce MCP server with 100 tools for full store management — products, orders, refunds, notes, customers, coupons, reviews, categories, tags, brands, attributes, variations, payment gateways, reports, media, shipping, taxes, webhooks, settings, system status, and data. Features token-optimized field filtering (60-97% savings), 7 MCP resources, 5 guided prompts, tool annotations, and actionable error messages.

## Landscape (March 2026)

Other WooCommerce MCP servers in the ecosystem:

| Server | Tools | Field Filtering | Resources | Prompts | Annotations | Stack |
|--------|-------|----------------|-----------|---------|-------------|-------|
| **@amitgurbani/mcp-server-woocommerce** | 100 | Yes (60-97%) | 7 | 5 | Yes | TypeScript |
| Techspawn/Opestro (Smithery) | 91+ | No | No | No | Yes | Node.js (TS) |
| Automattic (native, WC 10.6+) | ~15-20 | No | No | No | No | PHP/Proxy |
| hlos-ai (npm) | 30+ | No | No | No | No | Python 3.13+ |
| MseeP.ai | ~28-30 | No | No | No | No | Node.js |
| saifnasserer/Woo-MCP | ~25 | No | No | No | No | Python/FastMCP |
| Webkul | ~25 | No | No | No | No | Python/FastMCP |
| InstaWP WordPress MCP | Varies | No | No | No | No | Managed |
| LobeHub WooCommerce MCP | ~20 | No | No | No | No | TypeScript |
| CData | N/A (SQL) | No | No | No | No | SQL-like read-only |

### Key Trends (March 11, 2026)
- **Techspawn leads on raw tool count** (91+) with tool annotations + OAuth 2.1 + Streamable HTTP + JSON-RPC batching
- **Automattic expanding native MCP** — WC 10.6.0 (March 10), WordPress 7.0 Beta 3, ~15-20 tools in "Beta" via Abilities API; local proxy (`@automattic/mcp-wordpress-remote`) now available
- **New entrants**: InstaWP (agency multi-site management), LobeHub WooCommerce MCP (modular TypeScript), Vostos007 (Express HTTP wrapper)
- **hlos-ai specializing**: Optimized for high-volume stores (7,000+ products) with AI data enhancement for batch SEO
- **FastMCP (Python) growing**: Multiple Python-based servers targeting SEO auditing and BI reporting niches
- **Transport shift**: Servers increasingly support both stdio (local) and HTTP/SSE (cloud); Streamable HTTP becoming standard
- **No-code emergence**: OttoKit and n8n now offer MCP Builders for WooCommerce
- **MCP ecosystem**: 10,000+ servers in official registry, C# SDK v1.0 GA, WebMCP in Chrome 146 Canary, Tasks primitive for durable state, Server Cards UI standard adopted by Cursor/LobeHub/Claude Code
- **Security**: CVE-2026-26118 (SSRF in Azure MCP servers) and CVE-2026-26144 (Excel/Copilot data exfiltration) patched March 11
- **SDK adoption**: Python and TypeScript MCP SDKs reached 97 million monthly downloads

**Our positioning**: Quality AND quantity — 100 tools with token optimization, MCP resources/prompts/annotations, actionable errors, and TypeScript/npx ecosystem compatibility. No other server offers field filtering, MCP resources, or MCP prompts. Techspawn now has annotations but still lacks filtering/resources/prompts.
