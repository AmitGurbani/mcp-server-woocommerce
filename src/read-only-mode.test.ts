import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock both API clients to prevent env var checks and network calls
vi.mock('./services/woo-client.js', () => ({
  wooApi: {
    get: vi.fn().mockResolvedValue({
      data: [],
      headers: { 'x-wp-total': '0', 'x-wp-totalpages': '1' },
    }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock('./services/wp-client.js', () => ({
  wpApi: {
    get: vi.fn().mockResolvedValue({
      data: [],
      headers: { 'x-wp-total': '0', 'x-wp-totalpages': '1' },
    }),
    delete: vi.fn().mockResolvedValue({ data: {}, headers: {} }),
  },
}));

describe('Read-only mode', () => {
  const originalEnv = process.env.WOOCOMMERCE_MCP_READ_ONLY;

  afterEach(() => {
    // Restore original env
    if (originalEnv === undefined) {
      delete process.env.WOOCOMMERCE_MCP_READ_ONLY;
    } else {
      process.env.WOOCOMMERCE_MCP_READ_ONLY = originalEnv;
    }
    vi.resetModules();
  });

  describe('when WOOCOMMERCE_MCP_READ_ONLY=true', () => {
    let registeredTools: Map<string, { config: Record<string, any>; handler: Function }>;

    beforeEach(async () => {
      vi.resetModules();
      process.env.WOOCOMMERCE_MCP_READ_ONLY = 'true';

      registeredTools = new Map();

      // Import McpServer fresh so we can spy on registerTool
      const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');

      // Patch McpServer prototype to capture registrations
      const originalRegisterTool = McpServer.prototype.registerTool;
      vi.spyOn(McpServer.prototype, 'registerTool').mockImplementation(function (
        this: any,
        ...args: any[]
      ) {
        const [name, config, handler] = args;
        registeredTools.set(name, { config, handler });
      } as any);

      // Import createServer — it will pick up WOOCOMMERCE_MCP_READ_ONLY=true
      const { createServer } = await import('./server.js');
      createServer();

      // Restore prototype so we don't leak
      McpServer.prototype.registerTool = originalRegisterTool;
    });

    it('read-only tools (readOnlyHint: true) retain their real handlers', async () => {
      // list_products has readOnlyHint: true
      const listProducts = registeredTools.get('list_products');
      expect(listProducts).toBeDefined();
      expect(listProducts!.config.annotations?.readOnlyHint).toBe(true);

      // The handler should be the real one (not the blocking wrapper)
      // Real handlers are async functions; call it and verify it does NOT return the blocking error
      const result = await listProducts!.handler({ per_page: 1, page: 1 });
      // Real handler returns content from handleListRequest, not the blocking message
      const text = result?.content?.[0]?.text ?? '';
      expect(text).not.toContain('[READ-ONLY MODE]');
    });

    it('non-read-only tools have their handlers replaced with blocking error', async () => {
      // create_product does NOT have readOnlyHint: true
      const createProduct = registeredTools.get('create_product');
      expect(createProduct).toBeDefined();
      expect(createProduct!.config.annotations?.readOnlyHint).not.toBe(true);

      // The handler should be replaced — call it and verify it returns the blocking error
      const result = await createProduct!.handler({
        name: 'Test Product',
      });
      expect(result).toBeDefined();
      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('[READ-ONLY MODE]');
    });

    it('delete tools are blocked in read-only mode', async () => {
      const deleteProduct = registeredTools.get('delete_product');
      expect(deleteProduct).toBeDefined();

      const result = await deleteProduct!.handler({ id: 1 });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('[READ-ONLY MODE]');
    });

    it('update tools are blocked in read-only mode', async () => {
      const updateProduct = registeredTools.get('update_product');
      expect(updateProduct).toBeDefined();

      const result = await updateProduct!.handler({ id: 1, name: 'Test' });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('[READ-ONLY MODE]');
    });

    it('multiple read-only tools all retain real handlers', async () => {
      const readOnlyToolNames = [
        'list_products',
        'get_product',
        'list_categories',
        'get_category',
        'list_orders',
        'get_order',
        'list_customers',
        'get_customer',
      ];

      for (const name of readOnlyToolNames) {
        const tool = registeredTools.get(name);
        expect(tool, `${name} should be registered`).toBeDefined();
        expect(
          tool!.config.annotations?.readOnlyHint,
          `${name} should have readOnlyHint: true`
        ).toBe(true);

        const result = await tool!.handler(
          name.startsWith('list_') ? { per_page: 1, page: 1 } : { id: 1 }
        );
        const text = result?.content?.[0]?.text ?? '';
        expect(text, `${name} should not be blocked`).not.toContain('[READ-ONLY MODE]');
      }
    });

    it('multiple write tools are all blocked', async () => {
      const writeToolNames = [
        'create_product',
        'update_product',
        'delete_product',
        'create_category',
        'update_category',
        'delete_category',
        'create_order',
        'update_order',
      ];

      for (const name of writeToolNames) {
        const tool = registeredTools.get(name);
        expect(tool, `${name} should be registered`).toBeDefined();
        expect(
          tool!.config.annotations?.readOnlyHint,
          `${name} should NOT have readOnlyHint: true`
        ).not.toBe(true);

        const result = await tool!.handler({ id: 1, name: 'test' });
        expect(result.isError, `${name} should be blocked`).toBe(true);
        expect(result.content[0].text, `${name} should show read-only message`).toContain(
          '[READ-ONLY MODE]'
        );
      }
    });
  });

  describe('when WOOCOMMERCE_MCP_READ_ONLY is not set', () => {
    let registeredTools: Map<string, { config: Record<string, any>; handler: Function }>;

    beforeEach(async () => {
      vi.resetModules();
      delete process.env.WOOCOMMERCE_MCP_READ_ONLY;

      registeredTools = new Map();

      const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');

      const originalRegisterTool = McpServer.prototype.registerTool;
      vi.spyOn(McpServer.prototype, 'registerTool').mockImplementation(function (
        this: any,
        ...args: any[]
      ) {
        const [name, config, handler] = args;
        registeredTools.set(name, { config, handler });
      } as any);

      const { createServer } = await import('./server.js');
      createServer();

      McpServer.prototype.registerTool = originalRegisterTool;
    });

    it('write tools retain their real handlers (not blocked)', async () => {
      const createProduct = registeredTools.get('create_product');
      expect(createProduct).toBeDefined();

      const result = await createProduct!.handler({ name: 'Test Product' });
      // Real handler talks to the mock wooApi, should NOT return blocking error
      const text = result?.content?.[0]?.text ?? '';
      expect(text).not.toContain('[READ-ONLY MODE]');
    });

    it('read-only tools also retain their real handlers', async () => {
      const listProducts = registeredTools.get('list_products');
      expect(listProducts).toBeDefined();

      const result = await listProducts!.handler({ per_page: 1, page: 1 });
      const text = result?.content?.[0]?.text ?? '';
      expect(text).not.toContain('[READ-ONLY MODE]');
    });
  });

  describe('when WOOCOMMERCE_MCP_READ_ONLY is set to a non-true value', () => {
    let registeredTools: Map<string, { config: Record<string, any>; handler: Function }>;

    beforeEach(async () => {
      vi.resetModules();
      process.env.WOOCOMMERCE_MCP_READ_ONLY = 'false';

      registeredTools = new Map();

      const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');

      const originalRegisterTool = McpServer.prototype.registerTool;
      vi.spyOn(McpServer.prototype, 'registerTool').mockImplementation(function (
        this: any,
        ...args: any[]
      ) {
        const [name, config, handler] = args;
        registeredTools.set(name, { config, handler });
      } as any);

      const { createServer } = await import('./server.js');
      createServer();

      McpServer.prototype.registerTool = originalRegisterTool;
    });

    it('write tools are NOT blocked when value is "false"', async () => {
      const createProduct = registeredTools.get('create_product');
      expect(createProduct).toBeDefined();

      const result = await createProduct!.handler({ name: 'Test Product' });
      const text = result?.content?.[0]?.text ?? '';
      expect(text).not.toContain('[READ-ONLY MODE]');
    });

    it('delete tools are NOT blocked when value is "false"', async () => {
      const deleteProduct = registeredTools.get('delete_product');
      expect(deleteProduct).toBeDefined();

      const result = await deleteProduct!.handler({ id: 1, force: true });
      const text = result?.content?.[0]?.text ?? '';
      expect(text).not.toContain('[READ-ONLY MODE]');
    });
  });
});
