import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createTestClient, parseResult } from './helpers/mcp-client.js';

describe('Orders integration', () => {
  let client: Client;
  let cleanup: () => Promise<void>;
  let seedProductId: number;
  const createdOrderIds: number[] = [];

  beforeAll(async () => {
    ({ client, cleanup } = await createTestClient());

    // Find seed product by name for deterministic results
    const productsResult = await client.callTool({
      name: 'list_products',
      arguments: { search: 'Test Product Simple', per_page: 1, fields: 'id' },
    });
    const products = parseResult(productsResult);
    seedProductId = products.data[0].id;
  });

  afterAll(async () => {
    for (const id of createdOrderIds) {
      try {
        await client.callTool({
          name: 'update_order',
          arguments: { id, status: 'cancelled' },
        });
      } catch {
        // ignore cleanup errors
      }
    }
    await cleanup();
  });

  it('creates an order with line items', async () => {
    const result = await client.callTool({
      name: 'create_order',
      arguments: {
        line_items: [{ product_id: seedProductId, quantity: 2 }],
      },
    });

    const order = parseResult(result);
    expect(order.id).toBeDefined();
    expect(order.status).toBeDefined();
    createdOrderIds.push(order.id);
  });

  it('gets an order', async () => {
    // Create an order first
    const createResult = await client.callTool({
      name: 'create_order',
      arguments: {
        line_items: [{ product_id: seedProductId, quantity: 1 }],
      },
    });
    const created = parseResult(createResult);
    createdOrderIds.push(created.id);

    const getResult = await client.callTool({
      name: 'get_order',
      arguments: { id: created.id },
    });
    const fetched = parseResult(getResult);
    expect(fetched.id).toBe(created.id);
    expect(fetched.line_items).toBeDefined();
    expect(fetched.line_items.length).toBeGreaterThanOrEqual(1);
  });

  it('updates order status', async () => {
    // Create an order first
    const createResult = await client.callTool({
      name: 'create_order',
      arguments: {
        line_items: [{ product_id: seedProductId, quantity: 1 }],
      },
    });
    const created = parseResult(createResult);
    createdOrderIds.push(created.id);

    const updateResult = await client.callTool({
      name: 'update_order',
      arguments: { id: created.id, status: 'processing' },
    });
    const updated = parseResult(updateResult);
    expect(updated.status).toBe('processing');
  });
});
