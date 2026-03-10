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
import { registerSettingsTools } from './settings.js';
import { wooApi } from '../services/woo-client.js';

const mockedWooApi = vi.mocked(wooApi);

describe('registerSettingsTools', () => {
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

    registerSettingsTools(server);
  });

  it('registers all 3 settings tools', () => {
    expect(registeredTools.has('list_setting_groups')).toBe(true);
    expect(registeredTools.has('get_settings')).toBe(true);
    expect(registeredTools.has('update_setting')).toBe(true);
    expect(registeredTools.size).toBe(3);
  });

  describe('list_setting_groups handler', () => {
    it('calls wooApi.get with correct endpoint', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [
          { id: 'general', label: 'General', description: '' },
          { id: 'products', label: 'Products', description: '' },
          { id: 'tax', label: 'Tax', description: '' },
        ],
      });

      const handler = registeredTools.get('list_setting_groups')!.handler;
      const result = await handler({});

      expect(mockedWooApi.get).toHaveBeenCalledWith('settings', {
        _fields: 'id,label,description',
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveLength(3);
      expect(parsed[0].id).toBe('general');
    });
  });

  describe('get_settings handler', () => {
    it('calls wooApi.get with group ID', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [
          {
            id: 'woocommerce_currency',
            label: 'Currency',
            type: 'select',
            value: 'INR',
            default: 'GBP',
          },
        ],
      });

      const handler = registeredTools.get('get_settings')!.handler;
      const result = await handler({ group_id: 'general' });

      expect(mockedWooApi.get).toHaveBeenCalledWith('settings/general', {
        _fields: 'id,label,description,type,value,options,default',
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed[0].id).toBe('woocommerce_currency');
      expect(parsed[0].value).toBe('INR');
    });
  });

  describe('update_setting handler', () => {
    it('calls wooApi.put with group, setting ID, and value', async () => {
      mockedWooApi.put.mockResolvedValue({
        data: {
          id: 'woocommerce_currency',
          label: 'Currency',
          value: 'USD',
        },
      });

      const handler = registeredTools.get('update_setting')!.handler;
      const result = await handler({
        group_id: 'general',
        setting_id: 'woocommerce_currency',
        value: 'USD',
      });

      expect(mockedWooApi.put).toHaveBeenCalledWith(
        'settings/general/woocommerce_currency',
        expect.objectContaining({ value: 'USD' })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.value).toBe('USD');
    });
  });

  describe('error handling', () => {
    it('returns error on API failure', async () => {
      const error: any = new Error('Unauthorized');
      error.response = { status: 401 };
      mockedWooApi.get.mockRejectedValue(error);

      const handler = registeredTools.get('get_settings')!.handler;
      const result = await handler({ group_id: 'general' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Authentication error');
    });
  });
});
