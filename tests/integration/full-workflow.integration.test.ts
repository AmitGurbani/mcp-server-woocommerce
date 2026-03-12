import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createTestClient, parseResult } from './helpers/mcp-client.js';

describe('Full E2E workflow', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  // Track created resources for cleanup even if assertions fail
  let categoryId: number | undefined;
  let productId: number | undefined;
  let customerId: number | undefined;
  let orderId: number | undefined;

  beforeAll(async () => {
    ({ client, cleanup } = await createTestClient());
  });

  afterAll(async () => {
    // Clean up in reverse order, ignore errors
    if (orderId) {
      try {
        await client.callTool({
          name: 'delete_order',
          arguments: { id: orderId, force: true },
        });
      } catch {}
    }
    if (productId) {
      try {
        await client.callTool({
          name: 'delete_product',
          arguments: { id: productId, force: true },
        });
      } catch {}
    }
    if (customerId) {
      try {
        await client.callTool({
          name: 'delete_customer',
          arguments: { id: customerId, force: true },
        });
      } catch {}
    }
    if (categoryId) {
      try {
        await client.callTool({
          name: 'delete_category',
          arguments: { id: categoryId, force: true },
        });
      } catch {}
    }
    await cleanup();
  });

  it('completes a full order lifecycle', async () => {
    // 1. Create a category
    const catResult = await client.callTool({
      name: 'create_category',
      arguments: { name: `E2E Category ${Date.now()}` },
    });
    const category = parseResult(catResult);
    expect(category.id).toBeDefined();
    categoryId = category.id;

    // 2. Create a product in that category
    const productResult = await client.callTool({
      name: 'create_product',
      arguments: {
        name: 'E2E Test Product',
        type: 'simple',
        regular_price: '49.99',
        status: 'publish',
        categories: [{ id: category.id }],
      },
    });
    const product = parseResult(productResult);
    expect(product.id).toBeDefined();
    productId = product.id;

    // 3. Create a customer
    const customerResult = await client.callTool({
      name: 'create_customer',
      arguments: {
        email: `e2e-${Date.now()}@integration.local`,
        first_name: 'E2E',
        last_name: 'Tester',
      },
    });
    const customer = parseResult(customerResult);
    expect(customer.id).toBeDefined();
    customerId = customer.id;

    // 4. Create an order with that product and customer
    const orderResult = await client.callTool({
      name: 'create_order',
      arguments: {
        customer_id: customer.id,
        line_items: [{ product_id: product.id, quantity: 1 }],
      },
    });
    const order = parseResult(orderResult);
    expect(order.id).toBeDefined();
    orderId = order.id;

    // 5. Update order status to completed
    const updateResult = await client.callTool({
      name: 'update_order',
      arguments: { id: order.id, status: 'completed' },
    });
    const updatedOrder = parseResult(updateResult);
    expect(updatedOrder.status).toBe('completed');

    // 6. Verify the order
    const getResult = await client.callTool({
      name: 'get_order',
      arguments: { id: order.id },
    });
    const fetchedOrder = parseResult(getResult);
    expect(fetchedOrder.status).toBe('completed');
    expect(fetchedOrder.total).toBe('49.99');
  });
});
