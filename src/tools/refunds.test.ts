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
import { registerRefundTools } from './refunds.js';
import { wooApi } from '../services/woo-client.js';

const mockedWooApi = vi.mocked(wooApi);

describe('registerRefundTools', () => {
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

    registerRefundTools(server);
  });

  it('registers all 3 refund tools', () => {
    expect(registeredTools.has('list_order_refunds')).toBe(true);
    expect(registeredTools.has('create_order_refund')).toBe(true);
    expect(registeredTools.has('delete_order_refund')).toBe(true);
    expect(registeredTools.size).toBe(3);
  });

  describe('list_order_refunds handler', () => {
    it('calls wooApi.get with order refunds endpoint', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [{ id: 10, amount: '25.00', reason: 'Damaged item' }],
        headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_order_refunds')!.handler;
      const result = await handler({ order_id: 100, per_page: 20, page: 1 });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'orders/100/refunds',
        expect.objectContaining({
          per_page: 20,
          page: 1,
          _fields: expect.any(String),
        })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.data).toBeDefined();
      expect(parsed.pagination.total).toBe(1);
    });

    it('uses custom fields when provided', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [{ id: 10 }],
        headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_order_refunds')!.handler;
      await handler({ order_id: 100, per_page: 20, page: 1, fields: 'id,amount' });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'orders/100/refunds',
        expect.objectContaining({
          _fields: 'id,amount',
        })
      );
    });
  });

  describe('create_order_refund handler', () => {
    it('calls wooApi.post with refund data', async () => {
      mockedWooApi.post.mockResolvedValue({
        data: { id: 11, amount: '15.00', reason: 'Wrong item' },
      });

      const handler = registeredTools.get('create_order_refund')!.handler;
      const result = await handler({
        order_id: 100,
        amount: '15.00',
        reason: 'Wrong item',
        api_refund: true,
      });

      expect(mockedWooApi.post).toHaveBeenCalledWith(
        'orders/100/refunds',
        expect.objectContaining({
          amount: '15.00',
          reason: 'Wrong item',
          api_refund: true,
        })
      );
      expect(result.isError).toBeUndefined();
    });

    it('supports line_items for partial refunds', async () => {
      mockedWooApi.post.mockResolvedValue({
        data: { id: 12, amount: '10.00' },
      });

      const handler = registeredTools.get('create_order_refund')!.handler;
      await handler({
        order_id: 100,
        amount: '10.00',
        line_items: [{ id: 5, refund_total: '10.00', quantity: 1 }],
      });

      expect(mockedWooApi.post).toHaveBeenCalledWith(
        'orders/100/refunds',
        expect.objectContaining({
          amount: '10.00',
          line_items: [{ id: 5, refund_total: '10.00', quantity: 1 }],
        })
      );
    });
  });

  describe('delete_order_refund handler', () => {
    it('calls wooApi.delete with order and refund IDs', async () => {
      mockedWooApi.delete.mockResolvedValue({
        data: { id: 10, amount: '25.00' },
      });

      const handler = registeredTools.get('delete_order_refund')!.handler;
      const result = await handler({ order_id: 100, id: 10, force: true });

      expect(mockedWooApi.delete).toHaveBeenCalledWith('orders/100/refunds/10', { force: true });
      expect(result.isError).toBeUndefined();
    });

    it('returns error on API failure', async () => {
      const error: any = new Error('Not found');
      error.response = { data: { code: 'woocommerce_rest_invalid_id', message: 'Invalid refund ID' }, status: 404 };
      mockedWooApi.delete.mockRejectedValue(error);

      const handler = registeredTools.get('delete_order_refund')!.handler;
      const result = await handler({ order_id: 100, id: 999, force: true });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid refund ID');
    });
  });
});
