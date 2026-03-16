# Deployment Guide

Deploy the WooCommerce MCP server for remote access from Claude mobile/web, Claude Desktop, or any MCP-compatible client.

## Prerequisites

- **WooCommerce REST API keys** (Read/Write) from your store's WooCommerce > Settings > Advanced > REST API
- **Auth token** — either:
  - A random bearer token for Claude Desktop/Code: `openssl rand -hex 32`
  - An Auth0 account (free) for Claude.ai web/mobile Connectors (see [Auth0 Setup](#auth0-setup-for-claude-connectors))

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `MCP_TRANSPORT` | Yes | Must be `http` for remote access |
| `MCP_PORT` | No | Server port (default: `3000`) |
| `WORDPRESS_SITE_URL` | Yes | Your WooCommerce store URL |
| `WOOCOMMERCE_CONSUMER_KEY` | Yes | WooCommerce API key (`ck_...`) |
| `WOOCOMMERCE_CONSUMER_SECRET` | Yes | WooCommerce API secret (`cs_...`) |
| `WOOCOMMERCE_MCP_READ_ONLY` | No | `true` to block all write operations |
| **Bearer Token Auth** | | |
| `MCP_AUTH_TOKEN` | Yes* | Bearer token for authentication |
| **OAuth 2.1 Auth (Auth0)** | | |
| `AUTH0_DOMAIN` | Yes* | Auth0 tenant URL (e.g. `https://your-tenant.us.auth0.com`) |
| `AUTH0_AUDIENCE` | Yes* | Auth0 API identifier |
| `MCP_SERVER_URL` | Yes* | Public URL of your MCP server (e.g. `https://your-app.railway.app/mcp`) |

\* Either `MCP_AUTH_TOKEN` **or** `AUTH0_DOMAIN` + `AUTH0_AUDIENCE` + `MCP_SERVER_URL` is required.

## Auth Modes

The server supports two authentication modes:

### Bearer Token (Simple)

Set `MCP_AUTH_TOKEN` to any secret string. Clients authenticate with `Authorization: Bearer <token>`. Works with Claude Desktop, Claude Code, and the Claude API.

### OAuth 2.1 via Auth0 (For Claude.ai Connectors)

Claude.ai web/mobile Connectors require OAuth 2.1 with PKCE. The server uses [mcp-auth](https://github.com/mcp-auth/js) with Auth0 as the identity provider.

#### Auth0 Setup for Claude Connectors

1. Create a free account at [auth0.com](https://auth0.com) (25,000 MAU free)
2. **Create an API** (Applications > APIs > Create API):
   - Name: `WooCommerce MCP Server`
   - Identifier: `https://mcp.yourstore.com` (any unique URI — this becomes `AUTH0_AUDIENCE`)
   - Signing Algorithm: RS256
3. **Create an Application** (Applications > Applications > Create Application):
   - Type: **Single Page Web Application**
   - Allowed Callback URLs: `https://claude.ai/api/mcp/auth_callback, https://claude.com/api/mcp/auth_callback`
   - Note the **Client ID** from Application Settings (needed when adding the Connector in Claude.ai)
   - PKCE (S256) is enforced automatically for SPA apps
4. Note your **Domain** from Settings (e.g. `your-tenant.us.auth0.com`) — this becomes `AUTH0_DOMAIN`
5. Set the three env vars on your deployment:
   ```
   AUTH0_DOMAIN=https://your-tenant.us.auth0.com
   AUTH0_AUDIENCE=https://mcp.yourstore.com
   MCP_SERVER_URL=https://your-deployment-url.com/mcp
   ```

The server automatically serves `/.well-known/oauth-protected-resource` for MCP client discovery.

---

## Option 1: Railway

The easiest deployment option. Railway auto-detects the Dockerfile and deploys.

**Cost**: ~$0/mo with auto-sleep ($1/mo free credit). $5/mo hobby plan for always-on.

### Steps

1. Sign up at [railway.app](https://railway.app)
2. Click **New Project** > **Deploy from GitHub repo**
3. Select your fork of `mcp-server-woocommerce`
4. Go to **Variables** tab and add:
   ```
   MCP_TRANSPORT=http
   MCP_AUTH_TOKEN=<your-secret-token>
   WORDPRESS_SITE_URL=https://yourstore.com
   WOOCOMMERCE_CONSUMER_KEY=ck_...
   WOOCOMMERCE_CONSUMER_SECRET=cs_...
   ```
   Add `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `MCP_SERVER_URL` if using OAuth.
5. Go to **Settings** > **Networking** > **Generate Domain** to get a public URL
6. Railway auto-deploys on every push to main

### One-click deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/deploy?repo=https://github.com/AmitGurbani/mcp-server-woocommerce)

### Verify

```bash
curl https://your-app.railway.app/health
```

---

## Option 2: Fly.io

Best for cost — scales to zero when idle (effectively free under $5/mo).

**Cost**: ~$0.31/mo with scale-to-zero (waived under $5 threshold). Requires credit card.

### Steps

1. Install the Fly CLI:
   ```bash
   brew install flyctl    # macOS
   # or: curl -L https://fly.io/install.sh | sh
   ```

2. Sign in:
   ```bash
   fly auth login
   ```

3. Clone the repo and launch (uses the included `fly.toml`):
   ```bash
   git clone https://github.com/AmitGurbani/mcp-server-woocommerce.git
   cd mcp-server-woocommerce
   fly launch --copy-config --no-deploy
   ```
   When prompted, choose a unique app name and confirm the Mumbai (bom) region.

4. Set secrets:
   ```bash
   fly secrets set \
     MCP_AUTH_TOKEN="$(openssl rand -hex 32)" \
     WORDPRESS_SITE_URL="https://yourstore.com" \
     WOOCOMMERCE_CONSUMER_KEY="ck_..." \
     WOOCOMMERCE_CONSUMER_SECRET="cs_..."
   ```
   For OAuth, also set `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `MCP_SERVER_URL`.

5. Deploy:
   ```bash
   fly deploy
   ```

6. Verify:
   ```bash
   curl https://your-app.fly.dev/health
   ```

### Scale-to-zero

The included `fly.toml` configures `auto_stop_machines = 'stop'` and `min_machines_running = 0`. The server automatically stops when idle and wakes on incoming requests (1-3 second cold start).

---

## Option 3: Docker

### Using the pre-built image (after first release with Docker workflow)

```bash
docker run -p 3000:3000 \
  -e MCP_TRANSPORT=http \
  -e MCP_AUTH_TOKEN=your-secret-token \
  -e WORDPRESS_SITE_URL=https://yourstore.com \
  -e WOOCOMMERCE_CONSUMER_KEY=ck_your_key \
  -e WOOCOMMERCE_CONSUMER_SECRET=cs_your_secret \
  ghcr.io/amitgurbani/mcp-server-woocommerce:latest
```

### Using Docker Compose (local testing)

1. Create a `.env` file in the project root:
   ```
   MCP_AUTH_TOKEN=test-token-for-local-dev
   WORDPRESS_SITE_URL=https://yourstore.com
   WOOCOMMERCE_CONSUMER_KEY=ck_your_key
   WOOCOMMERCE_CONSUMER_SECRET=cs_your_secret
   ```

2. Start:
   ```bash
   docker compose up
   ```

3. Verify:
   ```bash
   curl http://localhost:3000/health
   ```

### Building from source

```bash
docker build -t mcp-server-woocommerce .
docker run -p 3000:3000 \
  -e MCP_TRANSPORT=http \
  -e MCP_AUTH_TOKEN=your-secret-token \
  -e WORDPRESS_SITE_URL=https://yourstore.com \
  -e WOOCOMMERCE_CONSUMER_KEY=ck_your_key \
  -e WOOCOMMERCE_CONSUMER_SECRET=cs_your_secret \
  mcp-server-woocommerce
```

---

## Option 4: Hostinger

Deploy on Hostinger Business (or higher) web hosting — no SSH needed, all via hPanel dashboard.

**Cost**: Included with your existing Hostinger plan (no extra charges).

### Prerequisites

- Hostinger **Business** or higher plan (Premium does not support Node.js)
- Domain or subdomain pointed to Hostinger
- Code pushed to a GitHub repository

### Steps

1. Go to **hPanel** > **Websites** > **Add Website** > **Node.js Apps**
2. Select **Import Git Repository** and authorize your GitHub account
3. Select the `mcp-server-woocommerce` repository
4. Verify the auto-detected build settings (adjust if needed):
   - **Node.js version**: 22
   - **Install command**: `npm install`
   - **Build command**: `npm run build`
   - **Start command**: `node build/index.js`
5. Add **Environment Variables** (can also be set after deployment):
   ```
   MCP_TRANSPORT=http
   MCP_AUTH_TOKEN=<generate with: openssl rand -hex 32>
   WORDPRESS_SITE_URL=https://yourstore.com
   WOOCOMMERCE_CONSUMER_KEY=ck_...
   WOOCOMMERCE_CONSUMER_SECRET=cs_...
   ```
   For OAuth 2.1 (Claude.ai Connectors), also add:
   ```
   AUTH0_DOMAIN=https://your-tenant.us.auth0.com
   AUTH0_AUDIENCE=https://mcp.yourdomain.com
   MCP_SERVER_URL=https://yourdomain.com/mcp
   ```
6. Click **Deploy** — Hostinger clones, installs, builds, and starts automatically
7. Verify:
   ```bash
   curl https://yourdomain.com/health
   ```

### Redeployment

Push to GitHub and redeploy from **hPanel** > Node.js app dashboard > **Redeploy**. No SSH or manual builds needed.

### Notes

- Hostinger sets the `PORT` env var automatically — the server picks it up via `process.env.PORT`
- HTTPS is handled automatically by Hostinger's reverse proxy
- The Node.js process is managed by Hostinger (auto-restart on crash)
- No Docker support — the app runs directly on Node.js
- Single instance only (no horizontal scaling)

---

## Connecting to Claude

### Claude.ai Web/Mobile (Connectors) — requires OAuth 2.1

1. Complete the [Auth0 setup](#auth0-setup-for-claude-connectors) and deploy with OAuth env vars
2. Go to [claude.ai](https://claude.ai) > **Settings** > **Connectors**
3. Click **Add Custom Connector**
4. Enter your server URL (e.g. `https://your-app.railway.app/mcp` or `https://yourdomain.com/mcp`)
5. Expand **Advanced Settings** and enter the Auth0 **Client ID** (from your Auth0 Application Settings)
6. Claude discovers the OAuth configuration automatically via `/.well-known/oauth-protected-resource`
7. Complete the Auth0 login flow when prompted

### Claude Desktop — bearer token

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "woocommerce": {
      "url": "https://your-app.railway.app/mcp",
      "headers": {
        "Authorization": "Bearer your-secret-token"
      }
    }
  }
}
```

### Claude Code — bearer token

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "woocommerce-remote": {
      "type": "url",
      "url": "https://your-app.railway.app/mcp",
      "headers": {
        "Authorization": "Bearer your-secret-token"
      }
    }
  }
}
```

---

## Health Check

All deployments expose `GET /health` (no authentication required):

```json
{
  "status": "ok",
  "version": "1.2.0",
  "transport": "http",
  "activeSessions": 0,
  "uptime": 123.456
}
```

---

## Important Notes

### Session persistence

Sessions are stored in memory. Restarting or redeploying the server clears all active sessions. Clients automatically re-initialize when they detect a broken session.

### No horizontal scaling

Sessions are in-memory, so you cannot run multiple instances behind a load balancer without sticky sessions. Use a single instance per deployment.

### Security checklist

- Always use HTTPS in production (Railway and Fly.io provide this automatically)
- Use a strong, random `MCP_AUTH_TOKEN`: `openssl rand -hex 32`
- Consider `WOOCOMMERCE_MCP_READ_ONLY=true` for shared or demo deployments
- WooCommerce API keys should have minimal required permissions
- Never commit `.env` files to version control

### Cold starts

With scale-to-zero (Fly.io) or auto-sleep (Railway), there's a 1-5 second delay when the server wakes up from idle. If this is unacceptable, keep `min_machines_running = 1` (Fly.io) or disable auto-sleep (Railway, requires $5/mo hobby plan).
