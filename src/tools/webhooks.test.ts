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
import { registerWebhookTools } from './webhooks.js';
import { wooApi } from '../services/woo-client.js';

const mockedWooApi = vi.mocked(wooApi);

describe('registerWebhookTools', () => {
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

    registerWebhookTools(server);
  });

  it('registers all 5 webhook tools', () => {
    expect(registeredTools.has('list_webhooks')).toBe(true);
    expect(registeredTools.has('get_webhook')).toBe(true);
    expect(registeredTools.has('create_webhook')).toBe(true);
    expect(registeredTools.has('update_webhook')).toBe(true);
    expect(registeredTools.has('delete_webhook')).toBe(true);
    expect(registeredTools.size).toBe(5);
  });

  describe('list_webhooks handler', () => {
    it('calls wooApi.get with correct params', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [{ id: 1, name: 'Order created', topic: 'order.created', status: 'active' }],
        headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_webhooks')!.handler;
      const result = await handler({ per_page: 20, page: 1 });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'webhooks',
        expect.objectContaining({ per_page: 20, page: 1 })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.data[0].topic).toBe('order.created');
      expect(parsed.pagination.total).toBe(1);
    });

    it('passes status filter to API', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [],
        headers: { 'x-wp-total': '0', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_webhooks')!.handler;
      await handler({ per_page: 20, page: 1, status: 'active' });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'webhooks',
        expect.objectContaining({ status: 'active' })
      );
    });
  });

  describe('get_webhook handler', () => {
    it('calls wooApi.get with webhook ID', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: {
          id: 1,
          name: 'Order created',
          topic: 'order.created',
          delivery_url: 'https://example.com/hook',
          status: 'active',
        },
      });

      const handler = registeredTools.get('get_webhook')!.handler;
      const result = await handler({ id: 1 });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'webhooks/1',
        expect.objectContaining({ _fields: expect.any(String) })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.id).toBe(1);
      expect(parsed.topic).toBe('order.created');
    });
  });

  describe('create_webhook handler', () => {
    it('calls wooApi.post with webhook data', async () => {
      mockedWooApi.post.mockResolvedValue({
        data: {
          id: 2,
          name: 'Product updated',
          topic: 'product.updated',
          delivery_url: 'https://example.com/products',
          status: 'active',
        },
      });

      const handler = registeredTools.get('create_webhook')!.handler;
      const result = await handler({
        name: 'Product updated',
        topic: 'product.updated',
        delivery_url: 'https://example.com/products',
        status: 'active',
      });

      expect(mockedWooApi.post).toHaveBeenCalledWith(
        'webhooks',
        expect.objectContaining({
          name: 'Product updated',
          topic: 'product.updated',
          delivery_url: 'https://example.com/products',
        })
      );
      expect(result.isError).toBeUndefined();
    });
  });

  describe('update_webhook handler', () => {
    it('calls wooApi.put with webhook ID and data', async () => {
      mockedWooApi.put.mockResolvedValue({
        data: { id: 1, name: 'Order created v2', status: 'paused' },
      });

      const handler = registeredTools.get('update_webhook')!.handler;
      await handler({ id: 1, name: 'Order created v2', status: 'paused' });

      expect(mockedWooApi.put).toHaveBeenCalledWith(
        'webhooks/1',
        expect.objectContaining({ name: 'Order created v2', status: 'paused' })
      );
    });
  });

  describe('delete_webhook handler', () => {
    it('calls wooApi.delete with webhook ID', async () => {
      mockedWooApi.delete.mockResolvedValue({ data: { id: 1 } });

      const handler = registeredTools.get('delete_webhook')!.handler;
      await handler({ id: 1, force: true });

      expect(mockedWooApi.delete).toHaveBeenCalledWith('webhooks/1', { force: true });
    });
  });

  describe('error handling', () => {
    it('returns error on API failure', async () => {
      const error: any = new Error('Not found');
      error.response = {
        data: { code: 'woocommerce_rest_invalid_id', message: 'Invalid webhook ID' },
        status: 404,
      };
      mockedWooApi.get.mockRejectedValue(error);

      const handler = registeredTools.get('get_webhook')!.handler;
      const result = await handler({ id: 999 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid webhook ID');
    });
  });
});
