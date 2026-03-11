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
import { registerOrderNoteTools } from './order-notes.js';
import { wooApi } from '../services/woo-client.js';

const mockedWooApi = vi.mocked(wooApi);

describe('registerOrderNoteTools', () => {
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

    registerOrderNoteTools(server);
  });

  it('registers all 3 order note tools', () => {
    expect(registeredTools.has('list_order_notes')).toBe(true);
    expect(registeredTools.has('create_order_note')).toBe(true);
    expect(registeredTools.has('delete_order_note')).toBe(true);
    expect(registeredTools.size).toBe(3);
  });

  describe('list_order_notes handler', () => {
    it('calls wooApi.get with order notes endpoint (non-paginated)', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [
          { id: 1, author: 'admin', note: 'Order placed', customer_note: false },
          { id: 2, author: 'system', note: 'Payment received', customer_note: false },
        ],
      });

      const handler = registeredTools.get('list_order_notes')!.handler;
      const result = await handler({ order_id: 100 });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'orders/100/notes',
        expect.objectContaining({
          _fields: expect.any(String),
        })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
    });

    it('uses custom fields when provided', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [{ id: 1, note: 'Test' }],
      });

      const handler = registeredTools.get('list_order_notes')!.handler;
      await handler({ order_id: 100, fields: 'id,note' });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'orders/100/notes',
        expect.objectContaining({
          _fields: 'id,note',
        })
      );
    });
  });

  describe('create_order_note handler', () => {
    it('calls wooApi.post with note data', async () => {
      mockedWooApi.post.mockResolvedValue({
        data: { id: 3, author: 'admin', note: 'Shipped via courier', customer_note: false },
      });

      const handler = registeredTools.get('create_order_note')!.handler;
      const result = await handler({
        order_id: 100,
        note: 'Shipped via courier',
        customer_note: false,
      });

      expect(mockedWooApi.post).toHaveBeenCalledWith(
        'orders/100/notes',
        expect.objectContaining({
          note: 'Shipped via courier',
          customer_note: false,
        })
      );
      expect(result.isError).toBeUndefined();
    });

    it('supports customer_note=true for email notification', async () => {
      mockedWooApi.post.mockResolvedValue({
        data: { id: 4, note: 'Your order has shipped!', customer_note: true },
      });

      const handler = registeredTools.get('create_order_note')!.handler;
      await handler({
        order_id: 100,
        note: 'Your order has shipped!',
        customer_note: true,
      });

      expect(mockedWooApi.post).toHaveBeenCalledWith(
        'orders/100/notes',
        expect.objectContaining({
          note: 'Your order has shipped!',
          customer_note: true,
        })
      );
    });
  });

  describe('delete_order_note handler', () => {
    it('calls wooApi.delete with order and note IDs', async () => {
      mockedWooApi.delete.mockResolvedValue({
        data: { id: 1, note: 'Order placed' },
      });

      const handler = registeredTools.get('delete_order_note')!.handler;
      const result = await handler({ order_id: 100, id: 1, force: true });

      expect(mockedWooApi.delete).toHaveBeenCalledWith('orders/100/notes/1', { force: true });
      expect(result.isError).toBeUndefined();
    });

    it('returns error on API failure', async () => {
      const error: any = new Error('Not found');
      error.response = { data: { code: 'woocommerce_rest_invalid_id', message: 'Invalid note ID' }, status: 404 };
      mockedWooApi.delete.mockRejectedValue(error);

      const handler = registeredTools.get('delete_order_note')!.handler;
      const result = await handler({ order_id: 100, id: 999, force: true });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid note ID');
    });
  });
});
