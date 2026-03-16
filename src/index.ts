#!/usr/bin/env node
import 'dotenv/config';

async function main() {
  if (process.env.MCP_TRANSPORT === 'http') {
    await import('./http.js');
  } else {
    const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');
    const { server } = await import('./server.js');
    const transport = new StdioServerTransport();
    await server.connect(transport);
  }
}

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
