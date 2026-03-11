import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { wooApi } from '../services/woo-client.js';
import { handleRequest, resolveFields } from '../services/base.js';

const ORDER_NOTE_LIST_FIELDS = ['id', 'author', 'date_created', 'note', 'customer_note'];
const ORDER_NOTE_FIELDS = [...ORDER_NOTE_LIST_FIELDS];

export function registerOrderNoteTools(server: McpServer) {
  server.registerTool(
    'list_order_notes',
    {
      description:
        'List all notes for an order. Includes both private admin notes and customer-visible notes. Use fields param to request only needed fields.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        order_id: z.number().describe('Order ID'),
        fields: z
          .string()
          .optional()
          .describe(
            'Comma-separated fields to return (default: id,author,date_created,note,customer_note)'
          ),
      },
    },
    async ({ order_id, fields }) => {
      const f = resolveFields(fields, ORDER_NOTE_LIST_FIELDS);
      return await handleRequest(
        wooApi.get(`orders/${order_id}/notes`, { _fields: f.join(',') }),
        f
      );
    }
  );

  server.registerTool(
    'create_order_note',
    {
      description:
        'Add a note to an order. Set customer_note=true to send an email notification to the customer with the note content. Default is a private admin note.',
      annotations: { openWorldHint: false },
      inputSchema: {
        order_id: z.number().describe('Order ID'),
        note: z.string().describe('Note content'),
        customer_note: z
          .boolean()
          .optional()
          .default(false)
          .describe('If true, sends email notification to customer (default: false)'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ order_id, fields, ...data }) => {
      const f = resolveFields(fields, ORDER_NOTE_FIELDS);
      return await handleRequest(wooApi.post(`orders/${order_id}/notes`, data), f);
    }
  );

  server.registerTool(
    'delete_order_note',
    {
      description: 'Delete a note from an order. This permanently removes the note.',
      annotations: { destructiveHint: true, openWorldHint: false },
      inputSchema: {
        order_id: z.number().describe('Order ID'),
        id: z.number().describe('Note ID'),
        force: z
          .boolean()
          .optional()
          .default(true)
          .describe('Must be true to permanently delete the note'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ order_id, id, force, fields }) => {
      const f = resolveFields(fields, ORDER_NOTE_FIELDS);
      return await handleRequest(
        wooApi.delete(`orders/${order_id}/notes/${id}`, { force }),
        f
      );
    }
  );
}
