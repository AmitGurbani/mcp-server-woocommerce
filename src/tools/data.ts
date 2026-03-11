import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { wooApi } from '../services/woo-client.js';
import { handleRequest, resolveFields } from '../services/base.js';

const COUNTRY_FIELDS = ['code', 'name', 'states'];
const CURRENCY_FIELDS = ['code', 'name', 'symbol'];

export function registerDataTools(server: McpServer) {
  server.registerTool(
    'list_countries',
    {
      description:
        'List all countries available in WooCommerce with their states/provinces. Useful for setting up shipping zones and tax rules.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        fields: z
          .string()
          .optional()
          .describe('Comma-separated fields to return (default: code,name,states)'),
      },
    },
    async ({ fields }) => {
      const f = resolveFields(fields, COUNTRY_FIELDS);
      return await handleRequest(
        wooApi.get('data/countries', { _fields: f.join(',') }),
        f
      );
    }
  );

  server.registerTool(
    'list_currencies',
    {
      description:
        'List all currencies supported by WooCommerce with their codes and symbols.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        fields: z
          .string()
          .optional()
          .describe('Comma-separated fields to return (default: code,name,symbol)'),
      },
    },
    async ({ fields }) => {
      const f = resolveFields(fields, CURRENCY_FIELDS);
      return await handleRequest(
        wooApi.get('data/currencies', { _fields: f.join(',') }),
        f
      );
    }
  );
}
