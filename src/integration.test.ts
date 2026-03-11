import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// Mock both API clients before any imports
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

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerProductTools } from './tools/products.js';
import { registerCategoryTools } from './tools/categories.js';
import { registerOrderTools } from './tools/orders.js';
import { registerCustomerTools } from './tools/customers.js';
import { registerCouponTools } from './tools/coupons.js';
import { registerReportTools } from './tools/reports.js';
import { registerMediaTools } from './tools/media.js';
import { registerAttributeTools } from './tools/attributes.js';
import { registerVariationTools } from './tools/variations.js';
import { registerTagTools } from './tools/tags.js';
import { registerBrandTools } from './tools/brands.js';
import { registerShippingTools } from './tools/shipping.js';
import { registerTaxTools } from './tools/taxes.js';
import { registerWebhookTools } from './tools/webhooks.js';
import { registerSettingsTools } from './tools/settings.js';
import { registerRefundTools } from './tools/refunds.js';
import { registerOrderNoteTools } from './tools/order-notes.js';
import { registerPaymentGatewayTools } from './tools/payment-gateways.js';
import { registerReviewTools } from './tools/reviews.js';
import { registerSystemStatusTools } from './tools/system-status.js';
import { registerDataTools } from './tools/data.js';

describe('Integration: all tools register and respond via MCP transport', () => {
  let client: Client;
  let server: McpServer;
  let clientTransport: InMemoryTransport;
  let serverTransport: InMemoryTransport;

  beforeAll(async () => {
    server = new McpServer({ name: 'test-server', version: '1.0.0' });
    registerProductTools(server);
    registerCategoryTools(server);
    registerOrderTools(server);
    registerCustomerTools(server);
    registerCouponTools(server);
    registerReportTools(server);
    registerMediaTools(server);
    registerAttributeTools(server);
    registerVariationTools(server);
    registerTagTools(server);
    registerBrandTools(server);
    registerShippingTools(server);
    registerTaxTools(server);
    registerWebhookTools(server);
    registerSettingsTools(server);
    registerRefundTools(server);
    registerOrderNoteTools(server);
    registerPaymentGatewayTools(server);
    registerReviewTools(server);
    registerSystemStatusTools(server);
    registerDataTools(server);

    [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    client = new Client({ name: 'test-client', version: '1.0.0' });

    await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
  });

  afterAll(async () => {
    await client.close();
    await server.close();
  });

  it('lists all registered tools', async () => {
    const { tools } = await client.listTools();
    expect(tools.length).toBeGreaterThanOrEqual(100);

    const toolNames = tools.map((t) => t.name);
    // Spot-check one tool from each module
    expect(toolNames).toContain('list_products');
    expect(toolNames).toContain('list_categories');
    expect(toolNames).toContain('list_orders');
    expect(toolNames).toContain('list_customers');
    expect(toolNames).toContain('list_coupons');
    expect(toolNames).toContain('get_sales_report');
    expect(toolNames).toContain('list_media');
    expect(toolNames).toContain('list_attributes');
    expect(toolNames).toContain('list_variations');
    expect(toolNames).toContain('list_tags');
    expect(toolNames).toContain('list_brands');
    expect(toolNames).toContain('list_shipping_zones');
    expect(toolNames).toContain('list_tax_classes');
    expect(toolNames).toContain('list_webhooks');
    expect(toolNames).toContain('list_setting_groups');
    expect(toolNames).toContain('list_order_refunds');
    expect(toolNames).toContain('list_order_notes');
    expect(toolNames).toContain('list_payment_gateways');
    expect(toolNames).toContain('list_product_reviews');
    expect(toolNames).toContain('get_system_status');
    expect(toolNames).toContain('list_countries');
  });

  it('can call list_products tool', async () => {
    const result = await client.callTool({
      name: 'list_products',
      arguments: { per_page: 5, page: 1 },
    });

    expect(result.content).toBeDefined();
    expect(Array.isArray(result.content)).toBe(true);
    const textContent = result.content[0] as { type: string; text: string };
    expect(textContent.type).toBe('text');
    const parsed = JSON.parse(textContent.text);
    expect(parsed.pagination).toBeDefined();
  });

  it('can call list_categories tool', async () => {
    const result = await client.callTool({
      name: 'list_categories',
      arguments: { per_page: 5, page: 1 },
    });

    expect(result.content).toBeDefined();
    const textContent = result.content[0] as { type: string; text: string };
    const parsed = JSON.parse(textContent.text);
    expect(parsed.pagination).toBeDefined();
  });

  it('can call get_sales_report tool', async () => {
    const result = await client.callTool({
      name: 'get_sales_report',
      arguments: { period: 'month' },
    });

    expect(result.content).toBeDefined();
    expect(result.isError).toBeFalsy();
  });

  it('can call list_media tool', async () => {
    const result = await client.callTool({
      name: 'list_media',
      arguments: { per_page: 5, page: 1 },
    });

    expect(result.content).toBeDefined();
    const textContent = result.content[0] as { type: string; text: string };
    const parsed = JSON.parse(textContent.text);
    expect(parsed.pagination).toBeDefined();
  });
});
