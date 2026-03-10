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
import { registerCategoryTools } from './categories.js';
import { wooApi } from '../services/woo-client.js';

const mockedWooApi = vi.mocked(wooApi);

describe('registerCategoryTools', () => {
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

    registerCategoryTools(server);
  });

  it('registers all 5 category tools', () => {
    expect(registeredTools.has('list_categories')).toBe(true);
    expect(registeredTools.has('get_category')).toBe(true);
    expect(registeredTools.has('create_category')).toBe(true);
    expect(registeredTools.has('update_category')).toBe(true);
    expect(registeredTools.has('delete_category')).toBe(true);
    expect(registeredTools.size).toBe(5);
  });

  describe('list_categories handler', () => {
    it('calls wooApi.get with correct params', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [{ id: 1, name: 'Groceries' }],
        headers: { 'x-wp-total': '5', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_categories')!.handler;
      const result = await handler({ per_page: 20, page: 1 });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'products/categories',
        expect.objectContaining({
          per_page: 20,
          page: 1,
          _fields: expect.any(String),
        })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.data).toBeDefined();
      expect(parsed.pagination).toBeDefined();
      expect(parsed.pagination.total).toBe(5);
    });

    it('uses custom fields when provided', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [{ id: 1 }],
        headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_categories')!.handler;
      await handler({ per_page: 10, page: 1, fields: 'id,name' });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'products/categories',
        expect.objectContaining({
          _fields: 'id,name',
        })
      );
    });

    it('passes parent filter to API', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [],
        headers: { 'x-wp-total': '0', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_categories')!.handler;
      await handler({ per_page: 20, page: 1, parent: 15 });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'products/categories',
        expect.objectContaining({
          parent: 15,
        })
      );
    });
  });

  describe('get_category handler', () => {
    it('calls wooApi.get with category ID', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: { id: 10, name: 'Beverages' },
      });

      const handler = registeredTools.get('get_category')!.handler;
      const result = await handler({ id: 10 });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'products/categories/10',
        expect.objectContaining({
          _fields: expect.any(String),
        })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.id).toBe(10);
    });

    it('returns error on API failure', async () => {
      const error: any = new Error('Not found');
      error.response = { data: { code: 'not_found', message: 'Category not found' }, status: 404 };
      mockedWooApi.get.mockRejectedValue(error);

      const handler = registeredTools.get('get_category')!.handler;
      const result = await handler({ id: 999 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Category not found');
    });
  });

  describe('create_category handler', () => {
    it('calls wooApi.post with category data', async () => {
      mockedWooApi.post.mockResolvedValue({
        data: { id: 20, name: 'Snacks' },
      });

      const handler = registeredTools.get('create_category')!.handler;
      const result = await handler({ name: 'Snacks', parent: 0 });

      expect(mockedWooApi.post).toHaveBeenCalledWith(
        'products/categories',
        expect.objectContaining({
          name: 'Snacks',
          parent: 0,
        })
      );
      expect(result.isError).toBeUndefined();
    });
  });

  describe('update_category handler', () => {
    it('calls wooApi.put with category ID and data', async () => {
      mockedWooApi.put.mockResolvedValue({
        data: { id: 10, name: 'Updated Category' },
      });

      const handler = registeredTools.get('update_category')!.handler;
      await handler({ id: 10, name: 'Updated Category' });

      expect(mockedWooApi.put).toHaveBeenCalledWith(
        'products/categories/10',
        expect.objectContaining({
          name: 'Updated Category',
        })
      );
    });
  });

  describe('delete_category handler', () => {
    it('calls wooApi.delete with category ID', async () => {
      mockedWooApi.delete.mockResolvedValue({
        data: { id: 10 },
      });

      const handler = registeredTools.get('delete_category')!.handler;
      await handler({ id: 10, force: false });

      expect(mockedWooApi.delete).toHaveBeenCalledWith('products/categories/10', { force: false });
    });

    it('passes force=true for permanent deletion', async () => {
      mockedWooApi.delete.mockResolvedValue({
        data: { id: 10 },
      });

      const handler = registeredTools.get('delete_category')!.handler;
      await handler({ id: 10, force: true });

      expect(mockedWooApi.delete).toHaveBeenCalledWith('products/categories/10', { force: true });
    });
  });
});
