import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createTestClient, parseResult } from './helpers/mcp-client.js';

describe('Tags integration', () => {
  let client: Client;
  let cleanup: () => Promise<void>;
  const createdTagIds: number[] = [];

  beforeAll(async () => {
    ({ client, cleanup } = await createTestClient());
  });

  afterAll(async () => {
    for (const id of createdTagIds) {
      try {
        await client.callTool({
          name: 'delete_tag',
          arguments: { id, force: true },
        });
      } catch {
        // ignore cleanup errors
      }
    }
    await cleanup();
  });

  it('lists tags and manages tag lifecycle', async () => {
    const tagName = `Test Tag ${Date.now()}`;

    // Create
    const createResult = await client.callTool({
      name: 'create_tag',
      arguments: { name: tagName },
    });
    const created = parseResult(createResult);
    expect(created.id).toBeDefined();
    createdTagIds.push(created.id);
    expect(created.name).toBe(tagName);

    // List and verify it appears
    const listResult = await client.callTool({
      name: 'list_tags',
      arguments: { search: tagName, per_page: 10 },
    });
    const listed = parseResult(listResult);
    const found = listed.data.find((t: any) => t.id === created.id);
    expect(found).toBeDefined();

    // Delete
    const deleteResult = await client.callTool({
      name: 'delete_tag',
      arguments: { id: created.id, force: true },
    });
    const deleted = parseResult(deleteResult);
    expect(deleted.id).toBe(created.id);
  });
});
