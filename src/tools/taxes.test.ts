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
import { registerTaxTools } from './taxes.js';
import { wooApi } from '../services/woo-client.js';

const mockedWooApi = vi.mocked(wooApi);

describe('registerTaxTools', () => {
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

    registerTaxTools(server);
  });

  it('registers all 8 tax tools', () => {
    expect(registeredTools.has('list_tax_classes')).toBe(true);
    expect(registeredTools.has('create_tax_class')).toBe(true);
    expect(registeredTools.has('delete_tax_class')).toBe(true);
    expect(registeredTools.has('list_tax_rates')).toBe(true);
    expect(registeredTools.has('get_tax_rate')).toBe(true);
    expect(registeredTools.has('create_tax_rate')).toBe(true);
    expect(registeredTools.has('update_tax_rate')).toBe(true);
    expect(registeredTools.has('delete_tax_rate')).toBe(true);
    expect(registeredTools.size).toBe(8);
  });

  describe('list_tax_classes handler', () => {
    it('calls wooApi.get with correct endpoint', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [
          { slug: 'standard', name: 'Standard' },
          { slug: 'reduced-rate', name: 'Reduced rate' },
        ],
      });

      const handler = registeredTools.get('list_tax_classes')!.handler;
      const result = await handler({});

      expect(mockedWooApi.get).toHaveBeenCalledWith('taxes/classes');
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].slug).toBe('standard');
    });
  });

  describe('create_tax_class handler', () => {
    it('calls wooApi.post with class data', async () => {
      mockedWooApi.post.mockResolvedValue({
        data: { slug: 'gst-5', name: 'GST 5%' },
      });

      const handler = registeredTools.get('create_tax_class')!.handler;
      const result = await handler({ name: 'GST 5%' });

      expect(mockedWooApi.post).toHaveBeenCalledWith(
        'taxes/classes',
        expect.objectContaining({ name: 'GST 5%' })
      );
      expect(result.isError).toBeUndefined();
    });
  });

  describe('delete_tax_class handler', () => {
    it('calls wooApi.delete with slug', async () => {
      mockedWooApi.delete.mockResolvedValue({
        data: { slug: 'gst-5', name: 'GST 5%' },
      });

      const handler = registeredTools.get('delete_tax_class')!.handler;
      await handler({ slug: 'gst-5', force: true });

      expect(mockedWooApi.delete).toHaveBeenCalledWith('taxes/classes/gst-5', { force: true });
    });
  });

  describe('list_tax_rates handler', () => {
    it('calls wooApi.get with pagination', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [{ id: 1, country: 'IN', state: 'GJ', rate: '18.0000', name: 'GST 18%' }],
        headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_tax_rates')!.handler;
      const result = await handler({ per_page: 20, page: 1 });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'taxes',
        expect.objectContaining({ per_page: 20, page: 1 })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.data[0].country).toBe('IN');
      expect(parsed.pagination.total).toBe(1);
    });

    it('passes class filter to API', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [],
        headers: { 'x-wp-total': '0', 'x-wp-totalpages': '1' },
      });

      const handler = registeredTools.get('list_tax_rates')!.handler;
      await handler({ per_page: 20, page: 1, class: 'standard' });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'taxes',
        expect.objectContaining({ class: 'standard' })
      );
    });
  });

  describe('get_tax_rate handler', () => {
    it('calls wooApi.get with rate ID', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: { id: 1, country: 'IN', rate: '18.0000', name: 'GST 18%', class: 'standard' },
      });

      const handler = registeredTools.get('get_tax_rate')!.handler;
      const result = await handler({ id: 1 });

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'taxes/1',
        expect.objectContaining({ _fields: expect.any(String) })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.id).toBe(1);
    });
  });

  describe('create_tax_rate handler', () => {
    it('calls wooApi.post with rate data', async () => {
      mockedWooApi.post.mockResolvedValue({
        data: { id: 2, country: 'IN', state: 'GJ', rate: '5.0000', name: 'GST 5%' },
      });

      const handler = registeredTools.get('create_tax_rate')!.handler;
      const result = await handler({
        country: 'IN',
        state: 'GJ',
        rate: '5.0000',
        name: 'GST 5%',
        class: 'standard',
        priority: 1,
        compound: false,
        shipping: true,
      });

      expect(mockedWooApi.post).toHaveBeenCalledWith(
        'taxes',
        expect.objectContaining({ country: 'IN', rate: '5.0000' })
      );
      expect(result.isError).toBeUndefined();
    });
  });

  describe('update_tax_rate handler', () => {
    it('calls wooApi.put with rate ID and data', async () => {
      mockedWooApi.put.mockResolvedValue({
        data: { id: 1, rate: '12.0000', name: 'GST 12%' },
      });

      const handler = registeredTools.get('update_tax_rate')!.handler;
      await handler({ id: 1, rate: '12.0000', name: 'GST 12%' });

      expect(mockedWooApi.put).toHaveBeenCalledWith(
        'taxes/1',
        expect.objectContaining({ rate: '12.0000', name: 'GST 12%' })
      );
    });
  });

  describe('delete_tax_rate handler', () => {
    it('calls wooApi.delete with rate ID', async () => {
      mockedWooApi.delete.mockResolvedValue({ data: { id: 1 } });

      const handler = registeredTools.get('delete_tax_rate')!.handler;
      await handler({ id: 1, force: true });

      expect(mockedWooApi.delete).toHaveBeenCalledWith('taxes/1', { force: true });
    });
  });

  describe('error handling', () => {
    it('returns error on API failure', async () => {
      const error: any = new Error('Forbidden');
      error.response = {
        data: { code: 'woocommerce_rest_cannot_view', message: 'Cannot view' },
        status: 403,
      };
      mockedWooApi.get.mockRejectedValue(error);

      const handler = registeredTools.get('list_tax_rates')!.handler;
      const result = await handler({ per_page: 20, page: 1 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Cannot view');
    });
  });
});
