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
import { registerPaymentGatewayTools } from './payment-gateways.js';
import { wooApi } from '../services/woo-client.js';

const mockedWooApi = vi.mocked(wooApi);

describe('registerPaymentGatewayTools', () => {
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

    registerPaymentGatewayTools(server);
  });

  it('registers all 3 payment gateway tools', () => {
    expect(registeredTools.has('list_payment_gateways')).toBe(true);
    expect(registeredTools.has('get_payment_gateway')).toBe(true);
    expect(registeredTools.has('update_payment_gateway')).toBe(true);
    expect(registeredTools.size).toBe(3);
  });

  describe('list_payment_gateways handler', () => {
    it('calls wooApi.get with payment_gateways endpoint (non-paginated)', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [
          { id: 'bacs', title: 'Direct bank transfer', enabled: true },
          { id: 'cod', title: 'Cash on delivery', enabled: true },
        ],
      });

      const handler = registeredTools.get('list_payment_gateways')!.handler;
      const result = await handler({});

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'payment_gateways',
        expect.objectContaining({ _fields: expect.any(String) })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
    });

    it('uses custom fields when provided', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [{ id: 'cod', enabled: true }],
      });

      const handler = registeredTools.get('list_payment_gateways')!.handler;
      await handler({ fields: 'id,enabled' });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'payment_gateways',
        expect.objectContaining({ _fields: 'id,enabled' })
      );
    });
  });

  describe('get_payment_gateway handler', () => {
    it('calls wooApi.get with gateway string ID', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: {
          id: 'cod',
          title: 'Cash on delivery',
          enabled: true,
          method_title: 'Cash on delivery',
          settings: {},
        },
      });

      const handler = registeredTools.get('get_payment_gateway')!.handler;
      const result = await handler({ id: 'cod' });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'payment_gateways/cod',
        expect.objectContaining({ _fields: expect.any(String) })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.id).toBe('cod');
    });
  });

  describe('update_payment_gateway handler', () => {
    it('calls wooApi.put with gateway ID and data', async () => {
      mockedWooApi.put.mockResolvedValue({
        data: { id: 'cod', title: 'Cash on delivery', enabled: false },
      });

      const handler = registeredTools.get('update_payment_gateway')!.handler;
      const result = await handler({ id: 'cod', enabled: false });

      expect(mockedWooApi.put).toHaveBeenCalledWith(
        'payment_gateways/cod',
        expect.objectContaining({ enabled: false })
      );
      expect(result.isError).toBeUndefined();
    });

    it('supports settings as key-value pairs', async () => {
      mockedWooApi.put.mockResolvedValue({
        data: { id: 'bacs', settings: { account_name: 'Store Account' } },
      });

      const handler = registeredTools.get('update_payment_gateway')!.handler;
      await handler({ id: 'bacs', settings: { account_name: 'Store Account' } });

      expect(mockedWooApi.put).toHaveBeenCalledWith(
        'payment_gateways/bacs',
        expect.objectContaining({ settings: { account_name: 'Store Account' } })
      );
    });
  });

  describe('error handling', () => {
    it('returns error on API failure', async () => {
      const error: any = new Error('Not found');
      error.response = {
        data: { code: 'woocommerce_rest_invalid_id', message: 'Invalid gateway ID' },
        status: 404,
      };
      mockedWooApi.get.mockRejectedValue(error);

      const handler = registeredTools.get('get_payment_gateway')!.handler;
      const result = await handler({ id: 'nonexistent' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid gateway ID');
    });
  });
});
