import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createTestClient, parseResult } from './helpers/mcp-client.js';

describe('Categories integration', () => {
  let client: Client;
  let cleanup: () => Promise<void>;
  const createdCategoryIds: number[] = [];

  beforeAll(async () => {
    ({ client, cleanup } = await createTestClient());
  });

  afterAll(async () => {
    for (const id of createdCategoryIds) {
      try {
        await client.callTool({
          name: 'delete_category',
          arguments: { id, force: true },
        });
      } catch {
        // ignore cleanup errors
      }
    }
    await cleanup();
  });

  it('lists categories', async () => {
    const result = await client.callTool({
      name: 'list_categories',
      arguments: { per_page: 10 },
    });

    const parsed = parseResult(result);
    // At least Uncategorized + seeded category
    expect(parsed.data.length).toBeGreaterThanOrEqual(1);
  });

  it('creates, gets, updates, and deletes a category', async () => {
    // Create
    const createResult = await client.callTool({
      name: 'create_category',
      arguments: { name: 'Integration Test Cat' },
    });
    const created = parseResult(createResult);
    expect(created.id).toBeDefined();
    expect(created.name).toBe('Integration Test Cat');
    createdCategoryIds.push(created.id);

    // Get
    const getResult = await client.callTool({
      name: 'get_category',
      arguments: { id: created.id },
    });
    const fetched = parseResult(getResult);
    expect(fetched.id).toBe(created.id);
    expect(fetched.name).toBe('Integration Test Cat');

    // Update
    const updateResult = await client.callTool({
      name: 'update_category',
      arguments: { id: created.id, name: 'Updated Cat Name' },
    });
    const updated = parseResult(updateResult);
    expect(updated.name).toBe('Updated Cat Name');

    // Delete
    const deleteResult = await client.callTool({
      name: 'delete_category',
      arguments: { id: created.id, force: true },
    });
    const deleted = parseResult(deleteResult);
    expect(deleted.id).toBe(created.id);

    // Remove from cleanup list since already deleted
    const idx = createdCategoryIds.indexOf(created.id);
    if (idx !== -1) createdCategoryIds.splice(idx, 1);
  });
});
