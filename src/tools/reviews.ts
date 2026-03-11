import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { wooApi } from '../services/woo-client.js';
import { handleListRequest, handleRequest, resolveFields } from '../services/base.js';

const REVIEW_LIST_FIELDS = [
  'id',
  'date_created',
  'product_id',
  'product_name',
  'status',
  'reviewer',
  'rating',
  'review',
];
const REVIEW_FIELDS = [...REVIEW_LIST_FIELDS, 'reviewer_email', 'verified'];

const reviewStatusEnum = z.enum(['all', 'hold', 'approved', 'spam', 'trash']);

export function registerReviewTools(server: McpServer) {
  server.registerTool(
    'list_product_reviews',
    {
      description:
        'List product reviews. Filter by product IDs, status, or search term. Use fields param to request only needed fields.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        product: z
          .array(z.number())
          .optional()
          .describe('Filter by product IDs'),
        status: reviewStatusEnum
          .optional()
          .describe('Filter by review status (all, hold, approved, spam, trash)'),
        search: z.string().optional().describe('Search reviews by keyword'),
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
            'Comma-separated fields to return (default: id,date_created,product_id,product_name,status,reviewer,rating,review)'
          ),
      },
    },
    async ({ fields, per_page, page, ...filters }) => {
      const f = resolveFields(fields, REVIEW_LIST_FIELDS);
      return await handleListRequest(
        wooApi.get('products/reviews', { per_page, page, _fields: f.join(','), ...filters }),
        page,
        per_page,
        f
      );
    }
  );

  server.registerTool(
    'get_product_review',
    {
      description:
        'Get full details of a product review by ID including reviewer email and verification status.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Review ID'),
        fields: z
          .string()
          .optional()
          .describe(
            'Comma-separated fields to return (default: id,date_created,product_id,product_name,status,reviewer,rating,review,reviewer_email,verified)'
          ),
      },
    },
    async ({ id, fields }) => {
      const f = resolveFields(fields, REVIEW_FIELDS);
      return await handleRequest(
        wooApi.get(`products/reviews/${id}`, { _fields: f.join(',') }),
        f
      );
    }
  );

  server.registerTool(
    'update_product_review',
    {
      description:
        'Update a product review. Use to change status (approve/hold/spam/trash), edit review text, or modify rating.',
      annotations: { idempotentHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Review ID'),
        status: z
          .enum(['approved', 'hold', 'spam', 'trash'])
          .optional()
          .describe('Review status'),
        review: z.string().optional().describe('Review content (HTML allowed)'),
        rating: z
          .number()
          .min(0)
          .max(5)
          .optional()
          .describe('Review rating (0-5)'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ id, fields, ...data }) => {
      const f = resolveFields(fields, REVIEW_FIELDS);
      return await handleRequest(wooApi.put(`products/reviews/${id}`, data), f);
    }
  );

  server.registerTool(
    'delete_product_review',
    {
      description:
        'Delete a product review. By default moves to trash (force=false). Set force=true to permanently delete.',
      annotations: { destructiveHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Review ID'),
        force: z
          .boolean()
          .optional()
          .default(false)
          .describe('True to permanently delete, false to move to trash (default: false)'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ id, force, fields }) => {
      const f = resolveFields(fields, REVIEW_FIELDS);
      return await handleRequest(
        wooApi.delete(`products/reviews/${id}`, { force }),
        f
      );
    }
  );
}
