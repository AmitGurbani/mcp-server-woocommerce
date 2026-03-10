import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { wooApi } from '../services/woo-client.js';
import { handleRequest, resolveFields } from '../services/base.js';

const SALES_REPORT_FIELDS = [
  'total_sales',
  'net_sales',
  'average_sales',
  'total_orders',
  'total_items',
  'total_tax',
  'total_shipping',
  'total_refunds',
  'total_discount',
  'totals_grouped_by',
  'totals',
  'total_customers',
];
const TOP_SELLERS_FIELDS = ['title', 'product_id', 'quantity'];
const TOTALS_FIELDS = ['slug', 'name', 'total'];

export function registerReportTools(server: McpServer) {
  server.registerTool(
    'get_sales_report',
    {
      description:
        'Get sales report for a period. Returns total sales, orders, items, tax, shipping, refunds, and daily/weekly totals breakdown.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        period: z
          .enum(['week', 'month', 'last_month', 'year'])
          .optional()
          .describe('Predefined period'),
        date_min: z.string().optional().describe('Start date (YYYY-MM-DD)'),
        date_max: z.string().optional().describe('End date (YYYY-MM-DD)'),
        fields: z
          .string()
          .optional()
          .describe(
            'Comma-separated fields to return (default: total_sales,net_sales,average_sales,total_orders,total_items,total_tax,total_shipping,total_refunds,total_discount,totals_grouped_by,totals,total_customers)'
          ),
      },
    },
    async ({ fields, ...params }) => {
      const f = resolveFields(fields, SALES_REPORT_FIELDS);
      return await handleRequest(wooApi.get('reports/sales', params), f);
    }
  );

  server.registerTool(
    'get_top_sellers',
    {
      description:
        'Get top-selling products ranked by quantity sold. Filterable by period or date range.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        period: z
          .enum(['week', 'month', 'last_month', 'year'])
          .optional()
          .describe('Predefined period'),
        date_min: z.string().optional().describe('Start date (YYYY-MM-DD)'),
        date_max: z.string().optional().describe('End date (YYYY-MM-DD)'),
        fields: z
          .string()
          .optional()
          .describe('Comma-separated fields to return (default: title,product_id,quantity)'),
      },
    },
    async ({ fields, ...params }) => {
      const f = resolveFields(fields, TOP_SELLERS_FIELDS);
      return await handleRequest(wooApi.get('reports/top_sellers', params), f);
    }
  );

  server.registerTool(
    'get_order_totals',
    {
      description:
        'Get order counts grouped by status (pending, processing, completed, etc.). Useful for a quick store health overview.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        fields: z
          .string()
          .optional()
          .describe('Comma-separated fields to return (default: slug,name,total)'),
      },
    },
    async ({ fields }) => {
      const f = resolveFields(fields, TOTALS_FIELDS);
      return await handleRequest(wooApi.get('reports/orders/totals'), f);
    }
  );

  server.registerTool(
    'get_product_totals',
    {
      description:
        'Get product counts grouped by status (publish, draft, pending, private). Quick catalog size overview.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        fields: z
          .string()
          .optional()
          .describe('Comma-separated fields to return (default: slug,name,total)'),
      },
    },
    async ({ fields }) => {
      const f = resolveFields(fields, TOTALS_FIELDS);
      return await handleRequest(wooApi.get('reports/products/totals'), f);
    }
  );

  server.registerTool(
    'get_customer_totals',
    {
      description:
        'Get customer counts grouped by WordPress role. Shows total registered customers and their roles.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        fields: z
          .string()
          .optional()
          .describe('Comma-separated fields to return (default: slug,name,total)'),
      },
    },
    async ({ fields }) => {
      const f = resolveFields(fields, TOTALS_FIELDS);
      return await handleRequest(wooApi.get('reports/customers/totals'), f);
    }
  );
}
