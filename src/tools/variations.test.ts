import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/woo-client.js', () => ({
  wooApi: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerVariationTools } from './variations.js';
import { wooApi } from '../services/woo-client.js';

const mockedWooApi = vi.mocked(wooApi);

describe('registerVariationTools', () => {
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

    registerVariationTools(server);
  });

  it('registers all 5 variation tools', () => {
    expect(registeredTools.has('list_variations')).toBe(true);
    expect(registeredTools.has('get_variation')).toBe(true);
    expect(registeredTools.has('create_variation')).toBe(true);
    expect(registeredTools.has('update_variation')).toBe(true);
    expect(registeredTools.has('batch_update_variations')).toBe(true);
    expect(registeredTools.size).toBe(5);
  });

  describe('list_variations handler', () => {
    it('calls wooApi.get with nested product endpoint', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [{ id: 100, sku: 'P39-1KG', price: '45' }],
        headers: { 'x-wp-total': '3', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_variations')!.handler;
      const result = await handler({ product_id: 39, per_page: 20, page: 1 });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'products/39/variations',
        expect.objectContaining({
          per_page: 20,
          page: 1,
          _fields: expect.any(String),
        })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.data).toBeDefined();
      expect(parsed.pagination.total).toBe(3);
    });

    it('uses custom fields when provided', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [{ id: 100 }],
        headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_variations')!.handler;
      await handler({ product_id: 39, per_page: 10, page: 1, fields: 'id,sku,price' });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'products/39/variations',
        expect.objectContaining({
          _fields: 'id,sku,price',
        })
      );
    });
  });

  describe('get_variation handler', () => {
    it('calls wooApi.get with product and variation ID', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: { id: 100, sku: 'P39-1KG', regular_price: '50', sale_price: '45' },
      });

      const handler = registeredTools.get('get_variation')!.handler;
      const result = await handler({ product_id: 39, id: 100 });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'products/39/variations/100',
        expect.objectContaining({
          _fields: expect.any(String),
        })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.id).toBe(100);
    });

    it('returns error on API failure', async () => {
      const error: any = new Error('Not found');
      error.response = { data: { code: 'not_found', message: 'Variation not found' }, status: 404 };
      mockedWooApi.get.mockRejectedValue(error);

      const handler = registeredTools.get('get_variation')!.handler;
      const result = await handler({ product_id: 39, id: 999 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Variation not found');
    });
  });

  describe('create_variation handler', () => {
    it('calls wooApi.post with variation data', async () => {
      mockedWooApi.post.mockResolvedValue({
        data: { id: 200, sku: 'P39-5KG' },
      });

      const handler = registeredTools.get('create_variation')!.handler;
      const result = await handler({
        product_id: 39,
        regular_price: '200',
        sale_price: '180',
        sku: 'P39-5KG',
        attributes: [{ id: 1, name: 'Weight', option: '5kg' }],
      });

      expect(mockedWooApi.post).toHaveBeenCalledWith(
        'products/39/variations',
        expect.objectContaining({
          regular_price: '200',
          sale_price: '180',
          sku: 'P39-5KG',
          attributes: [{ id: 1, name: 'Weight', option: '5kg' }],
        })
      );
      expect(result.isError).toBeUndefined();
    });
  });

  describe('update_variation handler', () => {
    it('calls wooApi.put with product ID, variation ID and data', async () => {
      mockedWooApi.put.mockResolvedValue({
        data: { id: 100, regular_price: '55' },
      });

      const handler = registeredTools.get('update_variation')!.handler;
      await handler({ product_id: 39, id: 100, regular_price: '55' });

      expect(mockedWooApi.put).toHaveBeenCalledWith(
        'products/39/variations/100',
        expect.objectContaining({
          regular_price: '55',
        })
      );
    });
  });

  describe('batch_update_variations handler', () => {
    it('calls wooApi.post to batch endpoint with create/update/delete', async () => {
      mockedWooApi.post.mockResolvedValue({
        data: {
          create: [{ id: 201, sku: 'P39-2KG' }],
          update: [{ id: 100, regular_price: '55' }],
          delete: [102],
        },
      });

      const handler = registeredTools.get('batch_update_variations')!.handler;
      const result = await handler({
        product_id: 39,
        create: [{ regular_price: '100', sku: 'P39-2KG', attributes: [{ id: 1, option: '2kg' }] }],
        update: [{ id: 100, regular_price: '55' }],
        delete: [102],
      });

      expect(mockedWooApi.post).toHaveBeenCalledWith('products/39/variations/batch', {
        create: [{ regular_price: '100', sku: 'P39-2KG', attributes: [{ id: 1, option: '2kg' }] }],
        update: [{ id: 100, regular_price: '55' }],
        delete: [102],
      });
      expect(result.isError).toBeUndefined();
    });

    it('handles delete-only batch', async () => {
      mockedWooApi.post.mockResolvedValue({
        data: { delete: [101, 102] },
      });

      const handler = registeredTools.get('batch_update_variations')!.handler;
      await handler({ product_id: 39, delete: [101, 102] });

      expect(mockedWooApi.post).toHaveBeenCalledWith('products/39/variations/batch', {
        create: undefined,
        update: undefined,
        delete: [101, 102],
      });
    });
  });
});
