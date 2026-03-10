import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { wooApi } from '../services/woo-client.js';
import { handleListRequest, handleRequest, resolveFields } from '../services/base.js';

const SHIPPING_ZONE_LIST_FIELDS = ['id', 'name', 'order'];
const SHIPPING_ZONE_FIELDS = [...SHIPPING_ZONE_LIST_FIELDS];

const SHIPPING_ZONE_METHOD_LIST_FIELDS = [
  'instance_id',
  'title',
  'order',
  'enabled',
  'method_id',
  'method_title',
];
const SHIPPING_ZONE_METHOD_FIELDS = [...SHIPPING_ZONE_METHOD_LIST_FIELDS, 'settings'];

const SHIPPING_CLASS_LIST_FIELDS = ['id', 'name', 'slug', 'count'];
const SHIPPING_CLASS_FIELDS = [...SHIPPING_CLASS_LIST_FIELDS, 'description'];

export function registerShippingTools(server: McpServer) {
  server.registerTool(
    'list_shipping_zones',
    {
      description:
        'List all shipping zones. Zones define geographic regions with specific shipping methods and rates.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        fields: z
          .string()
          .optional()
          .describe('Comma-separated fields to return (default: id,name,order)'),
      },
    },
    async ({ fields }) => {
      const f = resolveFields(fields, SHIPPING_ZONE_LIST_FIELDS);
      return await handleRequest(wooApi.get('shipping/zones'), f);
    }
  );

  server.registerTool(
    'get_shipping_zone',
    {
      description: 'Get a shipping zone by ID. Use list_shipping_zones to find zone IDs.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Shipping zone ID'),
        fields: z
          .string()
          .optional()
          .describe('Comma-separated fields to return (default: id,name,order)'),
      },
    },
    async ({ id, fields }) => {
      const f = resolveFields(fields, SHIPPING_ZONE_FIELDS);
      return await handleRequest(wooApi.get(`shipping/zones/${id}`), f);
    }
  );

  server.registerTool(
    'create_shipping_zone',
    {
      description:
        'Create a new shipping zone. After creating, add locations and shipping methods to it.',
      annotations: { openWorldHint: false },
      inputSchema: {
        name: z.string().describe('Zone name'),
        order: z.number().optional().default(0).describe('Zone sort order'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ fields, ...params }) => {
      const f = resolveFields(fields, SHIPPING_ZONE_FIELDS);
      return await handleRequest(wooApi.post('shipping/zones', params), f);
    }
  );

  server.registerTool(
    'update_shipping_zone',
    {
      description: 'Update a shipping zone name or sort order.',
      annotations: { idempotentHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Shipping zone ID'),
        name: z.string().optional().describe('Zone name'),
        order: z.number().optional().describe('Zone sort order'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ id, fields, ...data }) => {
      const f = resolveFields(fields, SHIPPING_ZONE_FIELDS);
      return await handleRequest(wooApi.put(`shipping/zones/${id}`, data), f);
    }
  );

  server.registerTool(
    'delete_shipping_zone',
    {
      description:
        'Delete a shipping zone. This also removes all methods and locations in the zone.',
      annotations: { destructiveHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Shipping zone ID'),
        force: z
          .boolean()
          .optional()
          .default(true)
          .describe('Must be true (shipping zones require force delete)'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ id, force, fields }) => {
      const f = resolveFields(fields, SHIPPING_ZONE_FIELDS);
      return await handleRequest(wooApi.delete(`shipping/zones/${id}`, { force }), f);
    }
  );

  server.registerTool(
    'list_shipping_zone_methods',
    {
      description:
        'List shipping methods for a zone. Methods define how items are shipped (flat rate, free shipping, local pickup).',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        zone_id: z.number().describe('Shipping zone ID'),
        fields: z
          .string()
          .optional()
          .describe(
            'Comma-separated fields to return (default: instance_id,title,order,enabled,method_id,method_title)'
          ),
      },
    },
    async ({ zone_id, fields }) => {
      const f = resolveFields(fields, SHIPPING_ZONE_METHOD_LIST_FIELDS);
      return await handleRequest(wooApi.get(`shipping/zones/${zone_id}/methods`), f);
    }
  );

  server.registerTool(
    'add_shipping_zone_method',
    {
      description:
        "Add a shipping method to a zone. Valid method_id values: 'flat_rate', 'free_shipping', 'local_pickup'. Configure rates via settings after adding.",
      annotations: { openWorldHint: false },
      inputSchema: {
        zone_id: z.number().describe('Shipping zone ID'),
        method_id: z
          .enum(['flat_rate', 'free_shipping', 'local_pickup'])
          .describe('Shipping method type'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ zone_id, fields, ...params }) => {
      const f = resolveFields(fields, SHIPPING_ZONE_METHOD_FIELDS);
      return await handleRequest(wooApi.post(`shipping/zones/${zone_id}/methods`, params), f);
    }
  );

  server.registerTool(
    'update_shipping_zone_method',
    {
      description:
        'Update a shipping method in a zone. Use to enable/disable, change title, order, or configure settings like cost.',
      annotations: { idempotentHint: true, openWorldHint: false },
      inputSchema: {
        zone_id: z.number().describe('Shipping zone ID'),
        instance_id: z.number().describe('Method instance ID'),
        title: z.string().optional().describe('Method title'),
        order: z.number().optional().describe('Display order'),
        enabled: z.boolean().optional().describe('Enable/disable this method'),
        settings: z
          .record(z.string(), z.string())
          .optional()
          .describe('Method settings (e.g. { "cost": "10.00" } for flat rate)'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ zone_id, instance_id, fields, ...data }) => {
      const f = resolveFields(fields, SHIPPING_ZONE_METHOD_FIELDS);
      return await handleRequest(
        wooApi.put(`shipping/zones/${zone_id}/methods/${instance_id}`, data),
        f
      );
    }
  );

  server.registerTool(
    'delete_shipping_zone_method',
    {
      description: 'Remove a shipping method from a zone.',
      annotations: { destructiveHint: true, openWorldHint: false },
      inputSchema: {
        zone_id: z.number().describe('Shipping zone ID'),
        instance_id: z.number().describe('Method instance ID'),
        force: z
          .boolean()
          .optional()
          .default(true)
          .describe('Must be true (shipping methods require force delete)'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ zone_id, instance_id, force, fields }) => {
      const f = resolveFields(fields, SHIPPING_ZONE_METHOD_FIELDS);
      return await handleRequest(
        wooApi.delete(`shipping/zones/${zone_id}/methods/${instance_id}`, { force }),
        f
      );
    }
  );

  server.registerTool(
    'list_shipping_classes',
    {
      description:
        'List product shipping classes. Classes group products with similar shipping requirements (e.g. heavy, fragile).',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
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
          .describe('Comma-separated fields to return (default: id,name,slug,count)'),
      },
    },
    async ({ fields, per_page, page }) => {
      const f = resolveFields(fields, SHIPPING_CLASS_LIST_FIELDS);
      return await handleListRequest(
        wooApi.get('products/shipping_classes', { per_page, page, _fields: f.join(',') }),
        page,
        per_page,
        f
      );
    }
  );

  server.registerTool(
    'create_shipping_class',
    {
      description:
        "Create a product shipping class. Assign to products via update_product to group similar shipping needs (e.g. 'bulky', 'fragile').",
      annotations: { openWorldHint: false },
      inputSchema: {
        name: z.string().describe('Shipping class name'),
        slug: z.string().optional().describe('Shipping class slug'),
        description: z.string().optional().describe('Shipping class description'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ fields, ...params }) => {
      const f = resolveFields(fields, SHIPPING_CLASS_FIELDS);
      return await handleRequest(wooApi.post('products/shipping_classes', params), f);
    }
  );

  server.registerTool(
    'delete_shipping_class',
    {
      description:
        'Delete a product shipping class. Products using this class will revert to no shipping class.',
      annotations: { destructiveHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Shipping class ID'),
        force: z
          .boolean()
          .optional()
          .default(true)
          .describe('Must be true (shipping classes require force delete)'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ id, force, fields }) => {
      const f = resolveFields(fields, SHIPPING_CLASS_FIELDS);
      return await handleRequest(wooApi.delete(`products/shipping_classes/${id}`, { force }), f);
    }
  );
}
