import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { wpApi } from '../services/wp-client.js';
import { wooApi } from '../services/woo-client.js';
import { handleListRequest, handleRequest, resolveFields } from '../services/base.js';

const MEDIA_FIELDS = ['id', 'title', 'source_url', 'mime_type', 'date'];

export function registerMediaTools(server: McpServer) {
  server.registerTool(
    'list_media',
    {
      description:
        'List WordPress media library items. Supports search and MIME type filtering (e.g. image/jpeg). Use fields param to request only needed fields.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        search: z.string().optional().describe('Search term'),
        mime_type: z.string().optional().describe('MIME type filter (e.g. image/jpeg)'),
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
            'Comma-separated fields to return (default: id,title,source_url,mime_type,date)'
          ),
      },
    },
    async ({ fields, per_page, page, ...filters }) => {
      const f = resolveFields(fields, MEDIA_FIELDS);
      return await handleListRequest(
        wpApi.get('media', { per_page, page, _fields: f.join(','), ...filters }),
        page,
        per_page,
        f
      );
    }
  );

  server.registerTool(
    'delete_media',
    {
      description:
        'Permanently delete a media item from WordPress. This is irreversible. Use cleanup_orphaned_media to find unused items first.',
      annotations: { destructiveHint: true, openWorldHint: false },
      inputSchema: {
        id: z.number().describe('Media item ID'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ id, fields }) => {
      const f = resolveFields(fields, MEDIA_FIELDS);
      return await handleRequest(wpApi.delete(`media/${id}`, { force: true }), f);
    }
  );

  server.registerTool(
    'cleanup_orphaned_media',
    {
      description:
        'Find orphaned media not used by any product or category. Dry run by default; set delete=true to remove them. Scans all products and categories.',
      annotations: { destructiveHint: true, openWorldHint: false },
      inputSchema: {
        delete: z
          .boolean()
          .optional()
          .default(false)
          .describe('Set to true to delete orphaned items (default: dry run)'),
      },
    },
    async ({ delete: shouldDelete }) => {
      // 1. Collect all image IDs in use by products
      const usedImageIds = new Set<number>();
      let page = 1;
      let totalPages = 1;

      while (page <= totalPages) {
        const response = await wooApi.get('products', { per_page: 100, page, _fields: 'images' });
        totalPages = parseInt(response.headers['x-wp-totalpages'] || '1', 10);
        for (const product of response.data) {
          for (const image of product.images || []) {
            if (image.id) usedImageIds.add(image.id);
          }
        }
        page++;
      }

      // 2. Also check category images
      page = 1;
      totalPages = 1;
      while (page <= totalPages) {
        const response = await wooApi.get('products/categories', {
          per_page: 100,
          page,
          _fields: 'image',
        });
        totalPages = parseInt(response.headers['x-wp-totalpages'] || '1', 10);
        for (const cat of response.data) {
          if (cat.image?.id) usedImageIds.add(cat.image.id);
        }
        page++;
      }

      // 3. Collect all media items
      const allMedia: Array<{ id: number; title: string; source_url: string }> = [];
      page = 1;
      totalPages = 1;
      while (page <= totalPages) {
        const response = await wpApi.get('media', {
          per_page: 100,
          page,
          _fields: 'id,title,source_url',
        });
        totalPages = parseInt(response.headers['x-wp-totalpages'] || '1', 10);
        for (const item of response.data) {
          allMedia.push({
            id: item.id,
            title: item.title?.rendered || '',
            source_url: item.source_url || '',
          });
        }
        page++;
      }

      // 4. Find orphans
      const orphaned = allMedia.filter((m) => !usedImageIds.has(m.id));

      // 5. Optionally delete orphans
      let deleted = 0;
      const errors: string[] = [];
      if (shouldDelete) {
        for (const item of orphaned) {
          try {
            await wpApi.delete(`media/${item.id}`, { force: true });
            deleted++;
          } catch (e: any) {
            errors.push(`Failed to delete media ${item.id}: ${e.message}`);
          }
        }
      }

      const result: Record<string, unknown> = {
        total_media: allMedia.length,
        in_use: usedImageIds.size,
        orphaned_count: orphaned.length,
      };

      if (shouldDelete) {
        result.deleted = deleted;
        if (errors.length) result.errors = errors;
      } else {
        result.orphaned_items = orphaned;
        result.hint = 'Run with delete=true to remove these items';
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
