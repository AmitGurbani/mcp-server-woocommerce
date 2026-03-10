import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/woo-client.js', () => ({
  wooApi: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../services/wp-client.js', () => ({
  wpApi: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerMediaTools } from './media.js';
import { wooApi } from '../services/woo-client.js';
import { wpApi } from '../services/wp-client.js';

const mockedWooApi = vi.mocked(wooApi);
const mockedWpApi = vi.mocked(wpApi);

describe('registerMediaTools', () => {
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

    registerMediaTools(server);
  });

  it('registers all 3 media tools', () => {
    expect(registeredTools.has('list_media')).toBe(true);
    expect(registeredTools.has('delete_media')).toBe(true);
    expect(registeredTools.has('cleanup_orphaned_media')).toBe(true);
    expect(registeredTools.size).toBe(3);
  });

  describe('list_media handler', () => {
    it('calls wpApi.get with correct params', async () => {
      mockedWpApi.get.mockResolvedValue({
        data: [
          { id: 1, title: { rendered: 'photo.jpg' }, source_url: 'https://example.com/photo.jpg' },
        ],
        headers: { 'x-wp-total': '10', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_media')!.handler;
      const result = await handler({ per_page: 20, page: 1 });

      expect(mockedWpApi.get).toHaveBeenCalledWith(
        'media',
        expect.objectContaining({
          per_page: 20,
          page: 1,
          _fields: expect.any(String),
        })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.data).toBeDefined();
      expect(parsed.pagination.total).toBe(10);
    });

    it('passes mime_type filter to API', async () => {
      mockedWpApi.get.mockResolvedValue({
        data: [],
        headers: { 'x-wp-total': '0', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_media')!.handler;
      await handler({ per_page: 20, page: 1, mime_type: 'image/jpeg' });

      expect(mockedWpApi.get).toHaveBeenCalledWith(
        'media',
        expect.objectContaining({
          mime_type: 'image/jpeg',
        })
      );
    });
  });

  describe('delete_media handler', () => {
    it('calls wpApi.delete with media ID and force=true', async () => {
      mockedWpApi.delete.mockResolvedValue({
        data: { id: 50, deleted: true },
        headers: {},
      });

      const handler = registeredTools.get('delete_media')!.handler;
      const result = await handler({ id: 50 });

      expect(mockedWpApi.delete).toHaveBeenCalledWith('media/50', { force: true });
      expect(result.isError).toBeUndefined();
    });

    it('returns error on API failure', async () => {
      const error: any = new Error('Not found');
      error.response = { data: { code: 'not_found', message: 'Media not found' }, status: 404 };
      mockedWpApi.delete.mockRejectedValue(error);

      const handler = registeredTools.get('delete_media')!.handler;
      const result = await handler({ id: 999 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Media not found');
    });
  });

  describe('cleanup_orphaned_media handler', () => {
    const setupOrphanMocks = () => {
      // Products page 1 (single page) - product uses image 1 and 2
      mockedWooApi.get.mockImplementation(async (endpoint: string, _params?: any) => {
        if (endpoint === 'products') {
          return {
            data: [{ images: [{ id: 1 }, { id: 2 }] }, { images: [{ id: 1 }] }],
            headers: { 'x-wp-totalpages': '1' },
          };
        }
        if (endpoint === 'products/categories') {
          return {
            data: [{ image: { id: 3 } }],
            headers: { 'x-wp-totalpages': '1' },
          };
        }
        return { data: [], headers: { 'x-wp-totalpages': '1' } };
      });

      // Media items: 1, 2, 3 are in use; 4 and 5 are orphans
      mockedWpApi.get.mockResolvedValue({
        data: [
          { id: 1, title: { rendered: 'img1' }, source_url: 'https://example.com/1.jpg' },
          { id: 2, title: { rendered: 'img2' }, source_url: 'https://example.com/2.jpg' },
          { id: 3, title: { rendered: 'img3' }, source_url: 'https://example.com/3.jpg' },
          { id: 4, title: { rendered: 'orphan1' }, source_url: 'https://example.com/4.jpg' },
          { id: 5, title: { rendered: 'orphan2' }, source_url: 'https://example.com/5.jpg' },
        ],
        headers: { 'x-wp-totalpages': '1' },
      });
    };

    it('dry run: finds orphaned media without deleting', async () => {
      setupOrphanMocks();

      const handler = registeredTools.get('cleanup_orphaned_media')!.handler;
      const result = await handler({ delete: false });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.total_media).toBe(5);
      expect(parsed.in_use).toBe(3);
      expect(parsed.orphaned_count).toBe(2);
      expect(parsed.orphaned_items).toHaveLength(2);
      expect(parsed.orphaned_items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 4 }),
          expect.objectContaining({ id: 5 }),
        ])
      );
      expect(parsed.hint).toContain('delete=true');
      expect(parsed.deleted).toBeUndefined();
    });

    it('delete mode: deletes orphaned media', async () => {
      setupOrphanMocks();
      mockedWpApi.delete.mockResolvedValue({ data: { deleted: true }, headers: {} });

      const handler = registeredTools.get('cleanup_orphaned_media')!.handler;
      const result = await handler({ delete: true });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.orphaned_count).toBe(2);
      expect(parsed.deleted).toBe(2);
      expect(mockedWpApi.delete).toHaveBeenCalledTimes(2);
      expect(mockedWpApi.delete).toHaveBeenCalledWith('media/4', { force: true });
      expect(mockedWpApi.delete).toHaveBeenCalledWith('media/5', { force: true });
    });

    it('delete mode: reports errors for failed deletions', async () => {
      setupOrphanMocks();
      mockedWpApi.delete
        .mockResolvedValueOnce({ data: { deleted: true }, headers: {} })
        .mockRejectedValueOnce(new Error('Permission denied'));

      const handler = registeredTools.get('cleanup_orphaned_media')!.handler;
      const result = await handler({ delete: true });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.deleted).toBe(1);
      expect(parsed.errors).toHaveLength(1);
      expect(parsed.errors[0]).toContain('Permission denied');
    });
  });
});
