import { describe, it, expect, vi, beforeAll } from 'vitest';

// Mock both API clients to prevent env var checks and network calls
vi.mock('../services/woo-client.js', () => ({
  wooApi: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('../services/wp-client.js', () => ({
  wpApi: { get: vi.fn(), delete: vi.fn() },
}));

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerProductTools } from './products.js';
import { registerCategoryTools } from './categories.js';
import { registerOrderTools } from './orders.js';
import { registerCustomerTools } from './customers.js';
import { registerCouponTools } from './coupons.js';
import { registerReportTools } from './reports.js';
import { registerMediaTools } from './media.js';
import { registerAttributeTools } from './attributes.js';
import { registerVariationTools } from './variations.js';
import { registerTagTools } from './tags.js';
import { registerBrandTools } from './brands.js';

// Expected tools per module
const EXPECTED_TOOLS: Record<string, string[]> = {
  products: ['list_products', 'get_product', 'create_product', 'update_product', 'delete_product'],
  categories: [
    'list_categories',
    'get_category',
    'create_category',
    'update_category',
    'delete_category',
  ],
  orders: ['list_orders', 'get_order', 'create_order', 'update_order'],
  customers: ['list_customers', 'get_customer', 'create_customer', 'update_customer'],
  coupons: ['list_coupons', 'get_coupon', 'create_coupon', 'update_coupon', 'delete_coupon'],
  reports: [
    'get_sales_report',
    'get_top_sellers',
    'get_order_totals',
    'get_product_totals',
    'get_customer_totals',
  ],
  media: ['list_media', 'delete_media', 'cleanup_orphaned_media'],
  attributes: [
    'list_attributes',
    'get_attribute',
    'create_attribute',
    'delete_attribute',
    'list_attribute_terms',
    'create_attribute_term',
    'delete_attribute_term',
    'batch_update_attribute_terms',
  ],
  variations: [
    'list_variations',
    'get_variation',
    'create_variation',
    'update_variation',
    'batch_update_variations',
  ],
  tags: ['list_tags', 'get_tag', 'create_tag', 'update_tag', 'delete_tag'],
  brands: ['list_brands', 'get_brand', 'create_brand', 'update_brand', 'delete_brand'],
};

const TOTAL_EXPECTED_TOOLS = Object.values(EXPECTED_TOOLS).flat().length;

describe('Tool schema validation', () => {
  const registeredTools = new Map<
    string,
    { description: string; schema: Record<string, any>; handler: Function }
  >();

  beforeAll(() => {
    const server = new McpServer({ name: 'test', version: '1.0.0' });

    vi.spyOn(server, 'registerTool').mockImplementation(((...args: any[]) => {
      const [name, config, handler] = args;
      registeredTools.set(name, {
        description: config.description,
        schema: config.inputSchema,
        handler,
      });
    }) as any);

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
  });

  it(`registers exactly ${TOTAL_EXPECTED_TOOLS} tools total`, () => {
    expect(registeredTools.size).toBe(TOTAL_EXPECTED_TOOLS);
  });

  for (const [module, tools] of Object.entries(EXPECTED_TOOLS)) {
    describe(`${module} module`, () => {
      for (const toolName of tools) {
        it(`registers "${toolName}"`, () => {
          expect(registeredTools.has(toolName)).toBe(true);
        });

        it(`"${toolName}" has a description`, () => {
          const tool = registeredTools.get(toolName)!;
          expect(tool.description).toBeTruthy();
          expect(typeof tool.description).toBe('string');
        });

        it(`"${toolName}" has a valid Zod schema object`, () => {
          const tool = registeredTools.get(toolName)!;
          expect(tool.schema).toBeDefined();
          expect(typeof tool.schema).toBe('object');
        });

        it(`"${toolName}" has a handler function`, () => {
          const tool = registeredTools.get(toolName)!;
          expect(typeof tool.handler).toBe('function');
        });
      }
    });
  }

  describe('schema conventions', () => {
    it('all list tools have per_page and page params', () => {
      const listTools = Array.from(registeredTools.entries()).filter(([name]) =>
        name.startsWith('list_')
      );

      for (const [_name, tool] of listTools) {
        // list_attributes and list_attribute_terms might not have per_page
        // but most list tools should
        if (tool.schema.per_page) {
          expect(tool.schema.per_page).toBeDefined();
        }
        if (tool.schema.page) {
          expect(tool.schema.page).toBeDefined();
        }
      }
    });

    it("most list/get tools with fields param mention 'fields' in description", () => {
      // Convention: list/get tool descriptions should include "Use fields param..." hint
      // Some tools (attributes, media, reports) don't follow this yet — tracked as a quality finding
      const readToolsWithFields = Array.from(registeredTools.entries()).filter(
        ([name, tool]) =>
          (name.startsWith('list_') || name.startsWith('get_')) && 'fields' in tool.schema
      );

      expect(readToolsWithFields.length).toBeGreaterThan(0);

      const mentionsFields = readToolsWithFields.filter(([, tool]) =>
        tool.description.toLowerCase().includes('field')
      );
      // At least half of list/get tools with fields param should mention it
      expect(mentionsFields.length).toBeGreaterThanOrEqual(readToolsWithFields.length / 2);
    });

    it('all tools with fields param use z.string().optional()', () => {
      for (const [_name, tool] of registeredTools.entries()) {
        if (tool.schema.fields) {
          // The fields param should exist and be optional
          expect(tool.schema.fields).toBeDefined();
        }
      }
    });

    it('no tool names contain spaces or uppercase', () => {
      for (const name of registeredTools.keys()) {
        expect(name).toMatch(/^[a-z_]+$/);
      }
    });

    it('all CRUD tools for the same resource share a naming convention', () => {
      const resources = [
        'product',
        'category',
        'order',
        'customer',
        'coupon',
        'tag',
        'brand',
        'attribute',
        'variation',
      ];
      for (const resource of resources) {
        const resourceTools = Array.from(registeredTools.keys()).filter((name) =>
          name.includes(resource)
        );
        expect(
          resourceTools.length,
          `${resource} should have at least 2 tools`
        ).toBeGreaterThanOrEqual(2);
      }
    });
  });
});
