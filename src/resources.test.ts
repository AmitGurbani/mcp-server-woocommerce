import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerResources } from './resources.js';

describe('registerResources', () => {
  let server: McpServer;
  let registeredResources: Map<string, { uri: string; handler: Function }>;

  beforeEach(() => {
    vi.clearAllMocks();
    server = new McpServer({ name: 'test', version: '1.0.0' });
    registeredResources = new Map();

    vi.spyOn(server, 'registerResource').mockImplementation(((...args: any[]) => {
      const [_name, uri, _metadata, handler] = args;
      registeredResources.set(uri, { uri, handler });
    }) as any);

    registerResources(server);
  });

  it('registers 5 resources', () => {
    expect(server.registerResource).toHaveBeenCalledTimes(5);
    expect(registeredResources.size).toBe(5);
  });

  it('registers all expected resource URIs', () => {
    expect(registeredResources.has('woo://schema/product')).toBe(true);
    expect(registeredResources.has('woo://schema/order')).toBe(true);
    expect(registeredResources.has('woo://schema/coupon')).toBe(true);
    expect(registeredResources.has('woo://reference/product-types')).toBe(true);
    expect(registeredResources.has('woo://reference/order-statuses')).toBe(true);
  });

  it('each resource handler returns contents with correct URI', async () => {
    for (const [uri, { handler }] of registeredResources) {
      const result = await handler();
      expect(result.contents).toBeDefined();
      expect(result.contents[0].uri).toBe(uri);
      expect(result.contents[0].mimeType).toBe('text/plain');
      expect(result.contents[0].text).toBeTruthy();
    }
  });

  it('order schema has currency instead of subtotal in Core fields', async () => {
    const handler = registeredResources.get('woo://schema/order')!.handler;
    const result = await handler();
    const text = result.contents[0].text;
    expect(text).toContain('currency');
    expect(text).not.toMatch(/^Core:.*subtotal/m);
  });

  it('order schema does not duplicate total_tax', async () => {
    const handler = registeredResources.get('woo://schema/order')!.handler;
    const result = await handler();
    const text: string = result.contents[0].text;
    const matches = text.match(/total_tax/g);
    expect(matches).toHaveLength(1);
  });
});
