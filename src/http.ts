import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createServer } from './server.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { MCPAuth, fetchServerConfig } from 'mcp-auth';

// Minimal Express-compatible types (express is a transitive dep via SDK, no @types available)
interface ExpressRequest extends IncomingMessage {
  body?: unknown;
}
interface ExpressResponse extends ServerResponse {
  status(code: number): ExpressResponse;
  json(body: unknown): void;
}

async function main() {
  // Auth configuration
  const authToken = process.env.MCP_AUTH_TOKEN;
  const auth0Domain = process.env.AUTH0_DOMAIN;
  const auth0Audience = process.env.AUTH0_AUDIENCE;
  const mcpServerUrl = process.env.MCP_SERVER_URL;

  if (!authToken && !auth0Domain) {
    console.error(
      'Either MCP_AUTH_TOKEN or AUTH0_DOMAIN + AUTH0_AUDIENCE is required for HTTP transport'
    );
    process.exit(1);
  }

  const app = createMcpExpressApp({ host: '0.0.0.0' });

  const transports: Record<string, StreamableHTTPServerTransport> = {};

  // Health check — no auth required (used by container orchestrators)
  app.get('/health', (_req: ExpressRequest, res: ExpressResponse) => {
    res.status(200).json({
      status: 'ok',
      version: '1.2.0',
      transport: 'http',
      activeSessions: Object.keys(transports).length,
      uptime: process.uptime(),
    });
  });

  // Auth middleware
  if (auth0Domain && auth0Audience && mcpServerUrl) {
    // OAuth 2.1 mode: JWT validation via Auth0
    const authServerConfig = await fetchServerConfig(auth0Domain, { type: 'oidc' });
    const mcpAuth = new MCPAuth({
      protectedResources: [
        {
          metadata: {
            resource: mcpServerUrl,
            authorizationServers: [authServerConfig],
            scopesSupported: [],
          },
        },
      ],
    });

    // Serve /.well-known/oauth-protected-resource for MCP client discovery
    app.use(mcpAuth.protectedResourceMetadataRouter());

    // Debug: log incoming token claims before auth validation
    app.use('/mcp', (req: ExpressRequest, _res: ExpressResponse, next: () => void) => {
      const auth = req.headers.authorization;
      if (auth?.startsWith('Bearer ')) {
        const token = auth.slice(7);
        const parts = token.split('.');
        if (parts.length === 3) {
          try {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
            console.log('JWT claims:', JSON.stringify({ iss: payload.iss, aud: payload.aud, sub: payload.sub }));
          } catch {
            console.log('Token is not a JWT (opaque token)');
          }
        } else {
          console.log('Token is not a JWT (opaque token)');
        }
      }
      next();
    });

    // Protect /mcp with JWT validation
    app.use(
      '/mcp',
      mcpAuth.bearerAuth('jwt', { resource: mcpServerUrl, audience: auth0Audience, showErrorDetails: true })
    );

    console.log('Auth mode: OAuth 2.1 (Auth0)');
  } else if (authToken) {
    // Legacy bearer token mode
    app.use('/mcp', (req: ExpressRequest, res: ExpressResponse, next: () => void) => {
      if (req.headers.authorization !== `Bearer ${authToken}`) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      next();
    });

    console.log('Auth mode: Bearer token');
  }

  // POST /mcp — initialize new sessions or send messages to existing ones
  app.post('/mcp', async (req: ExpressRequest, res: ExpressResponse) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (sessionId && transports[sessionId]) {
      await transports[sessionId].handleRequest(req, res, req.body);
      return;
    }

    if (!sessionId && isInitializeRequest(req.body)) {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          transports[id] = transport;
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          delete transports[transport.sessionId];
        }
      };

      const server = createServer();
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    }

    res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Bad Request: No valid session or initialize request' },
      id: null,
    });
  });

  // GET /mcp — SSE stream for server-to-client notifications
  app.get('/mcp', async (req: ExpressRequest, res: ExpressResponse) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Bad Request: Invalid or missing session ID' },
        id: null,
      });
      return;
    }
    await transports[sessionId].handleRequest(req, res);
  });

  // DELETE /mcp — close a session
  app.delete('/mcp', async (req: ExpressRequest, res: ExpressResponse) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Bad Request: Invalid or missing session ID' },
        id: null,
      });
      return;
    }
    await transports[sessionId].handleRequest(req, res);
  });

  const port = parseInt(process.env.PORT || process.env.MCP_PORT || '3000', 10);
  const httpServer = app.listen(port, '0.0.0.0', () => {
    console.log(`MCP HTTP server listening on http://0.0.0.0:${port}/mcp`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received, shutting down MCP HTTP server...`);
    for (const transport of Object.values(transports)) {
      await transport.close();
    }
    httpServer.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('Failed to start MCP HTTP server:', err);
  process.exit(1);
});
