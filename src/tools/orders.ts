import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { wooApi } from '../services/woo-client.js';
import { handleListRequest, handleRequest, resolveFields } from '../services/base.js';

const ORDER_LIST_FIELDS = [
  'id',
  'number',
  'status',
  'date_created',
  'total',
  'customer_id',
  'billing',
  'line_items',
];
const ORDER_FIELDS = [
  ...ORDER_LIST_FIELDS,
  'subtotal',
  'total_tax',
  'shipping_total',
  'discount_total',
  'shipping',
  'payment_method',
  'payment_method_title',
  'customer_note',
];

const orderStatusEnum = z.enum([
  'any',
  'pending',
  'processing',
  'on-hold',
  'completed',
  'cancelled',
  'refunded',
  'failed',
  'trash',
]);

export function registerOrderTools(server: McpServer) {
  server.registerTool(
    'list_orders',
    {
      description:
        'Search and filter orders. Supports filtering by status, customer, date range, and search term. Use fields param to request only needed fields.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        status: orderStatusEnum.optional().describe('Order status'),
        customer: z.number().optional().describe('Customer ID'),
        after: z.string().optional().describe('Orders after date (ISO 8601)'),
        before: z.string().optional().describe('Orders before date (ISO 8601)'),
        search: z.string().optional().describe('Search term'),
        orderby: z
          .enum(['date', 'id', 'include', 'title', 'slug'])
          .optional()
          .describe('Sort field'),
        order: z.enum(['asc', 'desc']).optional().describe('Sort direction'),
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
            'Comma-separated fields to return (default: id,number,status,date_created,total,customer_id,billing,line_items)'
          ),
      },
    },
    async ({ fields, per_page, page, ...filters }) => {
      const f = resolveFields(fields, ORDER_LIST_FIELDS);
      return await handleListRequest(
        wooApi.get('orders', { per_page, page, _fields: f.join(','), ...filters }),
        page,
        per_page,
        f
      );
    }
  );

  server.registerTool(
    'get_order',
    {
      description:
        'Get full details of a single order including billing, shipping, line items, and payment info. Use fields param to request only needed fields.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Order ID'),
        fields: z
          .string()
          .optional()
          .describe(
            'Comma-separated fields to return (default: id,number,status,date_created,total,customer_id,billing,line_items,subtotal,total_tax,shipping_total,discount_total,shipping,payment_method,payment_method_title,customer_note)'
          ),
      },
    },
    async ({ id, fields }) => {
      const f = resolveFields(fields, ORDER_FIELDS);
      return await handleRequest(wooApi.get(`orders/${id}`, { _fields: f.join(',') }), f);
    }
  );

  server.registerTool(
    'create_order',
    {
      description:
        'Create a new order. Requires line_items with product_id and quantity. Use variation_id for variable product variants.',
      annotations: { openWorldHint: false },
      inputSchema: {
        line_items: z
          .array(
            z.object({
              product_id: z.number().describe('Product ID'),
              quantity: z.number().describe('Quantity'),
              variation_id: z.number().optional().describe('Variation ID'),
            })
          )
          .describe('Order line items'),
        customer_id: z.number().optional().describe('Customer ID (0 for guest)'),
        status: orderStatusEnum.optional().describe('Order status'),
        billing: z
          .object({
            first_name: z.string().optional(),
            last_name: z.string().optional(),
            address_1: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            postcode: z.string().optional(),
            country: z.string().optional(),
            email: z.string().optional(),
            phone: z.string().optional(),
          })
          .optional()
          .describe('Billing address'),
        shipping: z
          .object({
            first_name: z.string().optional(),
            last_name: z.string().optional(),
            address_1: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            postcode: z.string().optional(),
            country: z.string().optional(),
          })
          .optional()
          .describe('Shipping address'),
        payment_method: z.string().optional().describe('Payment method ID'),
        payment_method_title: z.string().optional().describe('Payment method title'),
        set_paid: z.boolean().optional().describe('Mark order as paid'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ fields, ...params }) => {
      const f = resolveFields(fields, ORDER_FIELDS);
      return await handleRequest(wooApi.post('orders', params), f);
    }
  );

  server.registerTool(
    'update_order',
    {
      description:
        'Update an order. Commonly used to change status (e.g. pending -> processing -> completed). See get_order_totals for valid statuses.',
      annotations: { idempotentHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Order ID'),
        status: orderStatusEnum.optional().describe('New order status'),
        billing: z
          .object({
            first_name: z.string().optional(),
            last_name: z.string().optional(),
            address_1: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            postcode: z.string().optional(),
            country: z.string().optional(),
            email: z.string().optional(),
            phone: z.string().optional(),
          })
          .optional()
          .describe('Billing address'),
        shipping: z
          .object({
            first_name: z.string().optional(),
            last_name: z.string().optional(),
            address_1: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            postcode: z.string().optional(),
            country: z.string().optional(),
          })
          .optional()
          .describe('Shipping address'),
        customer_note: z.string().optional().describe('Note for customer'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ id, fields, ...data }) => {
      const f = resolveFields(fields, ORDER_FIELDS);
      return await handleRequest(wooApi.put(`orders/${id}`, data), f);
    }
  );
}
