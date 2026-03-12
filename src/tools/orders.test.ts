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
import { registerOrderTools } from './orders.js';
import { wooApi } from '../services/woo-client.js';

const mockedWooApi = vi.mocked(wooApi);

describe('registerOrderTools', () => {
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

    registerOrderTools(server);
  });

  it('registers all 5 order tools', () => {
    expect(registeredTools.has('list_orders')).toBe(true);
    expect(registeredTools.has('get_order')).toBe(true);
    expect(registeredTools.has('create_order')).toBe(true);
    expect(registeredTools.has('update_order')).toBe(true);
    expect(registeredTools.has('delete_order')).toBe(true);
    expect(registeredTools.size).toBe(5);
  });

  describe('list_orders handler', () => {
    it('calls wooApi.get with correct params', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [{ id: 1, status: 'processing' }],
        headers: { 'x-wp-total': '10', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_orders')!.handler;
      const result = await handler({ per_page: 20, page: 1 });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'orders',
        expect.objectContaining({
          per_page: 20,
          page: 1,
        })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.data).toBeDefined();
      expect(parsed.pagination.total).toBe(10);
    });

    it('passes status filter to API', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [],
        headers: { 'x-wp-total': '0', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_orders')!.handler;
      await handler({ per_page: 20, page: 1, status: 'completed' });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'orders',
        expect.objectContaining({
          status: 'completed',
        })
      );
    });

    it('passes date range filters', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [],
        headers: { 'x-wp-total': '0', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_orders')!.handler;
      await handler({ per_page: 20, page: 1, after: '2025-01-01', before: '2025-12-31' });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'orders',
        expect.objectContaining({
          after: '2025-01-01',
          before: '2025-12-31',
        })
      );
    });
  });

  describe('get_order handler', () => {
    it('calls wooApi.get with order ID', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: { id: 55, status: 'processing', total: '150.00' },
      });

      const handler = registeredTools.get('get_order')!.handler;
      const result = await handler({ id: 55 });

      expect(mockedWooApi.get).toHaveBeenCalledWith('orders/55', expect.any(Object));
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.id).toBe(55);
    });
  });

  describe('create_order handler', () => {
    it('calls wooApi.post with order data', async () => {
      mockedWooApi.post.mockResolvedValue({
        data: { id: 100, status: 'pending' },
      });

      const handler = registeredTools.get('create_order')!.handler;
      const result = await handler({
        line_items: [{ product_id: 1, quantity: 2 }],
        customer_id: 5,
        set_paid: true,
      });

      expect(mockedWooApi.post).toHaveBeenCalledWith(
        'orders',
        expect.objectContaining({
          line_items: [{ product_id: 1, quantity: 2 }],
          customer_id: 5,
          set_paid: true,
        })
      );
      expect(result.isError).toBeUndefined();
    });

    it('handles billing and shipping addresses', async () => {
      mockedWooApi.post.mockResolvedValue({
        data: { id: 101 },
      });

      const handler = registeredTools.get('create_order')!.handler;
      await handler({
        line_items: [{ product_id: 1, quantity: 1 }],
        billing: { first_name: 'John', email: 'john@example.com' },
        shipping: { first_name: 'John', city: 'Bilimora' },
      });

      expect(mockedWooApi.post).toHaveBeenCalledWith(
        'orders',
        expect.objectContaining({
          billing: expect.objectContaining({ first_name: 'John' }),
          shipping: expect.objectContaining({ city: 'Bilimora' }),
        })
      );
    });
  });

  describe('update_order handler', () => {
    it('calls wooApi.put with order ID and status change', async () => {
      mockedWooApi.put.mockResolvedValue({
        data: { id: 55, status: 'completed' },
      });

      const handler = registeredTools.get('update_order')!.handler;
      await handler({ id: 55, status: 'completed' });

      expect(mockedWooApi.put).toHaveBeenCalledWith(
        'orders/55',
        expect.objectContaining({
          status: 'completed',
        })
      );
    });
  });

  describe('delete_order handler', () => {
    it('calls wooApi.delete with order ID and force flag', async () => {
      mockedWooApi.delete.mockResolvedValue({
        data: { id: 55, status: 'trash' },
      });

      const handler = registeredTools.get('delete_order')!.handler;
      const result = await handler({ id: 55, force: true });

      expect(mockedWooApi.delete).toHaveBeenCalledWith('orders/55', { force: true });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.id).toBe(55);
    });
  });
});
