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
import { registerAttributeTools } from './attributes.js';
import { wooApi } from '../services/woo-client.js';

const mockedWooApi = vi.mocked(wooApi);

describe('registerAttributeTools', () => {
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

    registerAttributeTools(server);
  });

  it('registers all 8 attribute tools', () => {
    expect(registeredTools.has('list_attributes')).toBe(true);
    expect(registeredTools.has('get_attribute')).toBe(true);
    expect(registeredTools.has('create_attribute')).toBe(true);
    expect(registeredTools.has('delete_attribute')).toBe(true);
    expect(registeredTools.has('list_attribute_terms')).toBe(true);
    expect(registeredTools.has('create_attribute_term')).toBe(true);
    expect(registeredTools.has('delete_attribute_term')).toBe(true);
    expect(registeredTools.has('batch_update_attribute_terms')).toBe(true);
    expect(registeredTools.size).toBe(8);
  });

  // --- Attribute tools ---

  describe('list_attributes handler', () => {
    it('calls wooApi.get with correct params', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [{ id: 1, name: 'Weight' }],
        headers: { 'x-wp-total': '4', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_attributes')!.handler;
      const result = await handler({ per_page: 20, page: 1 });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'products/attributes',
        expect.objectContaining({
          per_page: 20,
          page: 1,
          _fields: expect.any(String),
        })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.data).toBeDefined();
      expect(parsed.pagination.total).toBe(4);
    });
  });

  describe('get_attribute handler', () => {
    it('calls wooApi.get with attribute ID', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: { id: 1, name: 'Weight', slug: 'pa_weight' },
      });

      const handler = registeredTools.get('get_attribute')!.handler;
      const result = await handler({ id: 1 });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'products/attributes/1',
        expect.objectContaining({
          _fields: expect.any(String),
        })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.id).toBe(1);
    });

    it('returns error on API failure', async () => {
      const error: any = new Error('Not found');
      error.response = { data: { code: 'not_found', message: 'Attribute not found' }, status: 404 };
      mockedWooApi.get.mockRejectedValue(error);

      const handler = registeredTools.get('get_attribute')!.handler;
      const result = await handler({ id: 999 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Attribute not found');
    });
  });

  describe('create_attribute handler', () => {
    it('calls wooApi.post with attribute data', async () => {
      mockedWooApi.post.mockResolvedValue({
        data: { id: 5, name: 'Color' },
      });

      const handler = registeredTools.get('create_attribute')!.handler;
      const result = await handler({ name: 'Color', type: 'select', order_by: 'menu_order' });

      expect(mockedWooApi.post).toHaveBeenCalledWith(
        'products/attributes',
        expect.objectContaining({
          name: 'Color',
          type: 'select',
          order_by: 'menu_order',
        })
      );
      expect(result.isError).toBeUndefined();
    });
  });

  describe('delete_attribute handler', () => {
    it('calls wooApi.delete with attribute ID', async () => {
      mockedWooApi.delete.mockResolvedValue({
        data: { id: 5 },
      });

      const handler = registeredTools.get('delete_attribute')!.handler;
      await handler({ id: 5, force: true });

      expect(mockedWooApi.delete).toHaveBeenCalledWith('products/attributes/5', { force: true });
    });
  });

  // --- Attribute Term tools ---

  describe('list_attribute_terms handler', () => {
    it('calls wooApi.get with nested endpoint', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [
          { id: 10, name: '500g' },
          { id: 11, name: '1kg' },
        ],
        headers: { 'x-wp-total': '5', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_attribute_terms')!.handler;
      const result = await handler({ attribute_id: 1, per_page: 20, page: 1 });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'products/attributes/1/terms',
        expect.objectContaining({
          per_page: 20,
          page: 1,
          _fields: expect.any(String),
        })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.data).toHaveLength(2);
      expect(parsed.pagination.total).toBe(5);
    });
  });

  describe('create_attribute_term handler', () => {
    it('calls wooApi.post with nested endpoint', async () => {
      mockedWooApi.post.mockResolvedValue({
        data: { id: 20, name: '5kg' },
      });

      const handler = registeredTools.get('create_attribute_term')!.handler;
      const result = await handler({ attribute_id: 1, name: '5kg' });

      expect(mockedWooApi.post).toHaveBeenCalledWith(
        'products/attributes/1/terms',
        expect.objectContaining({
          name: '5kg',
        })
      );
      expect(result.isError).toBeUndefined();
    });
  });

  describe('delete_attribute_term handler', () => {
    it('calls wooApi.delete with nested endpoint', async () => {
      mockedWooApi.delete.mockResolvedValue({
        data: { id: 20 },
      });

      const handler = registeredTools.get('delete_attribute_term')!.handler;
      await handler({ attribute_id: 1, id: 20, force: true });

      expect(mockedWooApi.delete).toHaveBeenCalledWith('products/attributes/1/terms/20', {
        force: true,
      });
    });
  });

  describe('batch_update_attribute_terms handler', () => {
    it('calls wooApi.post to batch endpoint with create/update/delete', async () => {
      mockedWooApi.post.mockResolvedValue({
        data: {
          create: [{ id: 30, name: '10kg' }],
          update: [{ id: 10, name: '500g updated' }],
          delete: [11],
        },
      });

      const handler = registeredTools.get('batch_update_attribute_terms')!.handler;
      const result = await handler({
        attribute_id: 1,
        create: [{ name: '10kg' }],
        update: [{ id: 10, name: '500g updated' }],
        delete: [11],
      });

      expect(mockedWooApi.post).toHaveBeenCalledWith('products/attributes/1/terms/batch', {
        create: [{ name: '10kg' }],
        update: [{ id: 10, name: '500g updated' }],
        delete: [11],
      });
      expect(result.isError).toBeUndefined();
    });

    it('handles create-only batch', async () => {
      mockedWooApi.post.mockResolvedValue({
        data: { create: [{ id: 31, name: '250g' }] },
      });

      const handler = registeredTools.get('batch_update_attribute_terms')!.handler;
      await handler({
        attribute_id: 1,
        create: [{ name: '250g' }],
      });

      expect(mockedWooApi.post).toHaveBeenCalledWith('products/attributes/1/terms/batch', {
        create: [{ name: '250g' }],
        update: undefined,
        delete: undefined,
      });
    });
  });
});
