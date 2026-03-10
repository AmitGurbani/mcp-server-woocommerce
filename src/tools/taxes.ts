import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { wooApi } from '../services/woo-client.js';
import { handleListRequest, handleRequest, resolveFields } from '../services/base.js';

const TAX_CLASS_FIELDS = ['slug', 'name'];

const TAX_RATE_LIST_FIELDS = [
  'id',
  'country',
  'state',
  'postcode',
  'city',
  'rate',
  'name',
  'class',
];
const TAX_RATE_FIELDS = [...TAX_RATE_LIST_FIELDS, 'priority', 'compound', 'shipping', 'order'];

export function registerTaxTools(server: McpServer) {
  server.registerTool(
    'list_tax_classes',
    {
      description:
        "List all tax classes. WooCommerce includes 'Standard', 'Reduced rate', and 'Zero rate' by default. Tax classes group tax rates.",
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        fields: z
          .string()
          .optional()
          .describe('Comma-separated fields to return (default: slug,name)'),
      },
    },
    async ({ fields }) => {
      const f = resolveFields(fields, TAX_CLASS_FIELDS);
      return await handleRequest(wooApi.get('taxes/classes'), f);
    }
  );

  server.registerTool(
    'create_tax_class',
    {
      description:
        "Create a custom tax class. After creating, add tax rates to it. Example: 'GST 5%' for food items.",
      annotations: { openWorldHint: false },
      inputSchema: {
        name: z.string().describe('Tax class name'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ fields, ...params }) => {
      const f = resolveFields(fields, TAX_CLASS_FIELDS);
      return await handleRequest(wooApi.post('taxes/classes', params), f);
    }
  );

  server.registerTool(
    'delete_tax_class',
    {
      description:
        'Delete a tax class by slug. Cannot delete the Standard class. Rates in this class will be orphaned.',
      annotations: { destructiveHint: true, openWorldHint: false },
      inputSchema: {
        slug: z.string().describe('Tax class slug'),
        force: z
          .boolean()
          .optional()
          .default(true)
          .describe('Must be true (tax classes require force delete)'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ slug, force, fields }) => {
      const f = resolveFields(fields, TAX_CLASS_FIELDS);
      return await handleRequest(wooApi.delete(`taxes/classes/${slug}`, { force }), f);
    }
  );

  server.registerTool(
    'list_tax_rates',
    {
      description:
        'List tax rates. Filter by tax class to see rates for a specific class. Each rate defines tax for a region.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        class: z.string().optional().describe('Tax class slug to filter by (e.g. standard)'),
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
            'Comma-separated fields to return (default: id,country,state,postcode,city,rate,name,class)'
          ),
      },
    },
    async ({ fields, per_page, page, ...filters }) => {
      const f = resolveFields(fields, TAX_RATE_LIST_FIELDS);
      return await handleListRequest(
        wooApi.get('taxes', { per_page, page, _fields: f.join(','), ...filters }),
        page,
        per_page,
        f
      );
    }
  );

  server.registerTool(
    'get_tax_rate',
    {
      description: 'Get a single tax rate by ID with full details.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Tax rate ID'),
        fields: z
          .string()
          .optional()
          .describe(
            'Comma-separated fields to return (default: id,country,state,postcode,city,rate,name,class,priority,compound,shipping,order)'
          ),
      },
    },
    async ({ id, fields }) => {
      const f = resolveFields(fields, TAX_RATE_FIELDS);
      return await handleRequest(wooApi.get(`taxes/${id}`, { _fields: f.join(',') }), f);
    }
  );

  server.registerTool(
    'create_tax_rate',
    {
      description:
        "Create a tax rate. Set country/state/postcode for region, rate as percentage string (e.g. '18.0000'), and class for tax class.",
      annotations: { openWorldHint: false },
      inputSchema: {
        country: z.string().optional().describe('Country ISO 3166 code (e.g. IN, US)'),
        state: z.string().optional().describe('State code (e.g. GJ, CA)'),
        postcode: z.string().optional().describe('Postcode or range (e.g. 396321)'),
        city: z.string().optional().describe('City name'),
        rate: z.string().describe("Tax rate percentage (e.g. '18.0000')"),
        name: z.string().describe("Tax rate name (e.g. 'GST 18%')"),
        class: z.string().optional().default('standard').describe('Tax class slug'),
        priority: z.number().optional().default(1).describe('Tax rate priority'),
        compound: z.boolean().optional().default(false).describe('Whether this is a compound rate'),
        shipping: z.boolean().optional().default(true).describe('Whether rate applies to shipping'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ fields, ...params }) => {
      const f = resolveFields(fields, TAX_RATE_FIELDS);
      return await handleRequest(wooApi.post('taxes', params), f);
    }
  );

  server.registerTool(
    'update_tax_rate',
    {
      description: 'Update a tax rate. Only include fields you want to change.',
      annotations: { idempotentHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Tax rate ID'),
        country: z.string().optional().describe('Country ISO 3166 code'),
        state: z.string().optional().describe('State code'),
        postcode: z.string().optional().describe('Postcode or range'),
        city: z.string().optional().describe('City name'),
        rate: z.string().optional().describe('Tax rate percentage'),
        name: z.string().optional().describe('Tax rate name'),
        class: z.string().optional().describe('Tax class slug'),
        priority: z.number().optional().describe('Tax rate priority'),
        compound: z.boolean().optional().describe('Whether this is a compound rate'),
        shipping: z.boolean().optional().describe('Whether rate applies to shipping'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ id, fields, ...data }) => {
      const f = resolveFields(fields, TAX_RATE_FIELDS);
      return await handleRequest(wooApi.put(`taxes/${id}`, data), f);
    }
  );

  server.registerTool(
    'delete_tax_rate',
    {
      description: 'Delete a tax rate. This is permanent and cannot be undone.',
      annotations: { destructiveHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Tax rate ID'),
        force: z
          .boolean()
          .optional()
          .default(true)
          .describe('Must be true (tax rates require force delete)'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ id, force, fields }) => {
      const f = resolveFields(fields, TAX_RATE_FIELDS);
      return await handleRequest(wooApi.delete(`taxes/${id}`, { force }), f);
    }
  );
}
