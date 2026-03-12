import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createTestClient, parseResult } from './helpers/mcp-client.js';

describe('Products integration', () => {
  let client: Client;
  let cleanup: () => Promise<void>;
  const createdProductIds: number[] = [];

  beforeAll(async () => {
    ({ client, cleanup } = await createTestClient());
  });

  afterAll(async () => {
    for (const id of createdProductIds) {
      try {
        await client.callTool({ name: 'delete_product', arguments: { id, force: true } });
      } catch {
        // ignore cleanup errors
      }
    }
    await cleanup();
  });

  it('lists products from the store', async () => {
    const result = await client.callTool({
      name: 'list_products',
      arguments: { per_page: 10 },
    });

    const parsed = parseResult(result);
    expect(parsed.pagination).toBeDefined();
    expect(parsed.data.length).toBeGreaterThanOrEqual(1);
  });

  it('creates a product and retrieves it', async () => {
    const createResult = await client.callTool({
      name: 'create_product',
      arguments: {
        name: 'Integration Test Product',
        type: 'simple',
        regular_price: '25.00',
        status: 'publish',
      },
    });

    const created = parseResult(createResult);
    expect(created.id).toBeDefined();
    expect(created.name).toBe('Integration Test Product');
    createdProductIds.push(created.id);

    const getResult = await client.callTool({
      name: 'get_product',
      arguments: { id: created.id },
    });

    const fetched = parseResult(getResult);
    expect(fetched.id).toBe(created.id);
    expect(fetched.name).toBe('Integration Test Product');
    expect(fetched.regular_price).toBe('25.00');
  });

  it('updates a product', async () => {
    const createResult = await client.callTool({
      name: 'create_product',
      arguments: {
        name: 'Product To Update',
        type: 'simple',
        regular_price: '30.00',
        status: 'publish',
      },
    });

    const created = parseResult(createResult);
    createdProductIds.push(created.id);

    const updateResult = await client.callTool({
      name: 'update_product',
      arguments: {
        id: created.id,
        name: 'Updated Product Name',
        sale_price: '24.99',
      },
    });

    const updated = parseResult(updateResult);
    expect(updated.name).toBe('Updated Product Name');
    expect(updated.sale_price).toBe('24.99');
  });

  it('filters fields', async () => {
    const result = await client.callTool({
      name: 'list_products',
      arguments: { per_page: 5, fields: 'id,name' },
    });

    const parsed = parseResult(result);
    expect(parsed.data.length).toBeGreaterThanOrEqual(1);
    for (const item of parsed.data) {
      const keys = Object.keys(item);
      expect(keys).toContain('id');
      expect(keys).toContain('name');
      expect(keys.length).toBe(2);
    }
  });

  it('handles errors for non-existent product', async () => {
    const result = await client.callTool({
      name: 'get_product',
      arguments: { id: 999999 },
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text).toBeDefined();
  });
});
