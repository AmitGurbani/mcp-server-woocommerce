import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { wooApi } from '../services/woo-client.js';
import { handleListRequest, handleRequest, resolveFields } from '../services/base.js';

const VARIATION_LIST_FIELDS = [
  'id',
  'sku',
  'price',
  'regular_price',
  'sale_price',
  'status',
  'stock_status',
  'stock_quantity',
  'attributes',
  'image',
];
const VARIATION_FIELDS = [...VARIATION_LIST_FIELDS, 'weight', 'description', 'manage_stock'];

const variationAttributeSchema = z.object({
  id: z.number().optional().describe('Attribute ID'),
  name: z.string().optional().describe('Attribute name'),
  option: z.string().describe("Selected attribute term (e.g. '500g')"),
});

const variationImageSchema = z.object({
  id: z.number().optional().describe('Image ID from media library'),
  src: z.string().optional().describe('Image URL'),
});

const variationFieldsSchema = {
  regular_price: z.string().optional().describe('Regular price (MRP)'),
  sale_price: z.string().optional().describe('Sale price'),
  sku: z.string().optional().describe('SKU'),
  status: z
    .enum(['draft', 'pending', 'private', 'publish'])
    .optional()
    .default('publish')
    .describe('Variation status'),
  manage_stock: z.boolean().optional().describe('Enable stock management'),
  stock_quantity: z.number().optional().describe('Stock quantity'),
  stock_status: z
    .enum(['instock', 'outofstock', 'onbackorder'])
    .optional()
    .describe('Stock status'),
  weight: z.string().optional().describe('Weight'),
  image: variationImageSchema.optional().describe('Variation image'),
  attributes: z
    .array(variationAttributeSchema)
    .describe('Attribute values defining this variation'),
  description: z.string().optional().describe('Variation description'),
};

export function registerVariationTools(server: McpServer) {
  server.registerTool(
    'list_variations',
    {
      description:
        'List all variations for a variable product. Each variation has its own price, SKU, and stock. Use fields param to request only needed fields.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        product_id: z.number().describe('Parent product ID'),
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
            'Comma-separated fields to return (default: id,sku,price,regular_price,sale_price,status,stock_status,stock_quantity,attributes,image)'
          ),
      },
    },
    async ({ product_id, per_page, page, fields }) => {
      const f = resolveFields(fields, VARIATION_LIST_FIELDS);
      return await handleListRequest(
        wooApi.get(`products/${product_id}/variations`, { per_page, page, _fields: f.join(',') }),
        page,
        per_page,
        f
      );
    }
  );

  server.registerTool(
    'get_variation',
    {
      description:
        'Get full details of a single variation including price, stock, weight, and attributes. Use fields param to request only needed fields.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        product_id: z.number().describe('Parent product ID'),
        id: z.number().describe('Variation ID'),
        fields: z
          .string()
          .optional()
          .describe(
            'Comma-separated fields to return (default: id,sku,price,regular_price,sale_price,status,stock_status,stock_quantity,attributes,image,weight,description,manage_stock)'
          ),
      },
    },
    async ({ product_id, id, fields }) => {
      const f = resolveFields(fields, VARIATION_FIELDS);
      return await handleRequest(
        wooApi.get(`products/${product_id}/variations/${id}`, { _fields: f.join(',') }),
        f
      );
    }
  );

  server.registerTool(
    'create_variation',
    {
      description:
        "Create a variation for a variable product. Parent product must have type='variable' with matching attributes. Use batch_update_variations for multiple at once.",
      annotations: { openWorldHint: false },
      inputSchema: {
        product_id: z.number().describe('Parent product ID'),
        ...variationFieldsSchema,
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ product_id, fields, ...data }) => {
      const f = resolveFields(fields, VARIATION_FIELDS);
      return await handleRequest(wooApi.post(`products/${product_id}/variations`, data), f);
    }
  );

  server.registerTool(
    'update_variation',
    {
      description:
        "Update a variation's price, stock, SKU, or other details. Only include fields you want to change.",
      annotations: { idempotentHint: true, openWorldHint: false },
      inputSchema: {
        product_id: z.number().describe('Parent product ID'),
        id: z.number().describe('Variation ID'),
        regular_price: z.string().optional().describe('Regular price (MRP)'),
        sale_price: z.string().optional().describe('Sale price'),
        sku: z.string().optional().describe('SKU'),
        status: z
          .enum(['draft', 'pending', 'private', 'publish'])
          .optional()
          .describe('Variation status'),
        manage_stock: z.boolean().optional().describe('Enable stock management'),
        stock_quantity: z.number().optional().describe('Stock quantity'),
        stock_status: z
          .enum(['instock', 'outofstock', 'onbackorder'])
          .optional()
          .describe('Stock status'),
        weight: z.string().optional().describe('Weight'),
        image: variationImageSchema.optional().describe('Variation image'),
        attributes: z.array(variationAttributeSchema).optional().describe('Attribute values'),
        description: z.string().optional().describe('Variation description'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ product_id, id, fields, ...data }) => {
      const f = resolveFields(fields, VARIATION_FIELDS);
      return await handleRequest(wooApi.put(`products/${product_id}/variations/${id}`, data), f);
    }
  );

  server.registerTool(
    'batch_update_variations',
    {
      description:
        'Batch create, update, or delete variations in a single request. More efficient than individual calls for setting up a variable product.',
      annotations: { openWorldHint: false },
      inputSchema: {
        product_id: z.number().describe('Parent product ID'),
        create: z
          .array(
            z.object({
              regular_price: z.string().optional().describe('Regular price (MRP)'),
              sale_price: z.string().optional().describe('Sale price'),
              sku: z.string().optional().describe('SKU'),
              status: z
                .enum(['draft', 'pending', 'private', 'publish'])
                .optional()
                .default('publish')
                .describe('Status'),
              manage_stock: z.boolean().optional().describe('Enable stock management'),
              stock_quantity: z.number().optional().describe('Stock quantity'),
              weight: z.string().optional().describe('Weight'),
              image: variationImageSchema.optional().describe('Variation image'),
              attributes: z.array(variationAttributeSchema).describe('Attribute values'),
              description: z.string().optional().describe('Description'),
            })
          )
          .optional()
          .describe('Variations to create'),
        update: z
          .array(
            z.object({
              id: z.number().describe('Variation ID'),
              regular_price: z.string().optional().describe('Regular price (MRP)'),
              sale_price: z.string().optional().describe('Sale price'),
              sku: z.string().optional().describe('SKU'),
              status: z
                .enum(['draft', 'pending', 'private', 'publish'])
                .optional()
                .describe('Status'),
              manage_stock: z.boolean().optional().describe('Enable stock management'),
              stock_quantity: z.number().optional().describe('Stock quantity'),
              weight: z.string().optional().describe('Weight'),
              image: variationImageSchema.optional().describe('Variation image'),
              attributes: z.array(variationAttributeSchema).optional().describe('Attribute values'),
              description: z.string().optional().describe('Description'),
            })
          )
          .optional()
          .describe('Variations to update'),
        delete: z.array(z.number()).optional().describe('Variation IDs to delete'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ product_id, create, update, delete: deleteIds, fields }) => {
      const f = resolveFields(fields, VARIATION_FIELDS);
      return await handleRequest(
        wooApi.post(`products/${product_id}/variations/batch`, {
          create,
          update,
          delete: deleteIds,
        }),
        f
      );
    }
  );
}
