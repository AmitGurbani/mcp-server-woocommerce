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
import { registerShippingTools } from './shipping.js';
import { wooApi } from '../services/woo-client.js';

const mockedWooApi = vi.mocked(wooApi);

describe('registerShippingTools', () => {
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

    registerShippingTools(server);
  });

  it('registers all 12 shipping tools', () => {
    expect(registeredTools.has('list_shipping_zones')).toBe(true);
    expect(registeredTools.has('get_shipping_zone')).toBe(true);
    expect(registeredTools.has('create_shipping_zone')).toBe(true);
    expect(registeredTools.has('update_shipping_zone')).toBe(true);
    expect(registeredTools.has('delete_shipping_zone')).toBe(true);
    expect(registeredTools.has('list_shipping_zone_methods')).toBe(true);
    expect(registeredTools.has('add_shipping_zone_method')).toBe(true);
    expect(registeredTools.has('update_shipping_zone_method')).toBe(true);
    expect(registeredTools.has('delete_shipping_zone_method')).toBe(true);
    expect(registeredTools.has('list_shipping_classes')).toBe(true);
    expect(registeredTools.has('create_shipping_class')).toBe(true);
    expect(registeredTools.has('delete_shipping_class')).toBe(true);
    expect(registeredTools.size).toBe(12);
  });

  describe('list_shipping_zones handler', () => {
    it('calls wooApi.get with correct endpoint', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [{ id: 0, name: 'Locations not covered by your other zones', order: 0 }],
      });

      const handler = registeredTools.get('list_shipping_zones')!.handler;
      const result = await handler({});

      expect(mockedWooApi.get).toHaveBeenCalledWith('shipping/zones');
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe(0);
    });
  });

  describe('get_shipping_zone handler', () => {
    it('calls wooApi.get with zone ID', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: { id: 1, name: 'India', order: 1 },
      });

      const handler = registeredTools.get('get_shipping_zone')!.handler;
      const result = await handler({ id: 1 });

      expect(mockedWooApi.get).toHaveBeenCalledWith('shipping/zones/1');
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.name).toBe('India');
    });
  });

  describe('create_shipping_zone handler', () => {
    it('calls wooApi.post with zone data', async () => {
      mockedWooApi.post.mockResolvedValue({
        data: { id: 2, name: 'Gujarat', order: 0 },
      });

      const handler = registeredTools.get('create_shipping_zone')!.handler;
      const result = await handler({ name: 'Gujarat', order: 0 });

      expect(mockedWooApi.post).toHaveBeenCalledWith(
        'shipping/zones',
        expect.objectContaining({ name: 'Gujarat' })
      );
      expect(result.isError).toBeUndefined();
    });
  });

  describe('list_shipping_zone_methods handler', () => {
    it('calls wooApi.get with zone methods endpoint', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [{ instance_id: 1, title: 'Flat rate', method_id: 'flat_rate', enabled: true }],
      });

      const handler = registeredTools.get('list_shipping_zone_methods')!.handler;
      const result = await handler({ zone_id: 1 });

      expect(mockedWooApi.get).toHaveBeenCalledWith('shipping/zones/1/methods');
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed[0].method_id).toBe('flat_rate');
    });
  });

  describe('add_shipping_zone_method handler', () => {
    it('calls wooApi.post with method data', async () => {
      mockedWooApi.post.mockResolvedValue({
        data: { instance_id: 2, method_id: 'free_shipping', title: 'Free shipping' },
      });

      const handler = registeredTools.get('add_shipping_zone_method')!.handler;
      await handler({ zone_id: 1, method_id: 'free_shipping' });

      expect(mockedWooApi.post).toHaveBeenCalledWith(
        'shipping/zones/1/methods',
        expect.objectContaining({ method_id: 'free_shipping' })
      );
    });
  });

  describe('delete_shipping_zone handler', () => {
    it('calls wooApi.delete with zone ID', async () => {
      mockedWooApi.delete.mockResolvedValue({ data: { id: 1 } });

      const handler = registeredTools.get('delete_shipping_zone')!.handler;
      await handler({ id: 1, force: true });

      expect(mockedWooApi.delete).toHaveBeenCalledWith('shipping/zones/1', { force: true });
    });
  });

  describe('list_shipping_classes handler', () => {
    it('calls wooApi.get with pagination', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [{ id: 1, name: 'Heavy', slug: 'heavy', count: 5 }],
        headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_shipping_classes')!.handler;
      const result = await handler({ per_page: 20, page: 1 });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'products/shipping_classes',
        expect.objectContaining({ per_page: 20, page: 1 })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.pagination.total).toBe(1);
    });
  });

  describe('create_shipping_class handler', () => {
    it('calls wooApi.post with class data', async () => {
      mockedWooApi.post.mockResolvedValue({
        data: { id: 2, name: 'Fragile', slug: 'fragile' },
      });

      const handler = registeredTools.get('create_shipping_class')!.handler;
      const result = await handler({ name: 'Fragile' });

      expect(mockedWooApi.post).toHaveBeenCalledWith(
        'products/shipping_classes',
        expect.objectContaining({ name: 'Fragile' })
      );
      expect(result.isError).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('returns error on API failure', async () => {
      const error: any = new Error('Not found');
      error.response = {
        data: { code: 'woocommerce_rest_invalid_id', message: 'Invalid ID' },
        status: 404,
      };
      mockedWooApi.get.mockRejectedValue(error);

      const handler = registeredTools.get('get_shipping_zone')!.handler;
      const result = await handler({ id: 999 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid ID');
    });
  });
});
