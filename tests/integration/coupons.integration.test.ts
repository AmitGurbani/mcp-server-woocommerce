import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createTestClient, parseResult } from './helpers/mcp-client.js';

describe('Coupons integration', () => {
  let client: Client;
  let cleanup: () => Promise<void>;
  const createdCouponIds: number[] = [];

  beforeAll(async () => {
    ({ client, cleanup } = await createTestClient());
  });

  afterAll(async () => {
    for (const id of createdCouponIds) {
      try {
        await client.callTool({
          name: 'delete_coupon',
          arguments: { id, force: true },
        });
      } catch {
        // ignore cleanup errors
      }
    }
    await cleanup();
  });

  it('creates, gets, and deletes a coupon', async () => {
    const couponCode = `TEST-${Date.now()}`;

    // Create
    const createResult = await client.callTool({
      name: 'create_coupon',
      arguments: {
        code: couponCode,
        discount_type: 'percent',
        amount: '10',
      },
    });
    const created = parseResult(createResult);
    expect(created.id).toBeDefined();
    expect(created.code).toBe(couponCode.toLowerCase());
    createdCouponIds.push(created.id);

    // Get
    const getResult = await client.callTool({
      name: 'get_coupon',
      arguments: { id: created.id },
    });
    const fetched = parseResult(getResult);
    expect(fetched.id).toBe(created.id);
    expect(fetched.discount_type).toBe('percent');
    expect(fetched.amount).toBe('10.00');

    // Delete
    const deleteResult = await client.callTool({
      name: 'delete_coupon',
      arguments: { id: created.id, force: true },
    });
    const deleted = parseResult(deleteResult);
    expect(deleted.id).toBe(created.id);

    // Remove from cleanup list since already deleted
    const idx = createdCouponIds.indexOf(created.id);
    if (idx !== -1) createdCouponIds.splice(idx, 1);
  });
});
