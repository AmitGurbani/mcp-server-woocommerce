import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { wooApi } from '../services/woo-client.js';
import { handleListRequest, handleRequest, resolveFields } from '../services/base.js';

const PRODUCT_LIST_FIELDS = [
  'id',
  'name',
  'type',
  'status',
  'sku',
  'price',
  'regular_price',
  'sale_price',
  'stock_status',
  'stock_quantity',
  'categories',
  'images',
  'attributes',
];
const PRODUCT_FIELDS = [
  ...PRODUCT_LIST_FIELDS,
  'slug',
  'description',
  'short_description',
  'manage_stock',
  'weight',
  'tags',
  'brands',
  'default_attributes',
  'variations',
];

const productAttributeSchema = z.object({
  id: z.number().optional().describe('Global attribute ID'),
  name: z.string().optional().describe('Attribute name (required if no id)'),
  position: z.number().optional().describe('Attribute display position'),
  visible: z.boolean().optional().default(true).describe('Show on product page'),
  variation: z.boolean().optional().default(true).describe('Used for variations'),
  options: z
    .array(z.string())
    .optional()
    .describe("Available options (e.g. ['500g', '1kg', '5kg'])"),
});

const defaultAttributeSchema = z.object({
  id: z.number().optional().describe('Attribute ID'),
  name: z.string().optional().describe('Attribute name'),
  option: z.string().describe('Default option value'),
});

export function registerProductTools(server: McpServer) {
  server.registerTool(
    'list_products',
    {
      description:
        'Search and filter the product catalog. Supports filtering by status, category, tag, type, price range, and search term. Use fields param to request only needed fields.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        search: z.string().optional().describe('Search term'),
        status: z
          .enum(['any', 'draft', 'pending', 'private', 'publish'])
          .optional()
          .describe('Product status'),
        category: z.string().optional().describe('Category ID to filter by'),
        tag: z.string().optional().describe('Tag ID to filter by'),
        type: z
          .enum(['simple', 'variable', 'grouped', 'external'])
          .optional()
          .describe('Product type'),
        featured: z.boolean().optional().describe('Filter by featured'),
        in_stock: z.boolean().optional().describe('Filter by in-stock status'),
        min_price: z.string().optional().describe('Minimum price'),
        max_price: z.string().optional().describe('Maximum price'),
        orderby: z
          .enum(['date', 'id', 'include', 'title', 'slug', 'price', 'popularity', 'rating'])
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
          .describe(
            'Comma-separated fields to return (default: id,name,type,status,sku,price,regular_price,sale_price,stock_status,stock_quantity,categories,images,attributes)'
          ),
      },
    },
    async ({ fields, per_page, page, ...filters }) => {
      const f = resolveFields(fields, PRODUCT_LIST_FIELDS);
      return await handleListRequest(
        wooApi.get('products', { per_page, page, _fields: f.join(','), ...filters }),
        page,
        per_page,
        f
      );
    }
  );

  server.registerTool(
    'get_product',
    {
      description:
        'Get full details of a single product by ID. Returns more fields than list_products including description, tags, brands, and variations. Use fields param to request only needed fields.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Product ID'),
        fields: z
          .string()
          .optional()
          .describe(
            'Comma-separated fields to return (default: id,name,type,status,sku,price,regular_price,sale_price,stock_status,stock_quantity,categories,images,attributes,slug,description,short_description,manage_stock,weight,tags,default_attributes,variations)'
          ),
      },
    },
    async ({ id, fields }) => {
      const f = resolveFields(fields, PRODUCT_FIELDS);
      return await handleRequest(wooApi.get(`products/${id}`, { _fields: f.join(',') }), f);
    }
  );

  server.registerTool(
    'create_product',
    {
      description:
        "Create a new WooCommerce product. For variable products, set type='variable' and include attributes array, then use create_variation to add variants.",
      annotations: { openWorldHint: false },
      inputSchema: {
        name: z.string().describe('Product name'),
        type: z
          .enum(['simple', 'variable', 'grouped', 'external'])
          .optional()
          .default('simple')
          .describe('Product type'),
        regular_price: z.string().optional().describe('Regular price'),
        sale_price: z.string().optional().describe('Sale price'),
        description: z.string().optional().describe('Full description (HTML allowed)'),
        short_description: z.string().optional().describe('Short description'),
        categories: z
          .array(z.object({ id: z.number() }))
          .optional()
          .describe('Category IDs'),
        tags: z
          .array(z.object({ id: z.number() }))
          .optional()
          .describe('Tag IDs'),
        brands: z
          .array(z.object({ id: z.number() }))
          .optional()
          .describe('Brand IDs'),
        images: z
          .array(z.object({ src: z.string() }))
          .optional()
          .describe('Image URLs'),
        manage_stock: z.boolean().optional().describe('Enable stock management'),
        stock_quantity: z.number().optional().describe('Stock quantity'),
        stock_status: z
          .enum(['instock', 'outofstock', 'onbackorder'])
          .optional()
          .describe('Stock status'),
        status: z
          .enum(['draft', 'pending', 'private', 'publish'])
          .optional()
          .default('draft')
          .describe('Product status'),
        sku: z.string().optional().describe('SKU'),
        virtual: z.boolean().optional().describe('Virtual product'),
        downloadable: z.boolean().optional().describe('Downloadable product'),
        weight: z.string().optional().describe('Weight'),
        attributes: z
          .array(productAttributeSchema)
          .optional()
          .describe('Product attributes (required for variable products)'),
        default_attributes: z
          .array(defaultAttributeSchema)
          .optional()
          .describe('Default variation attributes'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ fields, ...params }) => {
      const f = resolveFields(fields, PRODUCT_FIELDS);
      return await handleRequest(wooApi.post('products', params), f);
    }
  );

  server.registerTool(
    'update_product',
    {
      description:
        'Update an existing product. Only include fields you want to change. Note: setting images replaces all existing images.',
      annotations: { idempotentHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Product ID'),
        name: z.string().optional().describe('Product name'),
        type: z
          .enum(['simple', 'variable', 'grouped', 'external'])
          .optional()
          .describe('Product type'),
        regular_price: z.string().optional().describe('Regular price'),
        sale_price: z.string().optional().describe('Sale price'),
        description: z.string().optional().describe('Full description'),
        short_description: z.string().optional().describe('Short description'),
        categories: z
          .array(z.object({ id: z.number() }))
          .optional()
          .describe('Category IDs'),
        tags: z
          .array(z.object({ id: z.number() }))
          .optional()
          .describe('Tag IDs'),
        brands: z
          .array(z.object({ id: z.number() }))
          .optional()
          .describe('Brand IDs'),
        images: z
          .array(z.object({ src: z.string() }))
          .optional()
          .describe('Image URLs'),
        manage_stock: z.boolean().optional().describe('Enable stock management'),
        stock_quantity: z.number().optional().describe('Stock quantity'),
        stock_status: z
          .enum(['instock', 'outofstock', 'onbackorder'])
          .optional()
          .describe('Stock status'),
        status: z
          .enum(['draft', 'pending', 'private', 'publish'])
          .optional()
          .describe('Product status'),
        sku: z.string().optional().describe('SKU'),
        weight: z.string().optional().describe('Weight'),
        attributes: z.array(productAttributeSchema).optional().describe('Product attributes'),
        default_attributes: z
          .array(defaultAttributeSchema)
          .optional()
          .describe('Default variation attributes'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ id, fields, ...data }) => {
      const f = resolveFields(fields, PRODUCT_FIELDS);
      return await handleRequest(wooApi.put(`products/${id}`, data), f);
    }
  );

  server.registerTool(
    'delete_product',
    {
      description:
        'Delete a product. Moves to trash by default; set force=true to permanently delete. Does not delete associated media.',
      annotations: { destructiveHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Product ID'),
        force: z
          .boolean()
          .optional()
          .default(false)
          .describe('True to permanently delete, false to move to trash'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ id, force, fields }) => {
      const f = resolveFields(fields, PRODUCT_FIELDS);
      return await handleRequest(wooApi.delete(`products/${id}`, { force }), f);
    }
  );
}
