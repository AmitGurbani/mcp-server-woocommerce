import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { wooApi } from '../services/woo-client.js';
import { handleRequest, resolveFields } from '../services/base.js';

const SETTINGS_GROUP_FIELDS = ['id', 'label', 'description'];

const SETTING_FIELDS = ['id', 'label', 'description', 'type', 'value', 'options', 'default'];

export function registerSettingsTools(server: McpServer) {
  server.registerTool(
    'list_setting_groups',
    {
      description:
        'List all WooCommerce setting groups. Groups include: general, products, tax, shipping, checkout, account, email, advanced. Use group ID with get_settings to see options.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        fields: z
          .string()
          .optional()
          .describe('Comma-separated fields to return (default: id,label,description)'),
      },
    },
    async ({ fields }) => {
      const f = resolveFields(fields, SETTINGS_GROUP_FIELDS);
      return await handleRequest(wooApi.get('settings', { _fields: f.join(',') }), f);
    }
  );

  server.registerTool(
    'get_settings',
    {
      description:
        "Get all settings in a group. Common groups: 'general' (store address, currency), 'products' (measurements, reviews), 'tax' (tax options), 'shipping' (shipping options).",
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        group_id: z
          .string()
          .describe("Setting group ID (e.g. 'general', 'products', 'tax', 'shipping')"),
        fields: z
          .string()
          .optional()
          .describe(
            'Comma-separated fields to return (default: id,label,description,type,value,options,default)'
          ),
      },
    },
    async ({ group_id, fields }) => {
      const f = resolveFields(fields, SETTING_FIELDS);
      return await handleRequest(wooApi.get(`settings/${group_id}`, { _fields: f.join(',') }), f);
    }
  );

  server.registerTool(
    'update_setting',
    {
      description:
        "Update a single setting value. Use get_settings first to find the setting ID and valid options. Example: group_id='general', setting_id='woocommerce_currency', value='INR'.",
      annotations: { idempotentHint: true, openWorldHint: false },
      inputSchema: {
        group_id: z.string().describe('Setting group ID'),
        setting_id: z.string().describe('Setting ID within the group'),
        value: z.string().describe('New value for the setting'),
        fields: z.string().optional().describe('Comma-separated fields to return in response'),
      },
    },
    async ({ group_id, setting_id, fields, ...data }) => {
      const f = resolveFields(fields, SETTING_FIELDS);
      return await handleRequest(wooApi.put(`settings/${group_id}/${setting_id}`, data), f);
    }
  );
}
