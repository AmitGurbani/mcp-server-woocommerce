import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createTestClient, parseResult } from './helpers/mcp-client.js';

describe('Settings integration', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    ({ client, cleanup } = await createTestClient());
  });

  afterAll(async () => {
    await cleanup();
  });

  it('lists setting groups', async () => {
    const result = await client.callTool({
      name: 'list_setting_groups',
      arguments: {},
    });

    const parsed = parseResult(result);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThanOrEqual(1);
    expect(parsed[0].id).toBeDefined();
  });

  it('gets settings for general group', async () => {
    const result = await client.callTool({
      name: 'get_settings',
      arguments: { group_id: 'general' },
    });

    const parsed = parseResult(result);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThanOrEqual(1);
  });
});
