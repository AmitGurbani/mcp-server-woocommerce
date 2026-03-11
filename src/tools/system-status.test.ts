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
import { registerSystemStatusTools } from './system-status.js';
import { wooApi } from '../services/woo-client.js';

const mockedWooApi = vi.mocked(wooApi);

describe('registerSystemStatusTools', () => {
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

    registerSystemStatusTools(server);
  });

  it('registers all 3 system status tools', () => {
    expect(registeredTools.has('get_system_status')).toBe(true);
    expect(registeredTools.has('list_system_tools')).toBe(true);
    expect(registeredTools.has('run_system_tool')).toBe(true);
    expect(registeredTools.size).toBe(3);
  });

  describe('get_system_status handler', () => {
    it('calls wooApi.get with system_status endpoint', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: {
          environment: { version: '9.0.0', wp_version: '6.5' },
          database: { wc_database_version: '9.0.0' },
        },
      });

      const handler = registeredTools.get('get_system_status')!.handler;
      const result = await handler({});

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'system_status',
        expect.objectContaining({ _fields: expect.any(String) })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.environment).toBeDefined();
    });
  });

  describe('list_system_tools handler', () => {
    it('calls wooApi.get with system_status/tools endpoint', async () => {
      mockedWooApi.get.mockResolvedValue({
        data: [
          { id: 'clear_transients', name: 'Clear transients', description: 'Clears transients' },
          { id: 'recount_terms', name: 'Recount terms', description: 'Recounts terms' },
        ],
      });

      const handler = registeredTools.get('list_system_tools')!.handler;
      const result = await handler({});

      expect(mockedWooApi.get).toHaveBeenCalledWith(
        'system_status/tools',
        expect.objectContaining({ _fields: expect.any(String) })
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
    });
  });

  describe('run_system_tool handler', () => {
    it('calls wooApi.put with tool ID', async () => {
      mockedWooApi.put.mockResolvedValue({
        data: { id: 'clear_transients', name: 'Clear transients', success: true, message: 'Done' },
      });

      const handler = registeredTools.get('run_system_tool')!.handler;
      const result = await handler({ id: 'clear_transients' });

      expect(mockedWooApi.put).toHaveBeenCalledWith('system_status/tools/clear_transients', {});
      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
    });
  });

  describe('error handling', () => {
    it('returns error on API failure', async () => {
      const error: any = new Error('Not found');
      error.response = {
        data: { code: 'woocommerce_rest_invalid_id', message: 'Invalid tool ID' },
        status: 404,
      };
      mockedWooApi.put.mockRejectedValue(error);

      const handler = registeredTools.get('run_system_tool')!.handler;
      const result = await handler({ id: 'nonexistent' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid tool ID');
    });
  });
});
