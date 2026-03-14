import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';

/**
 * HTTP transport integration tests.
 *
 * These tests spawn the actual MCP server in HTTP mode and validate
 * auth, session management, and error handling via real HTTP requests.
 *
 * Requires `express` to be installed as a dependency (see review findings).
 */

const AUTH_TOKEN = 'test-secret-token-12345';
const PORT = 9876; // Use a non-standard port to avoid conflicts

describe('HTTP transport (src/http.ts)', () => {
  let serverProcess: ChildProcess;
  let serverReady: boolean = false;

  beforeAll(async () => {
    const entryPoint = resolve(__dirname, '..', 'build', 'index.js');

    serverProcess = spawn('node', [entryPoint], {
      env: {
        ...process.env,
        MCP_TRANSPORT: 'http',
        MCP_AUTH_TOKEN: AUTH_TOKEN,
        MCP_PORT: String(PORT),
        // Dummy WooCommerce creds — won't be called in these tests
        WORDPRESS_SITE_URL: 'http://localhost:9999',
        WOOCOMMERCE_CONSUMER_KEY: 'ck_test',
        WOOCOMMERCE_CONSUMER_SECRET: 'cs_test',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Wait for server to be ready
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server startup timed out')), 10000);

      serverProcess.stdout?.on('data', (data: Buffer) => {
        if (data.toString().includes('listening')) {
          serverReady = true;
          clearTimeout(timeout);
          resolve();
        }
      });

      serverProcess.stderr?.on('data', (data: Buffer) => {
        const msg = data.toString();
        // Ignore non-fatal stderr output
        if (msg.includes('Error') || msg.includes('error')) {
          clearTimeout(timeout);
          reject(new Error(`Server error: ${msg}`));
        }
      });

      serverProcess.on('exit', (code) => {
        if (!serverReady) {
          clearTimeout(timeout);
          reject(new Error(`Server exited early with code ${code}`));
        }
      });
    });
  }, 15000);

  afterAll(async () => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill('SIGINT');
      await new Promise<void>((resolve) => {
        serverProcess.on('exit', () => resolve());
        setTimeout(resolve, 3000); // fallback
      });
    }
  });

  const baseUrl = `http://127.0.0.1:${PORT}/mcp`;
  const healthUrl = `http://127.0.0.1:${PORT}/health`;

  // --- Health check tests ---

  it('GET /health returns 200 with status info (no auth required)', async () => {
    const res = await fetch(healthUrl);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.version).toBe('1.2.0');
    expect(body.transport).toBe('http');
    expect(typeof body.activeSessions).toBe('number');
    expect(typeof body.uptime).toBe('number');
  });

  // --- Auth tests ---

  it('rejects requests without auth token (401)', async () => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'initialize', id: 1 }),
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('rejects requests with wrong auth token (401)', async () => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer wrong-token',
      },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'initialize', id: 1 }),
    });
    expect(res.status).toBe(401);
  });

  it('rejects requests with malformed auth header (401)', async () => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: AUTH_TOKEN, // Missing "Bearer " prefix
      },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'initialize', id: 1 }),
    });
    expect(res.status).toBe(401);
  });

  // --- Session management tests ---

  it('POST /mcp without session ID and non-init body returns 400', async () => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/list', id: 1 }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toContain('Bad Request');
  });

  it('GET /mcp without session ID returns 400', async () => {
    const res = await fetch(baseUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toContain('Invalid or missing session ID');
  });

  it('GET /mcp with invalid session ID returns 400', async () => {
    const res = await fetch(baseUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
        'mcp-session-id': 'nonexistent-session-id',
      },
    });
    expect(res.status).toBe(400);
  });

  it('DELETE /mcp without session ID returns 400', async () => {
    const res = await fetch(baseUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
    });
    expect(res.status).toBe(400);
  });

  it('DELETE /mcp with invalid session ID returns 400', async () => {
    const res = await fetch(baseUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
        'mcp-session-id': 'nonexistent-session-id',
      },
    });
    expect(res.status).toBe(400);
  });

  // --- Initialize and session lifecycle ---

  it('POST /mcp with valid initialize request creates a session', async () => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' },
        },
        id: 1,
      }),
    });

    expect(res.status).toBe(200);
    const sessionId = res.headers.get('mcp-session-id');
    expect(sessionId).toBeTruthy();
    expect(typeof sessionId).toBe('string');

    // Response is SSE format — parse the event stream
    const text = await res.text();
    const dataLine = text.split('\n').find((line) => line.startsWith('data: '));
    expect(dataLine).toBeDefined();

    const body = JSON.parse(dataLine!.replace('data: ', ''));
    expect(body.jsonrpc).toBe('2.0');
    expect(body.id).toBe(1);
    expect(body.result).toBeDefined();
    expect(body.result.serverInfo).toBeDefined();
    expect(body.result.serverInfo.name).toBe('mcp-server-woocommerce');
  });
});

describe('HTTP transport — auth required', () => {
  it('server exits with code 1 when neither MCP_AUTH_TOKEN nor AUTH0_DOMAIN is set', async () => {
    const entryPoint = resolve(__dirname, '..', 'build', 'index.js');

    const child = spawn('node', [entryPoint], {
      env: {
        ...process.env,
        MCP_TRANSPORT: 'http',
        // MCP_AUTH_TOKEN and AUTH0_DOMAIN intentionally omitted
        WORDPRESS_SITE_URL: 'http://localhost:9999',
        WOOCOMMERCE_CONSUMER_KEY: 'ck_test',
        WOOCOMMERCE_CONSUMER_SECRET: 'cs_test',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const exitCode = await new Promise<number | null>((resolve) => {
      child.on('exit', (code) => resolve(code));
      setTimeout(() => {
        child.kill();
        resolve(null);
      }, 5000);
    });

    expect(exitCode).toBe(1);
  });
});
