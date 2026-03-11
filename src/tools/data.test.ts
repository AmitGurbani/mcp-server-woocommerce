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
import { registerDataTools } from './data.js';
import { wooApi } from '../services/woo-client.js';

const mockedWooApi = vi.mocked(wooApi);

describe('registerDataTools', () => {
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

    registerDataTools(server);
  });

  it('registers all 2 data tools', () => {
    expect(registeredTools.has('list_countries')).toBe(true);
    expect(registeredTools.has('list_currencies')).toBe(true);
    expect(registeredTools.size).toBe(2);
  });

  describe('list_countries handler', () => {
    it('calls wooApi.get with data/countries endpoint', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [
          { code: 'IN', name: 'India', states: [{ code: 'GJ', name: 'Gujarat' }] },
          { code: 'US', name: 'United States', states: [] },
        ],
      });

      const handler = registeredTools.get('list_countries')!.handler;
      const result = await handler({});

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'data/countries',
        expect.objectContaining({ _fields: expect.any(String) })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].code).toBe('IN');
    });

    it('uses custom fields when provided', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [{ code: 'IN', name: 'India' }],
      });

      const handler = registeredTools.get('list_countries')!.handler;
      await handler({ fields: 'code,name' });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'data/countries',
        expect.objectContaining({ _fields: 'code,name' })
      );
    });
  });

  describe('list_currencies handler', () => {
    it('calls wooApi.get with data/currencies endpoint', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [
          { code: 'INR', name: 'Indian rupee', symbol: '₹' },
          { code: 'USD', name: 'United States dollar', symbol: '$' },
        ],
      });

      const handler = registeredTools.get('list_currencies')!.handler;
      const result = await handler({});

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'data/currencies',
        expect.objectContaining({ _fields: expect.any(String) })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].symbol).toBe('₹');
    });
  });

  describe('error handling', () => {
    it('returns error on API failure', async () => {
      const error: any = new Error('Unauthorized');
      error.response = {
        data: { code: 'woocommerce_rest_cannot_view', message: 'Cannot view data' },
        status: 403,
      };
      mockedWooApi.get.mockRejectedValue(error);

      const handler = registeredTools.get('list_countries')!.handler;
      const result = await handler({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Cannot view data');
    });
  });
});
