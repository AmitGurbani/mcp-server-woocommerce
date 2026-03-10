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
import { registerCouponTools } from './coupons.js';
import { wooApi } from '../services/woo-client.js';

const mockedWooApi = vi.mocked(wooApi);

describe('registerCouponTools', () => {
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

    registerCouponTools(server);
  });

  it('registers all 5 coupon tools', () => {
    expect(registeredTools.has('list_coupons')).toBe(true);
    expect(registeredTools.has('get_coupon')).toBe(true);
    expect(registeredTools.has('create_coupon')).toBe(true);
    expect(registeredTools.has('update_coupon')).toBe(true);
    expect(registeredTools.has('delete_coupon')).toBe(true);
    expect(registeredTools.size).toBe(5);
  });

  describe('list_coupons handler', () => {
    it('calls wooApi.get with correct params', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [{ id: 1, code: 'SAVE10' }],
        headers: { 'x-wp-total': '3', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_coupons')!.handler;
      const result = await handler({ per_page: 20, page: 1 });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'coupons',
        expect.objectContaining({
          per_page: 20,
          page: 1,
          _fields: expect.any(String),
        })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.data).toBeDefined();
      expect(parsed.pagination.total).toBe(3);
    });

    it('passes search filter to API', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [],
        headers: { 'x-wp-total': '0', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_coupons')!.handler;
      await handler({ per_page: 20, page: 1, search: 'SAVE' });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'coupons',
        expect.objectContaining({
          search: 'SAVE',
        })
      );
    });
  });

  describe('get_coupon handler', () => {
    it('calls wooApi.get with coupon ID', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: { id: 5, code: 'SAVE10', discount_type: 'percent', amount: '10' },
      });

      const handler = registeredTools.get('get_coupon')!.handler;
      const result = await handler({ id: 5 });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'coupons/5',
        expect.objectContaining({
          _fields: expect.any(String),
        })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.id).toBe(5);
    });

    it('returns error on API failure', async () => {
      const error: any = new Error('Not found');
      error.response = { data: { code: 'not_found', message: 'Coupon not found' }, status: 404 };
      mockedWooApi.get.mockRejectedValue(error);

      const handler = registeredTools.get('get_coupon')!.handler;
      const result = await handler({ id: 999 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Coupon not found');
    });
  });

  describe('create_coupon handler', () => {
    it('calls wooApi.post with coupon data', async () => {
      mockedWooApi.post.mockResolvedValue({
        data: { id: 10, code: 'WELCOME20' },
      });

      const handler = registeredTools.get('create_coupon')!.handler;
      const result = await handler({
        code: 'WELCOME20',
        discount_type: 'percent',
        amount: '20',
        usage_limit: 100,
      });

      expect(mockedWooApi.post).toHaveBeenCalledWith(
        'coupons',
        expect.objectContaining({
          code: 'WELCOME20',
          discount_type: 'percent',
          amount: '20',
          usage_limit: 100,
        })
      );
      expect(result.isError).toBeUndefined();
    });
  });

  describe('update_coupon handler', () => {
    it('calls wooApi.put with coupon ID and data', async () => {
      mockedWooApi.put.mockResolvedValue({
        data: { id: 5, amount: '15' },
      });

      const handler = registeredTools.get('update_coupon')!.handler;
      await handler({ id: 5, amount: '15' });

      expect(mockedWooApi.put).toHaveBeenCalledWith(
        'coupons/5',
        expect.objectContaining({
          amount: '15',
        })
      );
    });
  });

  describe('delete_coupon handler', () => {
    it('calls wooApi.delete with coupon ID', async () => {
      mockedWooApi.delete.mockResolvedValue({
        data: { id: 5 },
      });

      const handler = registeredTools.get('delete_coupon')!.handler;
      await handler({ id: 5, force: false });

      expect(mockedWooApi.delete).toHaveBeenCalledWith('coupons/5', { force: false });
    });

    it('passes force=true for permanent deletion', async () => {
      mockedWooApi.delete.mockResolvedValue({
        data: { id: 5 },
      });

      const handler = registeredTools.get('delete_coupon')!.handler;
      await handler({ id: 5, force: true });

      expect(mockedWooApi.delete).toHaveBeenCalledWith('coupons/5', { force: true });
    });
  });
});
