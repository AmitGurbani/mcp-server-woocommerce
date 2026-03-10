import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { wooApi } from '../services/woo-client.js';
import { handleListRequest, handleRequest, resolveFields } from '../services/base.js';

const CATEGORY_LIST_FIELDS = ['id', 'name', 'slug', 'parent', 'count', 'image'];
const CATEGORY_FIELDS = [...CATEGORY_LIST_FIELDS, 'description'];

export function registerCategoryTools(server: McpServer) {
  server.registerTool(
    'list_categories',
    {
      description:
        'List product categories. Supports filtering by parent for subcategories, and hide_empty to skip unused categories. Use fields param to request only needed fields.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        search: z.string().optional().describe('Search term'),
        parent: z.number().optional().describe('Parent category ID to filter by'),
        hide_empty: z.boolean().optional().describe('Hide empty categories'),
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
      const f = resolveFields(fields, CATEGORY_LIST_FIELDS);
      return await handleListRequest(
        wooApi.get('products/categories', { per_page, page, _fields: f.join(','), ...filters }),
        page,
        per_page,
        f
      );
    }
  );

  server.registerTool(
    'get_category',
    {
      description:
        'Get full details of a category including description and product count. Use fields param to request only needed fields.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Category ID'),
        fields: z
          .string()
          .optional()
          .describe(
            'Comma-separated fields to return (default: id,name,slug,parent,count,image,description)'
          ),
      },
    },
    async ({ id, fields }) => {
      const f = resolveFields(fields, CATEGORY_FIELDS);
      return await handleRequest(
        wooApi.get(`products/categories/${id}`, { _fields: f.join(',') }),
        f
      );
    }
  );

  server.registerTool(
    'create_category',
    {
      description:
        'Create a product category. Set parent ID to create a subcategory. Categories are hierarchical.',
      annotations: { openWorldHint: false },
      inputSchema: {
        name: z.string().describe('Category name'),
        slug: z.string().optional().describe('Category slug'),
        parent: z.number().optional().describe('Parent category ID'),
        description: z.string().optional().describe('Category description'),
        image: z.object({ src: z.string() }).optional().describe('Category image URL'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ fields, ...params }) => {
      const f = resolveFields(fields, CATEGORY_FIELDS);
      return await handleRequest(wooApi.post('products/categories', params), f);
    }
  );

  server.registerTool(
    'update_category',
    {
      description:
        "Update a category's name, slug, parent, description, or image. Only include fields you want to change.",
      annotations: { idempotentHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Category ID'),
        name: z.string().optional().describe('Category name'),
        slug: z.string().optional().describe('Category slug'),
        parent: z.number().optional().describe('Parent category ID'),
        description: z.string().optional().describe('Category description'),
        image: z.object({ src: z.string() }).optional().describe('Category image URL'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ id, fields, ...data }) => {
      const f = resolveFields(fields, CATEGORY_FIELDS);
      return await handleRequest(wooApi.put(`products/categories/${id}`, data), f);
    }
  );

  server.registerTool(
    'delete_category',
    {
      description:
        'Delete a product category. Does NOT delete products in the category; they become uncategorized.',
      annotations: { destructiveHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Category ID'),
        force: z.boolean().optional().default(false).describe('True to permanently delete'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ id, force, fields }) => {
      const f = resolveFields(fields, CATEGORY_FIELDS);
      return await handleRequest(wooApi.delete(`products/categories/${id}`, { force }), f);
    }
  );
}
