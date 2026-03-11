import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { wooApi } from '../services/woo-client.js';
import { handleListRequest, handleRequest, resolveFields } from '../services/base.js';

const REFUND_LIST_FIELDS = ['id', 'date_created', 'amount', 'reason', 'refunded_by'];
const REFUND_FIELDS = [...REFUND_LIST_FIELDS, 'line_items', 'refunded_payment'];

export function registerRefundTools(server: McpServer) {
  server.registerTool(
    'list_order_refunds',
    {
      description:
        'List all refunds for an order. Shows refund amounts, reasons, and who processed them. Use fields param to request only needed fields.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        order_id: z.number().describe('Order ID'),
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
            'Comma-separated fields to return (default: id,date_created,amount,reason,refunded_by)'
          ),
      },
    },
    async ({ order_id, per_page, page, fields }) => {
      const f = resolveFields(fields, REFUND_LIST_FIELDS);
      return await handleListRequest(
        wooApi.get(`orders/${order_id}/refunds`, { per_page, page, _fields: f.join(',') }),
        page,
        per_page,
        f
      );
    }
  );

  server.registerTool(
    'create_order_refund',
    {
      description:
        'Create a refund for an order. Can refund full or partial amount. Set api_refund=true (default) to automatically refund via payment gateway, or false for manual refund.',
      annotations: { openWorldHint: false },
      inputSchema: {
        order_id: z.number().describe('Order ID'),
        amount: z.string().optional().describe('Refund amount (omit to refund full order total)'),
        reason: z.string().optional().describe('Reason for the refund'),
        api_refund: z
          .boolean()
          .optional()
          .default(true)
          .describe('Automatically refund via payment gateway (default: true)'),
        line_items: z
          .array(
            z.object({
              id: z.number().describe('Line item ID from the order'),
              refund_total: z.string().optional().describe('Refund amount for this line item'),
              quantity: z.number().optional().describe('Quantity to refund'),
            })
          )
          .optional()
          .describe('Specific line items to refund'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ order_id, fields, ...data }) => {
      const f = resolveFields(fields, REFUND_FIELDS);
      return await handleRequest(wooApi.post(`orders/${order_id}/refunds`, data), f);
    }
  );

  server.registerTool(
    'delete_order_refund',
    {
      description:
        'Delete a refund record from an order. This removes the refund entry but does not reverse the payment — use with caution.',
      annotations: { destructiveHint: true, openWorldHint: false },
      inputSchema: {
        order_id: z.number().describe('Order ID'),
        id: z.number().describe('Refund ID'),
        force: z
          .boolean()
          .optional()
          .default(true)
          .describe('Must be true to permanently delete the refund'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ order_id, id, force, fields }) => {
      const f = resolveFields(fields, REFUND_FIELDS);
      return await handleRequest(
        wooApi.delete(`orders/${order_id}/refunds/${id}`, { force }),
        f
      );
    }
  );
}
