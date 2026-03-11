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
import { registerReviewTools } from './reviews.js';
import { wooApi } from '../services/woo-client.js';

const mockedWooApi = vi.mocked(wooApi);

describe('registerReviewTools', () => {
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

    registerReviewTools(server);
  });

  it('registers all 4 review tools', () => {
    expect(registeredTools.has('list_product_reviews')).toBe(true);
    expect(registeredTools.has('get_product_review')).toBe(true);
    expect(registeredTools.has('update_product_review')).toBe(true);
    expect(registeredTools.has('delete_product_review')).toBe(true);
    expect(registeredTools.size).toBe(4);
  });

  describe('list_product_reviews handler', () => {
    it('calls wooApi.get with correct params', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [
          { id: 1, reviewer: 'John', rating: 5, review: 'Great product!', status: 'approved' },
        ],
        headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_product_reviews')!.handler;
      const result = await handler({ per_page: 20, page: 1 });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'products/reviews',
        expect.objectContaining({ per_page: 20, page: 1 })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.data[0].reviewer).toBe('John');
      expect(parsed.pagination.total).toBe(1);
    });

    it('passes product and status filters to API', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [],
        headers: { 'x-wp-total': '0', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_product_reviews')!.handler;
      await handler({ per_page: 20, page: 1, product: [42, 43], status: 'hold' });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'products/reviews',
        expect.objectContaining({ product: [42, 43], status: 'hold' })
      );
    });

    it('passes search filter to API', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [],
        headers: { 'x-wp-total': '0', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_product_reviews')!.handler;
      await handler({ per_page: 20, page: 1, search: 'excellent' });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'products/reviews',
        expect.objectContaining({ search: 'excellent' })
      );
    });
  });

  describe('get_product_review handler', () => {
    it('calls wooApi.get with review ID', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: {
          id: 1,
          reviewer: 'John',
          rating: 5,
          review: 'Great product!',
          reviewer_email: 'john@example.com',
          verified: true,
        },
      });

      const handler = registeredTools.get('get_product_review')!.handler;
      const result = await handler({ id: 1 });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'products/reviews/1',
        expect.objectContaining({ _fields: expect.any(String) })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.id).toBe(1);
      expect(parsed.verified).toBe(true);
    });
  });

  describe('update_product_review handler', () => {
    it('calls wooApi.put with review ID and data', async () => {
      mockedWooApi.put.mockResolvedValue({
        data: { id: 1, status: 'approved', rating: 4 },
      });

      const handler = registeredTools.get('update_product_review')!.handler;
      const result = await handler({ id: 1, status: 'approved', rating: 4 });

      expect(mockedWooApi.put).toHaveBeenCalledWith(
        'products/reviews/1',
        expect.objectContaining({ status: 'approved', rating: 4 })
      );
      expect(result.isError).toBeUndefined();
    });
  });

  describe('delete_product_review handler', () => {
    it('calls wooApi.delete with review ID (default force=false)', async () => {
      mockedWooApi.delete.mockResolvedValue({
        data: { id: 1, status: 'trash' },
      });

      const handler = registeredTools.get('delete_product_review')!.handler;
      const result = await handler({ id: 1, force: false });

      expect(mockedWooApi.delete).toHaveBeenCalledWith('products/reviews/1', { force: false });
      expect(result.isError).toBeUndefined();
    });

    it('supports force=true for permanent deletion', async () => {
      mockedWooApi.delete.mockResolvedValue({
        data: { id: 1, deleted: true },
      });

      const handler = registeredTools.get('delete_product_review')!.handler;
      await handler({ id: 1, force: true });

      expect(mockedWooApi.delete).toHaveBeenCalledWith('products/reviews/1', { force: true });
    });
  });

  describe('error handling', () => {
    it('returns error on API failure', async () => {
      const error: any = new Error('Not found');
      error.response = {
        data: { code: 'woocommerce_rest_invalid_id', message: 'Invalid review ID' },
        status: 404,
      };
      mockedWooApi.get.mockRejectedValue(error);

      const handler = registeredTools.get('get_product_review')!.handler;
      const result = await handler({ id: 999 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid review ID');
    });
  });
});
