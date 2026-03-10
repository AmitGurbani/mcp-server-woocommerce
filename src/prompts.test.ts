import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerPrompts } from './prompts.js';

describe('registerPrompts', () => {
  let server: McpServer;
  let registeredPrompts: Map<string, { config: any; handler: Function }>;

  beforeEach(() => {
    vi.clearAllMocks();
    server = new McpServer({ name: 'test', version: '1.0.0' });
    registeredPrompts = new Map();

    vi.spyOn(server, 'registerPrompt').mockImplementation(((...args: any[]) => {
      const [name, config, handler] = args;
      registeredPrompts.set(name, { config, handler });
    }) as any);

    registerPrompts(server);
  });

  it('registers 3 prompts', () => {
    expect(server.registerPrompt).toHaveBeenCalledTimes(3);
    expect(registeredPrompts.size).toBe(3);
  });

  it('registers all expected prompt names', () => {
    expect(registeredPrompts.has('setup_variable_product')).toBe(true);
    expect(registeredPrompts.has('process_order')).toBe(true);
    expect(registeredPrompts.has('catalog_overview')).toBe(true);
  });

  it('setup_variable_product returns messages with product details', () => {
    const { handler } = registeredPrompts.get('setup_variable_product')!;
    const result = handler({
      product_name: 'Test Product',
      attribute_name: 'Weight',
      variations: '500g, 1kg',
    });
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe('user');
    expect(result.messages[0].content.text).toContain('Test Product');
    expect(result.messages[0].content.text).toContain('Weight');
    expect(result.messages[0].content.text).toContain('500g, 1kg');
  });

  it('process_order returns messages with order ID', () => {
    const { handler } = registeredPrompts.get('process_order')!;
    const result = handler({ order_id: '42' });
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].content.text).toContain('42');
  });

  it('catalog_overview returns messages without args', async () => {
    const { handler } = registeredPrompts.get('catalog_overview')!;
    const result = await handler({});
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].content.text).toContain('get_product_totals');
  });
});
