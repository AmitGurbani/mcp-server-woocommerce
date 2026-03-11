import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createServer } from './server.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';

// Minimal Express-compatible types (express is a transitive dep via SDK, no @types available)
interface ExpressRequest extends IncomingMessage {
  body?: unknown;
}
interface ExpressResponse extends ServerResponse {
  status(code: number): ExpressResponse;
  json(body: unknown): void;
}

const authToken = process.env.MCP_AUTH_TOKEN;
if (!authToken) {
  console.error('MCP_AUTH_TOKEN is required for HTTP transport');
  process.exit(1);
}

const app = createMcpExpressApp({ host: '0.0.0.0' });

const transports: Record<string, StreamableHTTPServerTransport> = {};

// Bearer token auth
app.use('/mcp', (req: ExpressRequest, res: ExpressResponse, next: () => void) => {
  if (req.headers.authorization !== `Bearer ${authToken}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
});

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

const port = parseInt(process.env.MCP_PORT || '3000', 10);
const httpServer = app.listen(port, '0.0.0.0', () => {
  console.log(`MCP HTTP server listening on http://0.0.0.0:${port}/mcp`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down MCP HTTP server...');
  for (const transport of Object.values(transports)) {
    await transport.close();
  }
  httpServer.close(() => {
    process.exit(0);
  });
});
