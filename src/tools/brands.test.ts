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
import { registerBrandTools } from './brands.js';
import { wooApi } from '../services/woo-client.js';

const mockedWooApi = vi.mocked(wooApi);

describe('registerBrandTools', () => {
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

    registerBrandTools(server);
  });

  it('registers all 5 brand tools', () => {
    expect(registeredTools.has('list_brands')).toBe(true);
    expect(registeredTools.has('get_brand')).toBe(true);
    expect(registeredTools.has('create_brand')).toBe(true);
    expect(registeredTools.has('update_brand')).toBe(true);
    expect(registeredTools.has('delete_brand')).toBe(true);
    expect(registeredTools.size).toBe(5);
  });

  describe('list_brands handler', () => {
    it('calls wooApi.get with correct params', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [{ id: 1, name: 'Amul' }],
        headers: { 'x-wp-total': '295', 'x-wp-totalpages': '15' },
      });

      const handler = registeredTools.get('list_brands')!.handler;
      const result = await handler({ per_page: 20, page: 1 });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'products/brands',
        expect.objectContaining({
          per_page: 20,
          page: 1,
          _fields: expect.any(String),
        })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.data).toBeDefined();
      expect(parsed.pagination.total).toBe(295);
    });

    it('passes search filter to API', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [],
        headers: { 'x-wp-total': '0', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_brands')!.handler;
      await handler({ per_page: 20, page: 1, search: 'amul' });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'products/brands',
        expect.objectContaining({
          search: 'amul',
        })
      );
    });
  });

  describe('get_brand handler', () => {
    it('calls wooApi.get with brand ID', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: { id: 175, name: 'Amul' },
      });

      const handler = registeredTools.get('get_brand')!.handler;
      const result = await handler({ id: 175 });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'products/brands/175',
        expect.objectContaining({
          _fields: expect.any(String),
        })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.id).toBe(175);
    });

    it('returns error on API failure', async () => {
      const error: any = new Error('Not found');
      error.response = { data: { code: 'not_found', message: 'Brand not found' }, status: 404 };
      mockedWooApi.get.mockRejectedValue(error);

      const handler = registeredTools.get('get_brand')!.handler;
      const result = await handler({ id: 999 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Brand not found');
    });
  });

  describe('create_brand handler', () => {
    it('calls wooApi.post with brand data', async () => {
      mockedWooApi.post.mockResolvedValue({
        data: { id: 500, name: 'NewBrand' },
      });

      const handler = registeredTools.get('create_brand')!.handler;
      const result = await handler({ name: 'NewBrand' });

      expect(mockedWooApi.post).toHaveBeenCalledWith(
        'products/brands',
        expect.objectContaining({
          name: 'NewBrand',
        })
      );
      expect(result.isError).toBeUndefined();
    });
  });

  describe('update_brand handler', () => {
    it('calls wooApi.put with brand ID and data', async () => {
      mockedWooApi.put.mockResolvedValue({
        data: { id: 175, name: 'Amul Updated' },
      });

      const handler = registeredTools.get('update_brand')!.handler;
      await handler({ id: 175, name: 'Amul Updated' });

      expect(mockedWooApi.put).toHaveBeenCalledWith(
        'products/brands/175',
        expect.objectContaining({
          name: 'Amul Updated',
        })
      );
    });
  });

  describe('delete_brand handler', () => {
    it('calls wooApi.delete with brand ID', async () => {
      mockedWooApi.delete.mockResolvedValue({
        data: { id: 175 },
      });

      const handler = registeredTools.get('delete_brand')!.handler;
      await handler({ id: 175, force: false });

      expect(mockedWooApi.delete).toHaveBeenCalledWith('products/brands/175', { force: false });
    });

    it('passes force=true for permanent deletion', async () => {
      mockedWooApi.delete.mockResolvedValue({
        data: { id: 175 },
      });

      const handler = registeredTools.get('delete_brand')!.handler;
      await handler({ id: 175, force: true });

      expect(mockedWooApi.delete).toHaveBeenCalledWith('products/brands/175', { force: true });
    });
  });
});
