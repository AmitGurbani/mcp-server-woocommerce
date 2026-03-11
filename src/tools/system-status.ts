import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { wooApi } from '../services/woo-client.js';
import { handleRequest, resolveFields } from '../services/base.js';

const SYSTEM_STATUS_FIELDS = [
  'environment',
  'database',
  'active_plugins',
  'inactive_plugins',
  'theme',
  'settings',
  'security',
  'pages',
];
const SYSTEM_TOOL_FIELDS = ['id', 'name', 'description', 'success', 'message'];

export function registerSystemStatusTools(server: McpServer) {
  server.registerTool(
    'get_system_status',
    {
      description:
        'Get WooCommerce system status including environment, database, active plugins, theme, settings, and security info.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        fields: z
          .string()
          .optional()
          .describe(
            'Comma-separated fields to return (default: environment,database,active_plugins,inactive_plugins,theme,settings,security,pages)'
          ),
      },
    },
    async ({ fields }) => {
      const f = resolveFields(fields, SYSTEM_STATUS_FIELDS);
      return await handleRequest(wooApi.get('system_status', { _fields: f.join(',') }), f);
    }
  );

  server.registerTool(
    'list_system_tools',
    {
      description:
        'List available system tools (e.g. clear_transients, recount_terms, db_update_routine). These are maintenance utilities.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        fields: z
          .string()
          .optional()
          .describe(
            'Comma-separated fields to return (default: id,name,description,success,message)'
          ),
      },
    },
    async ({ fields }) => {
      const f = resolveFields(fields, SYSTEM_TOOL_FIELDS);
      return await handleRequest(wooApi.get('system_status/tools', { _fields: f.join(',') }), f);
    }
  );

  server.registerTool(
    'run_system_tool',
    {
      description:
        'Run a system maintenance tool. Common tools: clear_transients, clear_template_cache, recount_terms, db_update_routine, install_pages.',
      annotations: { destructiveHint: true, openWorldHint: false },
      inputSchema: {
        id: z
          .string()
          .describe('Tool ID (e.g. clear_transients, recount_terms, db_update_routine)'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ id, fields }) => {
      const f = resolveFields(fields, SYSTEM_TOOL_FIELDS);
      return await handleRequest(wooApi.put(`system_status/tools/${id}`, {}), f);
    }
  );
}
