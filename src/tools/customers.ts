import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { wooApi } from '../services/woo-client.js';
import { handleListRequest, handleRequest, resolveFields } from '../services/base.js';

const CUSTOMER_LIST_FIELDS = [
  'id',
  'email',
  'first_name',
  'last_name',
  'username',
  'billing',
  'orders_count',
  'total_spent',
];
const CUSTOMER_FIELDS = [...CUSTOMER_LIST_FIELDS, 'shipping'];

const addressSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  company: z.string().optional(),
  address_1: z.string().optional(),
  address_2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
});

export function registerCustomerTools(server: McpServer) {
  server.registerTool(
    'list_customers',
    {
      description:
        'Search and filter customers by name, email, or role. Returns order count and total spent per customer. Use fields param to request only needed fields.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        search: z.string().optional().describe('Search term (name, email)'),
        role: z
          .enum([
            'all',
            'administrator',
            'editor',
            'author',
            'contributor',
            'subscriber',
            'customer',
          ])
          .optional()
          .describe('Filter by role'),
        orderby: z
          .enum(['id', 'include', 'name', 'registered_date'])
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
            'Comma-separated fields to return (default: id,email,first_name,last_name,username,billing,orders_count,total_spent)'
          ),
      },
    },
    async ({ fields, per_page, page, ...filters }) => {
      const f = resolveFields(fields, CUSTOMER_LIST_FIELDS);
      return await handleListRequest(
        wooApi.get('customers', { per_page, page, _fields: f.join(','), ...filters }),
        page,
        per_page,
        f
      );
    }
  );

  server.registerTool(
    'get_customer',
    {
      description:
        'Get full customer details including billing and shipping addresses, order history stats. Use fields param to request only needed fields.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Customer ID'),
        fields: z
          .string()
          .optional()
          .describe(
            'Comma-separated fields to return (default: id,email,first_name,last_name,username,billing,orders_count,total_spent,shipping)'
          ),
      },
    },
    async ({ id, fields }) => {
      const f = resolveFields(fields, CUSTOMER_FIELDS);
      return await handleRequest(wooApi.get(`customers/${id}`, { _fields: f.join(',') }), f);
    }
  );

  server.registerTool(
    'create_customer',
    {
      description:
        'Create a new customer account. Email is required and must be unique. Use fields param to request only needed fields.',
      annotations: { openWorldHint: false },
      inputSchema: {
        email: z.string().describe('Customer email'),
        first_name: z.string().optional().describe('First name'),
        last_name: z.string().optional().describe('Last name'),
        username: z.string().optional().describe('Username'),
        billing: addressSchema.optional().describe('Billing address'),
        shipping: addressSchema.optional().describe('Shipping address'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ fields, ...params }) => {
      const f = resolveFields(fields, CUSTOMER_FIELDS);
      return await handleRequest(wooApi.post('customers', params), f);
    }
  );

  server.registerTool(
    'update_customer',
    {
      description:
        'Update customer details such as name, email, or addresses. Only include fields you want to change. Use fields param to request only needed fields.',
      annotations: { idempotentHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Customer ID'),
        email: z.string().optional().describe('Customer email'),
        first_name: z.string().optional().describe('First name'),
        last_name: z.string().optional().describe('Last name'),
        billing: addressSchema.optional().describe('Billing address'),
        shipping: addressSchema.optional().describe('Shipping address'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ id, fields, ...data }) => {
      const f = resolveFields(fields, CUSTOMER_FIELDS);
      return await handleRequest(wooApi.put(`customers/${id}`, data), f);
    }
  );
}
