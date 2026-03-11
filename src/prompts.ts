import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function registerPrompts(server: McpServer) {
  server.registerPrompt(
    'setup_variable_product',
    {
      description: 'Guided workflow to create a variable product with attributes and variations',
      argsSchema: {
        product_name: z.string().describe('Name of the variable product to create'),
        attribute_name: z
          .string()
          .describe("Attribute for variations (e.g. 'Weight', 'Volume', 'Size')"),
        variations: z.string().describe("Comma-separated variation values (e.g. '500g, 1kg, 2kg')"),
      },
    },
    ({ product_name, attribute_name, variations }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Create a variable product "${product_name}" with ${attribute_name} variations: ${variations}.

Follow these steps in order:

Step 1 — Check/create the global attribute:
- Use list_attributes to check if "${attribute_name}" already exists
- If not, use create_attribute to create it
- Note the attribute ID

Step 2 — Create attribute terms:
- Use list_attribute_terms to check which terms exist for the attribute
- Use batch_update_attribute_terms to create any missing terms from: ${variations}
- Note each term name

Step 3 — Create the variable product:
- Use create_product with:
  - name: "${product_name}"
  - type: "variable"
  - status: "draft" (publish after variations are set up)
  - attributes: [{ id: <attribute_id>, variation: true, visible: true, options: [${variations}] }]
- Note the product ID

Step 4 — Create variations:
- Use batch_update_variations with the product ID
- Create one variation per term, each with:
  - attributes: [{ id: <attribute_id>, option: "<term>" }]
  - regular_price: "<price>"
  - stock_status: "instock"
  - status: "publish"

Step 5 — Publish:
- Use update_product to set status: "publish"
- Use list_variations to verify all variations are created correctly`,
          },
        },
      ],
    })
  );

  server.registerPrompt(
    'process_order',
    {
      description: 'Guided workflow to review and process an order',
      argsSchema: {
        order_id: z.string().describe('Order ID to process'),
      },
    },
    ({ order_id }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Review and process order #${order_id}.

Step 1 — Get order details:
- Use get_order with id: ${order_id}
- Review: status, line items, billing info, payment method, total

Step 2 — Decide next status:
- If pending and payment confirmed -> update to "processing"
- If processing and fulfilled -> update to "completed"
- If issue found -> update to "on-hold" with a customer_note explaining why

Step 3 — Update the order:
- Use update_order with the new status
- Add a customer_note if relevant

Show me the order details and recommend the appropriate next action.`,
          },
        },
      ],
    })
  );

  server.registerPrompt(
    'handle_refund',
    {
      description: 'Guided workflow to process a refund for an order',
      argsSchema: {
        order_id: z.string().describe('Order ID to refund'),
        refund_type: z.enum(['full', 'partial']).describe('Full or partial refund'),
      },
    },
    ({ order_id, refund_type }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Process a ${refund_type} refund for order #${order_id}.

Step 1 — Review the order:
- Use get_order with id: ${order_id}, fields: "id,status,total,line_items,payment_method,refunds"
- Check the current status, total amount, and any existing refunds

Step 2 — Check existing refunds:
- Use list_order_refunds with order_id: ${order_id}
- Calculate how much has already been refunded
- Determine remaining refundable amount

Step 3 — Process the refund:
${refund_type === 'full' ? `- Use create_order_refund with order_id: ${order_id} (omit amount for full refund)` : `- Ask for the specific amount and/or line items to refund
- Use create_order_refund with order_id: ${order_id}, amount: "<amount>", and optionally line_items`}
- Include a reason for the refund
- api_refund=true will automatically refund via the payment gateway

Step 4 — Verify the result:
- Use list_order_refunds with order_id: ${order_id} to confirm the refund was created
- Use get_order with id: ${order_id}, fields: "id,status,total,refunds" to check updated order status

Show the order details and guide me through the refund process.`,
          },
        },
      ],
    })
  );

  server.registerPrompt(
    'moderate_reviews',
    {
      description: 'Guided workflow to moderate pending product reviews',
    },
    async () => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Moderate pending product reviews.

Step 1 — Fetch pending reviews:
- Use list_product_reviews with status: "hold" to get all reviews awaiting moderation
- Show each review with: reviewer name, product name, rating, review text

Step 2 — Evaluate each review:
- For each pending review, assess:
  - Is it a genuine customer review? (approve)
  - Is it spam or promotional? (mark as spam)
  - Is it inappropriate or offensive? (trash)
  - Is it a legitimate but negative review? (still approve — honest feedback is valuable)

Step 3 — Take action:
- Use update_product_review to change status for each review:
  - "approved" for genuine reviews
  - "spam" for spam/promotional content
  - "trash" for inappropriate content

Step 4 — Summarize:
- Report how many reviews were: approved, marked as spam, trashed
- Highlight any reviews that need human judgment

Show me all pending reviews and recommend actions for each.`,
          },
        },
      ],
    })
  );

  server.registerPrompt(
    'catalog_overview',
    {
      description: 'Get a quick overview of the product catalog, categories, and recent orders',
    },
    async () => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Give me a quick overview of the store. Run these in parallel:

1. Use get_product_totals to see product counts by status
2. Use get_order_totals to see order counts by status
3. Use get_customer_totals to see customer counts
4. Use list_categories with per_page: 100, fields: "id,name,count" to see category breakdown
5. Use get_top_sellers with period: "month" to see this month's top sellers

Summarize the results in a clear dashboard format showing:
- Total products (published vs draft)
- Total orders (by status)
- Total customers
- Top 5 categories by product count
- Top 5 sellers this month`,
          },
        },
      ],
    })
  );
}
