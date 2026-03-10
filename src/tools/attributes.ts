import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { wooApi } from '../services/woo-client.js';
import { handleListRequest, handleRequest, resolveFields } from '../services/base.js';

const ATTRIBUTE_FIELDS = ['id', 'name', 'slug', 'type', 'order_by'];
const ATTRIBUTE_TERM_FIELDS = ['id', 'name', 'slug', 'count'];

export function registerAttributeTools(server: McpServer) {
  // --- Product Attribute tools ---

  server.registerTool(
    'list_attributes',
    {
      description:
        'List global product attributes (e.g. Weight, Volume, Size). Use list_attribute_terms to see values for each attribute. Use fields param to request only needed fields.',
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
          .describe('Comma-separated fields to return (default: id,name,slug,type,order_by)'),
      },
    },
    async ({ per_page, page, fields }) => {
      const f = resolveFields(fields, ATTRIBUTE_FIELDS);
      return await handleListRequest(
        wooApi.get('products/attributes', { per_page, page, _fields: f.join(',') }),
        page,
        per_page,
        f
      );
    }
  );

  server.registerTool(
    'get_attribute',
    {
      description:
        'Get details of a global product attribute. Use list_attribute_terms with the attribute ID to see its values. Use fields param to request only needed fields.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Attribute ID'),
        fields: z
          .string()
          .optional()
          .describe('Comma-separated fields to return (default: id,name,slug,type,order_by)'),
      },
    },
    async ({ id, fields }) => {
      const f = resolveFields(fields, ATTRIBUTE_FIELDS);
      return await handleRequest(
        wooApi.get(`products/attributes/${id}`, { _fields: f.join(',') }),
        f
      );
    }
  );

  server.registerTool(
    'create_attribute',
    {
      description:
        'Create a global product attribute. After creating, use create_attribute_term to add values (e.g. 500g, 1kg for a Weight attribute).',
      annotations: { openWorldHint: false },
      inputSchema: {
        name: z.string().describe("Attribute name (e.g. 'Weight', 'Volume', 'Pack')"),
        slug: z.string().optional().describe("Attribute slug (e.g. 'pa_weight')"),
        type: z.enum(['select']).optional().default('select').describe('Attribute type'),
        order_by: z
          .enum(['menu_order', 'name', 'name_num', 'id'])
          .optional()
          .default('menu_order')
          .describe('Sort order for terms'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ fields, ...params }) => {
      const f = resolveFields(fields, ATTRIBUTE_FIELDS);
      return await handleRequest(wooApi.post('products/attributes', params), f);
    }
  );

  server.registerTool(
    'delete_attribute',
    {
      description:
        'Delete a global product attribute and all its terms. Also removes the attribute from all products that use it.',
      annotations: { destructiveHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Attribute ID'),
        force: z.boolean().optional().default(true).describe('Must be true to delete an attribute'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ id, force, fields }) => {
      const f = resolveFields(fields, ATTRIBUTE_FIELDS);
      return await handleRequest(wooApi.delete(`products/attributes/${id}`, { force }), f);
    }
  );

  // --- Attribute Term tools ---

  server.registerTool(
    'list_attribute_terms',
    {
      description:
        "List values (terms) for a product attribute, e.g. '500g', '1kg' for Weight. Use fields param to request only needed fields.",
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        attribute_id: z.number().describe('Parent attribute ID'),
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
    async ({ attribute_id, per_page, page, fields }) => {
      const f = resolveFields(fields, ATTRIBUTE_TERM_FIELDS);
      return await handleListRequest(
        wooApi.get(`products/attributes/${attribute_id}/terms`, {
          per_page,
          page,
          _fields: f.join(','),
        }),
        page,
        per_page,
        f
      );
    }
  );

  server.registerTool(
    'create_attribute_term',
    {
      description:
        "Add a new value to a product attribute (e.g. add '2kg' to Weight). Use batch_update_attribute_terms for multiple values at once.",
      annotations: { openWorldHint: false },
      inputSchema: {
        attribute_id: z.number().describe('Parent attribute ID'),
        name: z.string().describe("Term name (e.g. '500g', '1kg', '5kg')"),
        slug: z.string().optional().describe('Term slug'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ attribute_id, fields, ...data }) => {
      const f = resolveFields(fields, ATTRIBUTE_TERM_FIELDS);
      return await handleRequest(wooApi.post(`products/attributes/${attribute_id}/terms`, data), f);
    }
  );

  server.registerTool(
    'delete_attribute_term',
    {
      description:
        'Delete a value from a product attribute. Removes the term from all products using it.',
      annotations: { destructiveHint: true, openWorldHint: false },
      inputSchema: {
        attribute_id: z.number().describe('Parent attribute ID'),
        id: z.number().describe('Term ID'),
        force: z.boolean().optional().default(true).describe('Must be true to delete a term'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ attribute_id, id, force, fields }) => {
      const f = resolveFields(fields, ATTRIBUTE_TERM_FIELDS);
      return await handleRequest(
        wooApi.delete(`products/attributes/${attribute_id}/terms/${id}`, { force }),
        f
      );
    }
  );

  server.registerTool(
    'batch_update_attribute_terms',
    {
      description:
        'Batch create, update, or delete attribute terms in a single request. More efficient than individual create/delete calls for multiple terms.',
      annotations: { openWorldHint: false },
      inputSchema: {
        attribute_id: z.number().describe('Parent attribute ID'),
        create: z
          .array(
            z.object({
              name: z.string().describe('Term name'),
              slug: z.string().optional().describe('Term slug'),
            })
          )
          .optional()
          .describe('Terms to create'),
        update: z
          .array(
            z.object({
              id: z.number().describe('Term ID'),
              name: z.string().optional().describe('Term name'),
              slug: z.string().optional().describe('Term slug'),
            })
          )
          .optional()
          .describe('Terms to update'),
        delete: z.array(z.number()).optional().describe('Term IDs to delete'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ attribute_id, create, update, delete: deleteIds, fields }) => {
      const f = resolveFields(fields, ATTRIBUTE_TERM_FIELDS);
      return await handleRequest(
        wooApi.post(`products/attributes/${attribute_id}/terms/batch`, {
          create,
          update,
          delete: deleteIds,
        }),
        f
      );
    }
  );
}
