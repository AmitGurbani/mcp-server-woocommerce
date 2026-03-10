import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock woo-client before importing products
vi.mock('../services/woo-client.js', () => ({
  wooApi: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerProductTools } from './products.js';
import { wooApi } from '../services/woo-client.js';

const mockedWooApi = vi.mocked(wooApi);

describe('registerProductTools', () => {
  let server: McpServer;
  let registeredTools: Map<string, { schema: Record<string, any>; handler: Function }>;

  beforeEach(() => {
    vi.clearAllMocks();
    server = new McpServer({ name: 'test', version: '1.0.0' });
    registeredTools = new Map();

    vi.spyOn(server, 'registerTool').mockImplementation(((...args: any[]) => {
      const [name, config, handler] = args;
      registeredTools.set(name, { schema: config.inputSchema, handler });
    }) as any);

    registerProductTools(server);
  });

  it('registers all 5 product tools', () => {
    expect(registeredTools.has('list_products')).toBe(true);
    expect(registeredTools.has('get_product')).toBe(true);
    expect(registeredTools.has('create_product')).toBe(true);
    expect(registeredTools.has('update_product')).toBe(true);
    expect(registeredTools.has('delete_product')).toBe(true);
    expect(registeredTools.size).toBe(5);
  });

  describe('list_products handler', () => {
    it('calls wooApi.get with correct params', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [{ id: 1, name: 'Product A' }],
        headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_products')!.handler;
      const result = await handler({ per_page: 20, page: 1 });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'products',
        expect.objectContaining({
          per_page: 20,
          page: 1,
          _fields: expect.any(String),
        })
      );
      expect(result.content[0].type).toBe('text');
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.data).toBeDefined();
      expect(parsed.pagination).toBeDefined();
    });

    it('uses custom fields when provided', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [{ id: 1 }],
        headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_products')!.handler;
      await handler({ per_page: 10, page: 1, fields: 'id,name' });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'products',
        expect.objectContaining({
          _fields: 'id,name',
        })
      );
    });

    it('passes search filter to API', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [],
        headers: { 'x-wp-total': '0', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_products')!.handler;
      await handler({ per_page: 20, page: 1, search: 'rice' });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'products',
        expect.objectContaining({
          search: 'rice',
        })
      );
    });
  });

  describe('get_product handler', () => {
    it('calls wooApi.get with product ID', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: { id: 42, name: 'Test Product' },
      });

      const handler = registeredTools.get('get_product')!.handler;
      const result = await handler({ id: 42 });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'products/42',
        expect.objectContaining({
          _fields: expect.any(String),
        })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.id).toBe(42);
    });

    it('returns error on API failure', async () => {
      const error: any = new Error('Not found');
      error.response = { data: { code: 'not_found', message: 'Product not found' }, status: 404 };
      mockedWooApi.get.mockRejectedValue(error);

      const handler = registeredTools.get('get_product')!.handler;
      const result = await handler({ id: 999 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Product not found');
    });
  });

  describe('create_product handler', () => {
    it('calls wooApi.post with product data', async () => {
      mockedWooApi.post.mockResolvedValue({
        data: { id: 100, name: 'New Product' },
      });

      const handler = registeredTools.get('create_product')!.handler;
      const result = await handler({
        name: 'New Product',
        type: 'simple',
        regular_price: '99.99',
        status: 'draft',
      });

      expect(mockedWooApi.post).toHaveBeenCalledWith(
        'products',
        expect.objectContaining({
          name: 'New Product',
          type: 'simple',
          regular_price: '99.99',
          status: 'draft',
        })
      );
      expect(result.isError).toBeUndefined();
    });
  });

  describe('update_product handler', () => {
    it('calls wooApi.put with product ID and data', async () => {
      mockedWooApi.put.mockResolvedValue({
        data: { id: 42, name: 'Updated' },
      });

      const handler = registeredTools.get('update_product')!.handler;
      await handler({ id: 42, name: 'Updated', regular_price: '50' });

      expect(mockedWooApi.put).toHaveBeenCalledWith(
        'products/42',
        expect.objectContaining({
          name: 'Updated',
          regular_price: '50',
        })
      );
    });
  });

  describe('delete_product handler', () => {
    it('calls wooApi.delete with product ID', async () => {
      mockedWooApi.delete.mockResolvedValue({
        data: { id: 42 },
      });

      const handler = registeredTools.get('delete_product')!.handler;
      await handler({ id: 42, force: false });

      expect(mockedWooApi.delete).toHaveBeenCalledWith('products/42', { force: false });
    });

    it('passes force=true for permanent deletion', async () => {
      mockedWooApi.delete.mockResolvedValue({
        data: { id: 42 },
      });

      const handler = registeredTools.get('delete_product')!.handler;
      await handler({ id: 42, force: true });

      expect(mockedWooApi.delete).toHaveBeenCalledWith('products/42', { force: true });
    });
  });
});
