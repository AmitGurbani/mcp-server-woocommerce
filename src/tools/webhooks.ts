import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { wooApi } from '../services/woo-client.js';
import { handleListRequest, handleRequest, resolveFields } from '../services/base.js';

const WEBHOOK_LIST_FIELDS = ['id', 'name', 'status', 'topic', 'delivery_url', 'date_created'];
const WEBHOOK_FIELDS = [
  ...WEBHOOK_LIST_FIELDS,
  'secret',
  'date_modified',
  'api_version',
  'resource',
  'event',
];

const webhookStatusEnum = z.enum(['active', 'paused', 'disabled']);

export function registerWebhookTools(server: McpServer) {
  server.registerTool(
    'list_webhooks',
    {
      description:
        'List webhooks. Webhooks send POST requests to a URL when store events occur (e.g. order.created, product.updated).',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        status: webhookStatusEnum.optional().describe('Filter by webhook status'),
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
            'Comma-separated fields to return (default: id,name,status,topic,delivery_url,date_created)'
          ),
      },
    },
    async ({ fields, per_page, page, ...filters }) => {
      const f = resolveFields(fields, WEBHOOK_LIST_FIELDS);
      return await handleListRequest(
        wooApi.get('webhooks', { per_page, page, _fields: f.join(','), ...filters }),
        page,
        per_page,
        f
      );
    }
  );

  server.registerTool(
    'get_webhook',
    {
      description: 'Get full details of a webhook by ID including secret and API version.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Webhook ID'),
        fields: z
          .string()
          .optional()
          .describe(
            'Comma-separated fields to return (default: id,name,status,topic,delivery_url,date_created,secret,date_modified,api_version,resource,event)'
          ),
      },
    },
    async ({ id, fields }) => {
      const f = resolveFields(fields, WEBHOOK_FIELDS);
      return await handleRequest(wooApi.get(`webhooks/${id}`, { _fields: f.join(',') }), f);
    }
  );

  server.registerTool(
    'create_webhook',
    {
      description:
        "Create a webhook. Topic format: 'resource.event' (e.g. 'order.created', 'product.updated', 'coupon.deleted'). Resources: order, product, customer, coupon. Events: created, updated, deleted, restored.",
      annotations: { openWorldHint: false },
      inputSchema: {
        name: z.string().describe('Webhook name (for identification)'),
        topic: z
          .string()
          .describe("Event topic (e.g. 'order.created', 'product.updated', 'customer.deleted')"),
        delivery_url: z.string().describe('URL to receive the webhook POST payload'),
        secret: z.string().optional().describe('Secret key for HMAC-SHA256 signature verification'),
        status: webhookStatusEnum.optional().default('active').describe('Webhook status'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ fields, ...params }) => {
      const f = resolveFields(fields, WEBHOOK_FIELDS);
      return await handleRequest(wooApi.post('webhooks', params), f);
    }
  );

  server.registerTool(
    'update_webhook',
    {
      description:
        'Update a webhook. Use to change delivery URL, topic, status (pause/resume), or secret.',
      annotations: { idempotentHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Webhook ID'),
        name: z.string().optional().describe('Webhook name'),
        topic: z.string().optional().describe('Event topic'),
        delivery_url: z.string().optional().describe('Delivery URL'),
        secret: z.string().optional().describe('Secret key'),
        status: webhookStatusEnum.optional().describe('Webhook status'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ id, fields, ...data }) => {
      const f = resolveFields(fields, WEBHOOK_FIELDS);
      return await handleRequest(wooApi.put(`webhooks/${id}`, data), f);
    }
  );

  server.registerTool(
    'delete_webhook',
    {
      description: 'Delete a webhook. Set force=true to permanently delete.',
      annotations: { destructiveHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Webhook ID'),
        force: z.boolean().optional().default(true).describe('True to permanently delete'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ id, force, fields }) => {
      const f = resolveFields(fields, WEBHOOK_FIELDS);
      return await handleRequest(wooApi.delete(`webhooks/${id}`, { force }), f);
    }
  );
}
