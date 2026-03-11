import { describe, it, expect, vi } from 'vitest';

// Mock both API clients before any imports
vi.mock('./services/woo-client.js', () => ({
  wooApi: {
    get: vi.fn().mockResolvedValue({
      data: [],
      headers: { 'x-wp-total': '0', 'x-wp-totalpages': '1' },
    }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock('./services/wp-client.js', () => ({
  wpApi: {
    get: vi.fn().mockResolvedValue({
      data: [],
      headers: { 'x-wp-total': '0', 'x-wp-totalpages': '1' },
    }),
    delete: vi.fn().mockResolvedValue({ data: {}, headers: {} }),
  },
}));

import { createServer, server } from './server.js';

describe('server.ts — createServer factory', () => {
  it('createServer returns an McpServer instance', () => {
    const s = createServer();
    expect(s).toBeDefined();
    expect(typeof s.connect).toBe('function');
  });

  it('createServer returns a new instance each call', () => {
    const s1 = createServer();
    const s2 = createServer();
    expect(s1).not.toBe(s2);
  });

  it('exported server singleton is a valid McpServer', () => {
    expect(server).toBeDefined();
    expect(typeof server.connect).toBe('function');
  });

  it('exported server is the same reference across imports', async () => {
    const { server: server2 } = await import('./server.js');
    expect(server).toBe(server2);
  });
});
