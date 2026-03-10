import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { wooApi } from '../services/woo-client.js';
import { handleListRequest, handleRequest, resolveFields } from '../services/base.js';

const COUPON_LIST_FIELDS = ['id', 'code', 'discount_type', 'amount', 'usage_count', 'date_expires'];
const COUPON_FIELDS = [
  ...COUPON_LIST_FIELDS,
  'individual_use',
  'product_ids',
  'excluded_product_ids',
  'usage_limit',
  'usage_limit_per_user',
  'minimum_amount',
  'maximum_amount',
  'free_shipping',
];

export function registerCouponTools(server: McpServer) {
  server.registerTool(
    'list_coupons',
    {
      description:
        'List discount coupons. Shows code, type (percent/fixed_cart/fixed_product), amount, and usage stats. Use fields param to request only needed fields.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        search: z.string().optional().describe('Search term'),
        per_page: z
          .number()
          .min(1)
          .max(100)
          .optional()
          .default(20)
          .describe('Items per page (max 100)'),
        page: z.number().min(1).optional().default(1).describe('Page number'),
        fields: z
          .string()
          .optional()
          .describe(
            'Comma-separated fields to return (default: id,code,discount_type,amount,usage_count,date_expires)'
          ),
      },
    },
    async ({ fields, per_page, page, ...filters }) => {
      const f = resolveFields(fields, COUPON_LIST_FIELDS);
      return await handleListRequest(
        wooApi.get('coupons', { per_page, page, _fields: f.join(','), ...filters }),
        page,
        per_page,
        f
      );
    }
  );

  server.registerTool(
    'get_coupon',
    {
      description:
        'Get full coupon details including usage limits, product restrictions, and expiry date. Use fields param to request only needed fields.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Coupon ID'),
        fields: z
          .string()
          .optional()
          .describe(
            'Comma-separated fields to return (default: id,code,discount_type,amount,usage_count,date_expires,individual_use,product_ids,excluded_product_ids,usage_limit,usage_limit_per_user,minimum_amount,maximum_amount,free_shipping)'
          ),
      },
    },
    async ({ id, fields }) => {
      const f = resolveFields(fields, COUPON_FIELDS);
      return await handleRequest(wooApi.get(`coupons/${id}`, { _fields: f.join(',') }), f);
    }
  );

  server.registerTool(
    'create_coupon',
    {
      description:
        'Create a discount coupon. Code must be unique. Supports percent, fixed cart, and fixed product discount types. Use fields param to request only needed fields.',
      annotations: { openWorldHint: false },
      inputSchema: {
        code: z.string().describe('Coupon code'),
        discount_type: z
          .enum(['percent', 'fixed_cart', 'fixed_product'])
          .optional()
          .default('percent')
          .describe('Discount type'),
        amount: z.string().optional().describe('Discount amount'),
        individual_use: z.boolean().optional().describe('Cannot be combined with other coupons'),
        product_ids: z.array(z.number()).optional().describe('Product IDs this coupon applies to'),
        excluded_product_ids: z
          .array(z.number())
          .optional()
          .describe('Product IDs excluded from this coupon'),
        usage_limit: z.number().optional().describe('Total usage limit'),
        usage_limit_per_user: z.number().optional().describe('Usage limit per user'),
        date_expires: z.string().optional().describe('Expiry date (ISO 8601)'),
        minimum_amount: z.string().optional().describe('Minimum order amount'),
        maximum_amount: z.string().optional().describe('Maximum order amount'),
        free_shipping: z.boolean().optional().describe('Grants free shipping'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ fields, ...params }) => {
      const f = resolveFields(fields, COUPON_FIELDS);
      return await handleRequest(wooApi.post('coupons', params), f);
    }
  );

  server.registerTool(
    'update_coupon',
    {
      description:
        "Update a coupon's code, amount, restrictions, or expiry. Only include fields you want to change. Use fields param to request only needed fields.",
      annotations: { idempotentHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Coupon ID'),
        code: z.string().optional().describe('Coupon code'),
        discount_type: z
          .enum(['percent', 'fixed_cart', 'fixed_product'])
          .optional()
          .describe('Discount type'),
        amount: z.string().optional().describe('Discount amount'),
        individual_use: z.boolean().optional().describe('Cannot be combined with other coupons'),
        product_ids: z.array(z.number()).optional().describe('Product IDs this coupon applies to'),
        excluded_product_ids: z
          .array(z.number())
          .optional()
          .describe('Product IDs excluded from this coupon'),
        usage_limit: z.number().optional().describe('Total usage limit'),
        usage_limit_per_user: z.number().optional().describe('Usage limit per user'),
        date_expires: z.string().optional().describe('Expiry date (ISO 8601)'),
        minimum_amount: z.string().optional().describe('Minimum order amount'),
        maximum_amount: z.string().optional().describe('Maximum order amount'),
        free_shipping: z.boolean().optional().describe('Grants free shipping'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ id, fields, ...data }) => {
      const f = resolveFields(fields, COUPON_FIELDS);
      return await handleRequest(wooApi.put(`coupons/${id}`, data), f);
    }
  );

  server.registerTool(
    'delete_coupon',
    {
      description:
        'Delete a coupon. Moves to trash by default; set force=true to permanently delete.',
      annotations: { destructiveHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Coupon ID'),
        force: z.boolean().optional().default(false).describe('True to permanently delete'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ id, force, fields }) => {
      const f = resolveFields(fields, COUPON_FIELDS);
      return await handleRequest(wooApi.delete(`coupons/${id}`, { force }), f);
    }
  );
}
