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
import { registerCustomerTools } from './customers.js';
import { wooApi } from '../services/woo-client.js';

const mockedWooApi = vi.mocked(wooApi);

describe('registerCustomerTools', () => {
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

    registerCustomerTools(server);
  });

  it('registers all 4 customer tools (no delete)', () => {
    expect(registeredTools.has('list_customers')).toBe(true);
    expect(registeredTools.has('get_customer')).toBe(true);
    expect(registeredTools.has('create_customer')).toBe(true);
    expect(registeredTools.has('update_customer')).toBe(true);
    expect(registeredTools.size).toBe(4);
  });

  describe('list_customers handler', () => {
    it('calls wooApi.get with correct params', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [{ id: 1, email: 'john@example.com' }],
        headers: { 'x-wp-total': '25', 'x-wp-totalpages': '2' },
      });

      const handler = registeredTools.get('list_customers')!.handler;
      const result = await handler({ per_page: 20, page: 1 });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'customers',
        expect.objectContaining({
          per_page: 20,
          page: 1,
          _fields: expect.any(String),
        })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.data).toBeDefined();
      expect(parsed.pagination.total).toBe(25);
    });

    it('passes search and role filters to API', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [],
        headers: { 'x-wp-total': '0', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_customers')!.handler;
      await handler({ per_page: 20, page: 1, search: 'john', role: 'customer' });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'customers',
        expect.objectContaining({
          search: 'john',
          role: 'customer',
        })
      );
    });
  });

  describe('get_customer handler', () => {
    it('calls wooApi.get with customer ID', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: { id: 5, email: 'jane@example.com', first_name: 'Jane' },
      });

      const handler = registeredTools.get('get_customer')!.handler;
      const result = await handler({ id: 5 });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'customers/5',
        expect.objectContaining({
          _fields: expect.any(String),
        })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.id).toBe(5);
    });

    it('returns error on API failure', async () => {
      const error: any = new Error('Not found');
      error.response = { data: { code: 'not_found', message: 'Customer not found' }, status: 404 };
      mockedWooApi.get.mockRejectedValue(error);

      const handler = registeredTools.get('get_customer')!.handler;
      const result = await handler({ id: 999 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Customer not found');
    });
  });

  describe('create_customer handler', () => {
    it('calls wooApi.post with customer data', async () => {
      mockedWooApi.post.mockResolvedValue({
        data: { id: 10, email: 'new@example.com' },
      });

      const handler = registeredTools.get('create_customer')!.handler;
      const result = await handler({
        email: 'new@example.com',
        first_name: 'New',
        last_name: 'Customer',
      });

      expect(mockedWooApi.post).toHaveBeenCalledWith(
        'customers',
        expect.objectContaining({
          email: 'new@example.com',
          first_name: 'New',
          last_name: 'Customer',
        })
      );
      expect(result.isError).toBeUndefined();
    });

    it('handles billing and shipping addresses', async () => {
      mockedWooApi.post.mockResolvedValue({
        data: { id: 11 },
      });

      const handler = registeredTools.get('create_customer')!.handler;
      await handler({
        email: 'customer@example.com',
        billing: { first_name: 'John', city: 'Bilimora' },
        shipping: { first_name: 'John', city: 'Bilimora' },
      });

      expect(mockedWooApi.post).toHaveBeenCalledWith(
        'customers',
        expect.objectContaining({
          billing: expect.objectContaining({ city: 'Bilimora' }),
          shipping: expect.objectContaining({ city: 'Bilimora' }),
        })
      );
    });
  });

  describe('update_customer handler', () => {
    it('calls wooApi.put with customer ID and data', async () => {
      mockedWooApi.put.mockResolvedValue({
        data: { id: 5, first_name: 'Updated' },
      });

      const handler = registeredTools.get('update_customer')!.handler;
      await handler({ id: 5, first_name: 'Updated' });

      expect(mockedWooApi.put).toHaveBeenCalledWith(
        'customers/5',
        expect.objectContaining({
          first_name: 'Updated',
        })
      );
    });
  });
});
