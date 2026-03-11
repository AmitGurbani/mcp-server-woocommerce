import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { wooApi } from '../services/woo-client.js';
import { handleRequest, resolveFields } from '../services/base.js';

const PAYMENT_GATEWAY_LIST_FIELDS = ['id', 'title', 'description', 'enabled', 'method_title'];
const PAYMENT_GATEWAY_FIELDS = [
  ...PAYMENT_GATEWAY_LIST_FIELDS,
  'method_description',
  'method_supports',
  'settings',
  'order',
];

export function registerPaymentGatewayTools(server: McpServer) {
  server.registerTool(
    'list_payment_gateways',
    {
      description:
        'List all available payment gateways. Gateways are provided by plugins and cannot be created or deleted via API.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        fields: z
          .string()
          .optional()
          .describe(
            'Comma-separated fields to return (default: id,title,description,enabled,method_title)'
          ),
      },
    },
    async ({ fields }) => {
      const f = resolveFields(fields, PAYMENT_GATEWAY_LIST_FIELDS);
      return await handleRequest(
        wooApi.get('payment_gateways', { _fields: f.join(',') }),
        f
      );
    }
  );

  server.registerTool(
    'get_payment_gateway',
    {
      description:
        'Get full details of a payment gateway by ID. Common IDs: bacs (bank transfer), cheque, cod (cash on delivery), paypal, stripe, razorpay.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        id: z.string().describe('Gateway ID (e.g. cod, bacs, stripe, razorpay)'),
        fields: z
          .string()
          .optional()
          .describe(
            'Comma-separated fields to return (default: id,title,description,enabled,method_title,method_description,method_supports,settings,order)'
          ),
      },
    },
    async ({ id, fields }) => {
      const f = resolveFields(fields, PAYMENT_GATEWAY_FIELDS);
      return await handleRequest(
        wooApi.get(`payment_gateways/${id}`, { _fields: f.join(',') }),
        f
      );
    }
  );

  server.registerTool(
    'update_payment_gateway',
    {
      description:
        'Update a payment gateway. Use to enable/disable gateways, change titles, or modify settings. Gateways cannot be created or deleted — they come from plugins.',
      annotations: { idempotentHint: true, openWorldHint: false },
      inputSchema: {
        id: z.string().describe('Gateway ID (e.g. cod, bacs, stripe, razorpay)'),
        title: z.string().optional().describe('Gateway display title'),
        description: z.string().optional().describe('Gateway description shown at checkout'),
        enabled: z.boolean().optional().describe('Enable or disable the gateway'),
        order: z.number().optional().describe('Sort order for gateway display'),
        settings: z
          .record(z.string(), z.string())
          .optional()
          .describe('Gateway-specific settings as key-value pairs'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ id, fields, ...data }) => {
      const f = resolveFields(fields, PAYMENT_GATEWAY_FIELDS);
      return await handleRequest(wooApi.put(`payment_gateways/${id}`, data), f);
    }
  );
}
