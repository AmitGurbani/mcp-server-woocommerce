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
import { registerTagTools } from './tags.js';
import { wooApi } from '../services/woo-client.js';

const mockedWooApi = vi.mocked(wooApi);

describe('registerTagTools', () => {
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

    registerTagTools(server);
  });

  it('registers all 5 tag tools', () => {
    expect(registeredTools.has('list_tags')).toBe(true);
    expect(registeredTools.has('get_tag')).toBe(true);
    expect(registeredTools.has('create_tag')).toBe(true);
    expect(registeredTools.has('update_tag')).toBe(true);
    expect(registeredTools.has('delete_tag')).toBe(true);
    expect(registeredTools.size).toBe(5);
  });

  describe('list_tags handler', () => {
    it('calls wooApi.get with correct params', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [{ id: 1, name: 'Bestseller' }],
        headers: { 'x-wp-total': '6', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_tags')!.handler;
      const result = await handler({ per_page: 20, page: 1 });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'products/tags',
        expect.objectContaining({
          per_page: 20,
          page: 1,
          _fields: expect.any(String),
        })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.data).toBeDefined();
      expect(parsed.pagination.total).toBe(6);
    });

    it('passes search filter to API', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [],
        headers: { 'x-wp-total': '0', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_tags')!.handler;
      await handler({ per_page: 20, page: 1, search: 'organic' });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'products/tags',
        expect.objectContaining({
          search: 'organic',
        })
      );
    });
  });

  describe('get_tag handler', () => {
    it('calls wooApi.get with tag ID', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: { id: 169, name: 'Bestseller' },
      });

      const handler = registeredTools.get('get_tag')!.handler;
      const result = await handler({ id: 169 });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'products/tags/169',
        expect.objectContaining({
          _fields: expect.any(String),
        })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.id).toBe(169);
    });

    it('returns error on API failure', async () => {
      const error: any = new Error('Not found');
      error.response = { data: { code: 'not_found', message: 'Tag not found' }, status: 404 };
      mockedWooApi.get.mockRejectedValue(error);

      const handler = registeredTools.get('get_tag')!.handler;
      const result = await handler({ id: 999 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Tag not found');
    });
  });

  describe('create_tag handler', () => {
    it('calls wooApi.post with tag data', async () => {
      mockedWooApi.post.mockResolvedValue({
        data: { id: 175, name: 'Premium' },
      });

      const handler = registeredTools.get('create_tag')!.handler;
      const result = await handler({ name: 'Premium' });

      expect(mockedWooApi.post).toHaveBeenCalledWith(
        'products/tags',
        expect.objectContaining({
          name: 'Premium',
        })
      );
      expect(result.isError).toBeUndefined();
    });
  });

  describe('update_tag handler', () => {
    it('calls wooApi.put with tag ID and data', async () => {
      mockedWooApi.put.mockResolvedValue({
        data: { id: 169, name: 'Best Seller' },
      });

      const handler = registeredTools.get('update_tag')!.handler;
      await handler({ id: 169, name: 'Best Seller' });

      expect(mockedWooApi.put).toHaveBeenCalledWith(
        'products/tags/169',
        expect.objectContaining({
          name: 'Best Seller',
        })
      );
    });
  });

  describe('delete_tag handler', () => {
    it('calls wooApi.delete with tag ID', async () => {
      mockedWooApi.delete.mockResolvedValue({
        data: { id: 169 },
      });

      const handler = registeredTools.get('delete_tag')!.handler;
      await handler({ id: 169, force: false });

      expect(mockedWooApi.delete).toHaveBeenCalledWith('products/tags/169', { force: false });
    });

    it('passes force=true for permanent deletion', async () => {
      mockedWooApi.delete.mockResolvedValue({
        data: { id: 169 },
      });

      const handler = registeredTools.get('delete_tag')!.handler;
      await handler({ id: 169, force: true });

      expect(mockedWooApi.delete).toHaveBeenCalledWith('products/tags/169', { force: true });
    });
  });
});
