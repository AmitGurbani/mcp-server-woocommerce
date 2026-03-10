import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { wooApi } from '../services/woo-client.js';
import { handleListRequest, handleRequest, resolveFields } from '../services/base.js';

const TAG_LIST_FIELDS = ['id', 'name', 'slug', 'count'];
const TAG_FIELDS = [...TAG_LIST_FIELDS, 'description'];

export function registerTagTools(server: McpServer) {
  server.registerTool(
    'list_tags',
    {
      description:
        'List product tags. Tags are flat labels (no hierarchy). Use hide_empty to skip unused tags. Use fields param to request only needed fields.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        search: z.string().optional().describe('Search term'),
        hide_empty: z.boolean().optional().describe('Hide tags with no products'),
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
          .describe('Comma-separated fields to return (default: id,name,slug,count)'),
      },
    },
    async ({ fields, per_page, page, ...filters }) => {
      const f = resolveFields(fields, TAG_LIST_FIELDS);
      return await handleListRequest(
        wooApi.get('products/tags', { per_page, page, _fields: f.join(','), ...filters }),
        page,
        per_page,
        f
      );
    }
  );

  server.registerTool(
    'get_tag',
    {
      description:
        'Get full details of a product tag including description and product count. Use fields param to request only needed fields.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Tag ID'),
        fields: z
          .string()
          .optional()
          .describe('Comma-separated fields to return (default: id,name,slug,count,description)'),
      },
    },
    async ({ id, fields }) => {
      const f = resolveFields(fields, TAG_FIELDS);
      return await handleRequest(wooApi.get(`products/tags/${id}`, { _fields: f.join(',') }), f);
    }
  );

  server.registerTool(
    'create_tag',
    {
      description:
        "Create a product tag. Tags are flat labels like 'Bestseller' or 'New Arrival' — unlike categories, they have no hierarchy.",
      annotations: { openWorldHint: false },
      inputSchema: {
        name: z.string().describe('Tag name'),
        slug: z.string().optional().describe('Tag slug'),
        description: z.string().optional().describe('Tag description'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ fields, ...params }) => {
      const f = resolveFields(fields, TAG_FIELDS);
      return await handleRequest(wooApi.post('products/tags', params), f);
    }
  );

  server.registerTool(
    'update_tag',
    {
      description:
        "Update a product tag's name, slug, or description. Only include fields you want to change.",
      annotations: { idempotentHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Tag ID'),
        name: z.string().optional().describe('Tag name'),
        slug: z.string().optional().describe('Tag slug'),
        description: z.string().optional().describe('Tag description'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ id, fields, ...data }) => {
      const f = resolveFields(fields, TAG_FIELDS);
      return await handleRequest(wooApi.put(`products/tags/${id}`, data), f);
    }
  );

  server.registerTool(
    'delete_tag',
    {
      description:
        'Delete a product tag. Does NOT affect products that had this tag; they simply lose the tag association.',
      annotations: { destructiveHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Tag ID'),
        force: z.boolean().optional().default(false).describe('True to permanently delete'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ id, force, fields }) => {
      const f = resolveFields(fields, TAG_FIELDS);
      return await handleRequest(wooApi.delete(`products/tags/${id}`, { force }), f);
    }
  );
}
