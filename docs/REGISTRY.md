# MCP Registry Submission Guide

Steps for listing mcp-server-woocommerce on MCP registries and directories.

## Pre-requisites

Before submitting to any registry:
1. Push repo to GitHub (`github.com/AmitGurbani/mcp-server-woocommerce`) ✅
2. Publish to npm ✅ (`@amitgurbani/mcp-server-woocommerce` v1.1.0)
3. Ensure README has clear setup instructions, tool list, and examples ✅
4. Verify server works via `npx @modelcontextprotocol/inspector node build/index.js`
5. `server.json` created in repo root for Official MCP Registry ✅
6. `smithery.yaml` configured for Smithery ✅

## npm ✅

**Status**: Published as `@amitgurbani/mcp-server-woocommerce` v1.1.0.

Name `mcp-server-woocommerce` is taken by hlos-ai. We use the scoped package name.

## Submission Status

| Registry | Status | Action Required |
|----------|--------|----------------|
| Official MCP Registry | ⚠️ Verify | Previously published as `io.github.AmitGurbani/mcp-server-woocommerce` — verify listing is current with v1.1.0; may need re-publish |
| Glama | ⚠️ Verify | Not appearing in WooCommerce search results — may need manual re-submission via "Add Server" |
| PulseMCP | ⚠️ Verify | Previously auto-crawled — confirm listing shows v1.1.0 / 101 tools |
| Windsurf | ⚠️ Verify | Auto-syncs from Official Registry — depends on Official Registry status |
| Cursor Directory | ✅ Live | Approved March 11 |
| MCP Market | ✅ Live | Shows stale 54 tool count — needs v1.1.0 metadata refresh |
| Smithery | ⏭️ Skipped | Requires hosted HTTP URL; revisit after Streamable HTTP support |
| mcp.so | ❗ Not Submitted | Opestro listed with ~2 tools (order-only). Submit via mcp.so/submit |
| awesome-mcp-servers | ❗ Not Submitted | Multiple WooCommerce entries exist. Submit PR with 101 tools + filtering |
| Cline Marketplace | ❗ Not Submitted | Submit to github.com/cline/mcp-marketplace |

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
- [AmitGurbani/mcp-server-woocommerce](https://github.com/AmitGurbani/mcp-server-woocommerce) 📇 ☁️ - Comprehensive WooCommerce MCP server with 101 tools for store management — products, orders, customers, coupons, shipping, taxes, and more. Features token-optimized field filtering (60-97% savings), 7 MCP resources, 5 guided prompts, and tool annotations.
```

### Cline Marketplace

**URL**: [github.com/cline/mcp-marketplace](https://github.com/cline/mcp-marketplace)

For users of the Cline VS Code extension.

### Windsurf Directory

Built into Windsurf IDE; primarily pulls from Official MCP Registry and Smithery. No separate submission needed if listed on those.

## Key Differentiators (for registry descriptions)

Use these points in all submissions:
- **101 tools** across 20 domains — most comprehensive WooCommerce MCP server
- **Token optimization** — field filtering reduces response size by 60-97%
- **MCP resources** — 7 schema references for agent context
- **Guided prompts** — 5 multi-step workflows for common operations
- **Tool annotations** — readOnly, destructive, idempotent hints for safe AI behavior
- **Actionable errors** — error responses include fix guidance
- **Full CRUD** — products, categories, tags, brands, attributes, variations, orders, refunds, order notes, customers, coupons, reviews, payment gateways, reports, media, shipping, taxes, webhooks, settings, system status, data

### Registry Description Template

> Comprehensive WooCommerce MCP server with 101 tools for full store management — products, orders, refunds, notes, customers, coupons, reviews, categories, tags, brands, attributes, variations, payment gateways, reports, media, shipping, taxes, webhooks, settings, system status, and data. Features token-optimized field filtering (60-97% savings), 7 MCP resources, 5 guided prompts, tool annotations, and actionable error messages.

## Landscape (March 2026 — Update #5)

WooCommerce MCP servers in the ecosystem:

| Server | WC Tools | Field Filtering | Resources | Prompts | Annotations | Stack |
|--------|----------|----------------|-----------|---------|-------------|-------|
| **@amitgurbani/mcp-server-woocommerce** | **100** | **Yes (60-97%)** | **7** | **5** | **Yes** | TypeScript |
| Techspawn | 80+ | No | No | No | No | Node.js (TS) |
| Maxli53 (Enterprise Suite) | 115+ | Unknown | Unknown | Unknown | Unknown | LobeHub |
| Respira (respira.press) | 21 WC (88 total) | No | No | No | Unknown | WP Plugin + Node |
| iOSDevSK/mcp-for-woocommerce | 30+ | Basic params | No | No | Basic | WP Plugin (PHP) |
| Automattic (native WC) | ~7 | No | No | No | No | PHP (Abilities API) |
| WordPress/mcp-adapter | Bridge | N/A | Yes | Yes | N/A | PHP Plugin |
| Opestro | 2 | No | No | No | No | Node.js |
| saifnasserer/Woo-MCP | ~10 | No | No | No | No | Python/FastMCP |
| Webkul | Unknown | Unknown | Unknown | Unknown | Unknown | Python/FastMCP |
| CData | SQL-like | No | No | No | No | JDBC/Java (read-only) |

Notes:
- **Techspawn**: 80+ tools covering WP content + WC CRUD. No npm releases, no field filtering/resources/prompts. Forks/clones on GitHub: Quadica, Kenan7, MaxDatita, JeffersonRiobueno, Marckello, afarhadi99.
- **Maxli53**: Claims 115+ tools on LobeHub — unverified quality. Needs investigation.
- **Respira**: Commercial product. 88 tools total but only 21 are WooCommerce-specific; rest are WordPress + 11 page builders. "Safety Seatbelt" (duplicate-before-edit) is standout feature. SEO/AEO analysis included.
- **iOSDevSK**: Upgraded significantly — now 30+ tools with dual transport (STDIO + Streamable HTTP) and optional JWT auth. Based on Automattic's WordPress MCP. No longer read-only.
- **Automattic**: `Automattic/wordpress-mcp` deprecated in favor of `WordPress/mcp-adapter`. Native WC MCP still "Developer Preview" with ~7 abilities (Products + Orders CRUD).
- **WordPress/mcp-adapter**: Official canonical MCP adapter bridging WordPress Abilities API to MCP. Supports tools, resources, prompts. Being merged into WP core.

### Key Trends (March 11, 2026 — Update #5)
- **WordPress/mcp-adapter is canonical**: `Automattic/wordpress-mcp` deprecated; `WordPress/mcp-adapter` bridges Abilities API to MCP, supports tools/resources/prompts, heading into WP core
- **WooCommerce native MCP still Developer Preview**: ~7 abilities (Products + Orders) in WC 10.6.0. Enable via WooCommerce > Settings > Advanced > Features > MCP Beta
- **Techspawn grows to 80+ tools**: Full WP+WC CRUD but no npm releases, no field filtering, no resources/prompts
- **Clone proliferation**: Multiple lightweight forks/clones of Techspawn appearing on GitHub and LobeHub
- **Respira enters as commercial player**: 88 tools with page builder intelligence (11 builders), SEO/AEO analysis. WooCommerce coverage limited to 21 tools
- **Transport shift**: Streamable HTTP becoming standard for remote servers; iOSDevSK now supports dual transport + JWT
- **OAuth 2.1 + PKCE**: Mandated for all MCP authorization flows; Dynamic Client Registration (RFC 7591) enables seamless discovery
- **Server Cards**: Structured metadata via `/.well-known/mcp.json` for capability validation without full connection
- **MCP ecosystem scale**: 36,000+ servers, 61,000+ tools indexed. TypeScript SDK v2.0 + Python SDK v2.0 released
- **Enterprise adoption**: Stripe, Figma, Notion, Azure DevOps have launched official MCP endpoints
- **Client updates**: Claude Code dominant agentic CLI; Windsurf acquired by OpenAI (Cascade); Cline growing as open-source alternative

**Our positioning**: 100 WooCommerce-specific tools with token-optimized field filtering (60-97% savings), 7 MCP resources, 5 guided prompts, tool annotations, and actionable errors. No other WooCommerce server offers field filtering, MCP resources, or MCP prompts — this remains our strategic moat. Maxli53 claims 115+ tools but quality/scope is unverified. Techspawn has 80+ tools but lacks filtering/resources/prompts. Respira is commercially polished but only 21 WC tools. Market position: "Feature Leader" for WooCommerce-specific AI workflows.
