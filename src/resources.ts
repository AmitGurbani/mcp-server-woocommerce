import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerResources(server: McpServer) {
  server.registerResource(
    'Product Schema',
    'woo://schema/product',
    { description: 'Product field reference for WooCommerce REST API' },
    async () => ({
      contents: [
        {
          uri: 'woo://schema/product',
          mimeType: 'text/plain',
          text: `WooCommerce Product Fields:

Core: id, name, slug, type, status, sku, price, regular_price, sale_price
Stock: stock_status (instock|outofstock|onbackorder), stock_quantity, manage_stock
Content: description, short_description
Taxonomy: categories [{id}], tags [{id}], brands [{id}]
Media: images [{id, src}]
Attributes: attributes [{id, name, options[], visible, variation}]
Variations: variations [id[]], default_attributes [{id, name, option}]
Meta: weight, virtual, downloadable

Types: simple (default), variable (requires attributes + variations), grouped, external
Statuses: draft (default for create), pending, private, publish

Key rules:
- Variable products need type="variable", attributes with variation=true, then create variations separately
- Setting images replaces ALL existing images
- sale_price must be less than regular_price
- SKU must be unique across all products`,
        },
      ],
    })
  );

  server.registerResource(
    'Order Schema',
    'woo://schema/order',
    { description: 'Order field reference for WooCommerce REST API' },
    async () => ({
      contents: [
        {
          uri: 'woo://schema/order',
          mimeType: 'text/plain',
          text: `WooCommerce Order Fields:

Core: id, number, status, date_created, currency, total, total_tax
Customer: customer_id (0=guest), billing {first_name, last_name, address_1, city, state, postcode, country, email, phone}
Shipping: shipping {first_name, last_name, address_1, city, state, postcode, country}
Items: line_items [{product_id, quantity, variation_id, subtotal, total}]
Payment: payment_method, payment_method_title, set_paid
Discounts: discount_total, coupon_lines [{code}]
Notes: customer_note
Totals: shipping_total, discount_total, cart_tax

Statuses: pending -> processing -> on-hold -> completed | cancelled | refunded | failed
- pending: Awaiting payment
- processing: Payment received, awaiting fulfillment
- on-hold: Awaiting confirmation (e.g. bank transfer)
- completed: Order fulfilled and complete
- cancelled: Cancelled by admin or customer
- refunded: Fully refunded
- failed: Payment failed or declined`,
        },
      ],
    })
  );

  server.registerResource(
    'Coupon Schema',
    'woo://schema/coupon',
    { description: 'Coupon field reference for WooCommerce REST API' },
    async () => ({
      contents: [
        {
          uri: 'woo://schema/coupon',
          mimeType: 'text/plain',
          text: `WooCommerce Coupon Fields:

Core: id, code (unique), discount_type, amount, date_expires
Types: percent (% off cart), fixed_cart ($ off cart), fixed_product ($ off per item)
Limits: usage_limit (total), usage_limit_per_user, usage_count (read-only)
Restrictions: minimum_amount, maximum_amount, individual_use (can't combine)
Products: product_ids (include), excluded_product_ids (exclude)
Shipping: free_shipping (grants free shipping)

Key rules:
- Code must be unique and case-insensitive
- amount is a string (e.g. "10" for 10% or $10)
- date_expires uses ISO 8601 format`,
        },
      ],
    })
  );

  server.registerResource(
    'Product Types Reference',
    'woo://reference/product-types',
    { description: 'When to use each WooCommerce product type' },
    async () => ({
      contents: [
        {
          uri: 'woo://reference/product-types',
          mimeType: 'text/plain',
          text: `WooCommerce Product Types:

SIMPLE — A single product with one price/SKU. Use for most products.
  Example: "Maggi 2-Minute Noodles 70g" at Rs 14

VARIABLE — A product with multiple variants (size, weight, color).
  Each variation has its own price, SKU, and stock.
  Setup: 1) Create global attributes + terms, 2) Create product with type=variable and attributes, 3) Create variations
  Example: "Tata Salt" with variations 1kg (Rs 28) and 2kg (Rs 52)

GROUPED — A collection of simple products displayed together.
  No price of its own; each child has its own price.
  Example: "Bathroom Essentials" grouping soap, shampoo, toothpaste

EXTERNAL — A product sold on another website.
  Has a "Buy" button linking to external URL.
  Example: An affiliate product linking to Amazon`,
        },
      ],
    })
  );

  server.registerResource(
    'Refund Schema',
    'woo://schema/refund',
    { description: 'Refund field reference for WooCommerce REST API' },
    async () => ({
      contents: [
        {
          uri: 'woo://schema/refund',
          mimeType: 'text/plain',
          text: `WooCommerce Refund Fields:

Core: id, date_created, amount, reason, refunded_by
Line Items: line_items [{id, refund_total, quantity}]
Payment: refunded_payment (boolean)

Refund lifecycle:
- api_refund=true (default): Automatically refunds via the payment gateway
- api_refund=false: Records the refund in WooCommerce only (manual refund)

Partial vs full refund:
- Omit amount to refund the full order total
- Specify amount as a string (e.g. "15.00") for partial refund
- Use line_items to refund specific items: id is the order line item ID, not the product ID

Key rules:
- amount is a string, not a number
- line_items.id refers to the order's line_items[].id, not the product_id
- Multiple partial refunds can be issued against the same order
- Deleting a refund removes the record but does NOT reverse the payment`,
        },
      ],
    })
  );

  server.registerResource(
    'Payment Gateways Reference',
    'woo://reference/payment-gateways',
    { description: 'Payment gateway IDs and concepts for WooCommerce' },
    async () => ({
      contents: [
        {
          uri: 'woo://reference/payment-gateways',
          mimeType: 'text/plain',
          text: `WooCommerce Payment Gateways:

Built-in gateway IDs:
- bacs: Direct bank transfer (manual payment)
- cheque: Check payments (manual payment)
- cod: Cash on delivery
- paypal: PayPal Standard

Common plugin gateway IDs:
- stripe: Stripe (credit cards, Apple Pay, Google Pay)
- razorpay: Razorpay (UPI, cards, netbanking — popular in India)

Key concepts:
- Gateways are provided by plugins — cannot create or delete via API
- Use list_payment_gateways to see all available gateways
- Gateway IDs are strings (not numbers)
- Use update_payment_gateway to enable/disable or change settings
- Settings are key-value string pairs specific to each gateway
- order field controls display order at checkout`,
        },
      ],
    })
  );

  server.registerResource(
    'Order Statuses Reference',
    'woo://reference/order-statuses',
    { description: 'Order status lifecycle and transitions' },
    async () => ({
      contents: [
        {
          uri: 'woo://reference/order-statuses',
          mimeType: 'text/plain',
          text: `WooCommerce Order Status Lifecycle:

  pending ──> processing ──> completed
     │            │
     │            └──> on-hold ──> processing
     │
     └──> failed
     └──> cancelled

Status transitions:
- New orders start as "pending" (awaiting payment)
- After payment: "pending" -> "processing"
- For manual payments (bank transfer): "pending" -> "on-hold" -> "processing"
- After fulfillment: "processing" -> "completed"
- Admin can cancel: any status -> "cancelled"
- Payment fails: "pending" -> "failed"
- Refund: "completed" -> "refunded"

Use update_order to change status. Use get_order_totals to see counts per status.`,
        },
      ],
    })
  );
}
