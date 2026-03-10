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
import { registerReportTools } from './reports.js';
import { wooApi } from '../services/woo-client.js';

const mockedWooApi = vi.mocked(wooApi);

describe('registerReportTools', () => {
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

    registerReportTools(server);
  });

  it('registers all 5 report tools', () => {
    expect(registeredTools.has('get_sales_report')).toBe(true);
    expect(registeredTools.has('get_top_sellers')).toBe(true);
    expect(registeredTools.has('get_order_totals')).toBe(true);
    expect(registeredTools.has('get_product_totals')).toBe(true);
    expect(registeredTools.has('get_customer_totals')).toBe(true);
    expect(registeredTools.size).toBe(5);
  });

  describe('get_sales_report handler', () => {
    it('calls wooApi.get with period param', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [{ total_sales: '5000.00', total_orders: 50 }],
      });

      const handler = registeredTools.get('get_sales_report')!.handler;
      const result = await handler({ period: 'month' });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'reports/sales',
        expect.objectContaining({
          period: 'month',
        })
      );
      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toEqual(
        expect.arrayContaining([expect.objectContaining({ total_sales: '5000.00' })])
      );
    });

    it('calls wooApi.get with date range', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [{ total_sales: '2000.00' }],
      });

      const handler = registeredTools.get('get_sales_report')!.handler;
      await handler({ date_min: '2025-01-01', date_max: '2025-01-31' });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'reports/sales',
        expect.objectContaining({
          date_min: '2025-01-01',
          date_max: '2025-01-31',
        })
      );
    });

    it('returns error on API failure', async () => {
      const error: any = new Error('Server error');
      error.response = { data: { code: 'server_error', message: 'Internal error' }, status: 500 };
      mockedWooApi.get.mockRejectedValue(error);

      const handler = registeredTools.get('get_sales_report')!.handler;
      const result = await handler({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Internal error');
    });
  });

  describe('get_top_sellers handler', () => {
    it('calls wooApi.get with period param', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [{ title: 'Rice 5kg', product_id: 39, quantity: 100 }],
      });

      const handler = registeredTools.get('get_top_sellers')!.handler;
      const result = await handler({ period: 'month' });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'reports/top_sellers',
        expect.objectContaining({
          period: 'month',
        })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });
  });

  describe('get_order_totals handler', () => {
    it('calls wooApi.get for order totals', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [
          { slug: 'pending', name: 'Pending payment', total: 5 },
          { slug: 'completed', name: 'Completed', total: 120 },
        ],
      });

      const handler = registeredTools.get('get_order_totals')!.handler;
      const result = await handler({});

      expect(mockedWooApi.get).toHaveBeenCalledWith('reports/orders/totals');
      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toEqual(
        expect.arrayContaining([expect.objectContaining({ slug: 'completed' })])
      );
    });
  });

  describe('get_product_totals handler', () => {
    it('calls wooApi.get for product totals', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [
          { slug: 'publish', name: 'Published', total: 613 },
          { slug: 'draft', name: 'Draft', total: 5 },
        ],
      });

      const handler = registeredTools.get('get_product_totals')!.handler;
      const result = await handler({});

      expect(mockedWooApi.get).toHaveBeenCalledWith('reports/products/totals');
      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toEqual(
        expect.arrayContaining([expect.objectContaining({ slug: 'publish' })])
      );
    });
  });

  describe('get_customer_totals handler', () => {
    it('calls wooApi.get for customer totals', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [{ slug: 'customer', name: 'Customer', total: 25 }],
      });

      const handler = registeredTools.get('get_customer_totals')!.handler;
      const result = await handler({});

      expect(mockedWooApi.get).toHaveBeenCalledWith('reports/customers/totals');
      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toEqual(
        expect.arrayContaining([expect.objectContaining({ slug: 'customer' })])
      );
    });
  });
});
