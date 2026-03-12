import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createTestClient, parseResult } from './helpers/mcp-client.js';

describe('Customers integration', () => {
  let client: Client;
  let cleanup: () => Promise<void>;
  const createdCustomerIds: number[] = [];

  beforeAll(async () => {
    ({ client, cleanup } = await createTestClient());
  });

  afterAll(async () => {
    for (const id of createdCustomerIds) {
      try {
        await client.callTool({
          name: 'delete_customer',
          arguments: { id, force: true },
        });
      } catch {
        // ignore cleanup errors
      }
    }
    await cleanup();
  });

  it('lists customers', async () => {
    const result = await client.callTool({
      name: 'list_customers',
      arguments: { per_page: 10 },
    });

    const parsed = parseResult(result);
    // At least the seeded test customer
    expect(parsed.data.length).toBeGreaterThanOrEqual(1);
  });

  it('creates and retrieves a customer', async () => {
    const uniqueEmail = `test-${Date.now()}@integration.local`;

    const createResult = await client.callTool({
      name: 'create_customer',
      arguments: {
        email: uniqueEmail,
        first_name: 'Integration',
        last_name: 'Customer',
      },
    });
    const created = parseResult(createResult);
    expect(created.id).toBeDefined();
    expect(created.email).toBe(uniqueEmail);
    createdCustomerIds.push(created.id);

    const getResult = await client.callTool({
      name: 'get_customer',
      arguments: { id: created.id },
    });
    const fetched = parseResult(getResult);
    expect(fetched.id).toBe(created.id);
    expect(fetched.first_name).toBe('Integration');
    expect(fetched.last_name).toBe('Customer');
  });
});
