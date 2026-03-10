import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { wooApi } from '../services/woo-client.js';
import { handleListRequest, handleRequest, resolveFields } from '../services/base.js';

const BRAND_LIST_FIELDS = ['id', 'name', 'slug', 'parent', 'count', 'image'];
const BRAND_FIELDS = [...BRAND_LIST_FIELDS, 'description'];

export function registerBrandTools(server: McpServer) {
  server.registerTool(
    'list_brands',
    {
      description:
        'List product brands (WooCommerce 9.6+ core feature). Supports filtering by parent and hide_empty. Use fields param to request only needed fields.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        search: z.string().optional().describe('Search term'),
        parent: z.number().optional().describe('Parent brand ID to filter by'),
        hide_empty: z.boolean().optional().describe('Hide brands with no products'),
        orderby: z
          .enum(['id', 'include', 'name', 'slug', 'term_group', 'description', 'count'])
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
          .describe('Comma-separated fields to return (default: id,name,slug,parent,count,image)'),
      },
    },
    async ({ fields, per_page, page, ...filters }) => {
      const f = resolveFields(fields, BRAND_LIST_FIELDS);
      return await handleListRequest(
        wooApi.get('products/brands', { per_page, page, _fields: f.join(','), ...filters }),
        page,
        per_page,
        f
      );
    }
  );

  server.registerTool(
    'get_brand',
    {
      description:
        'Get full details of a product brand including description, image, and product count. Use fields param to request only needed fields.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Brand ID'),
        fields: z
          .string()
          .optional()
          .describe(
            'Comma-separated fields to return (default: id,name,slug,parent,count,image,description)'
          ),
      },
    },
    async ({ id, fields }) => {
      const f = resolveFields(fields, BRAND_FIELDS);
      return await handleRequest(wooApi.get(`products/brands/${id}`, { _fields: f.join(',') }), f);
    }
  );

  server.registerTool(
    'create_brand',
    {
      description:
        'Create a product brand. Brands are hierarchical and can have images. Assign to products via update_product with brands array.',
      annotations: { openWorldHint: false },
      inputSchema: {
        name: z.string().describe('Brand name'),
        slug: z.string().optional().describe('Brand slug'),
        parent: z.number().optional().describe('Parent brand ID'),
        description: z.string().optional().describe('Brand description'),
        image: z.object({ src: z.string() }).optional().describe('Brand image URL'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ fields, ...params }) => {
      const f = resolveFields(fields, BRAND_FIELDS);
      return await handleRequest(wooApi.post('products/brands', params), f);
    }
  );

  server.registerTool(
    'update_brand',
    {
      description:
        "Update a brand's name, slug, parent, description, or image. Only include fields you want to change.",
      annotations: { idempotentHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Brand ID'),
        name: z.string().optional().describe('Brand name'),
        slug: z.string().optional().describe('Brand slug'),
        parent: z.number().optional().describe('Parent brand ID'),
        description: z.string().optional().describe('Brand description'),
        image: z.object({ src: z.string() }).optional().describe('Brand image URL'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ id, fields, ...data }) => {
      const f = resolveFields(fields, BRAND_FIELDS);
      return await handleRequest(wooApi.put(`products/brands/${id}`, data), f);
    }
  );

  server.registerTool(
    'delete_brand',
    {
      description:
        'Delete a product brand. Does NOT delete products with this brand; they simply lose the brand association.',
      annotations: { destructiveHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Brand ID'),
        force: z.boolean().optional().default(false).describe('True to permanently delete'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ id, force, fields }) => {
      const f = resolveFields(fields, BRAND_FIELDS);
      return await handleRequest(wooApi.delete(`products/brands/${id}`, { force }), f);
    }
  );
}
