import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerProductTools } from './tools/products.js';
import { registerCategoryTools } from './tools/categories.js';
import { registerOrderTools } from './tools/orders.js';
import { registerCustomerTools } from './tools/customers.js';
import { registerCouponTools } from './tools/coupons.js';
import { registerReportTools } from './tools/reports.js';
import { registerMediaTools } from './tools/media.js';
import { registerAttributeTools } from './tools/attributes.js';
import { registerVariationTools } from './tools/variations.js';
import { registerTagTools } from './tools/tags.js';
import { registerBrandTools } from './tools/brands.js';
import { registerShippingTools } from './tools/shipping.js';
import { registerTaxTools } from './tools/taxes.js';
import { registerWebhookTools } from './tools/webhooks.js';
import { registerSettingsTools } from './tools/settings.js';
import { registerRefundTools } from './tools/refunds.js';
import { registerOrderNoteTools } from './tools/order-notes.js';
import { registerPaymentGatewayTools } from './tools/payment-gateways.js';
import { registerReviewTools } from './tools/reviews.js';
import { registerSystemStatusTools } from './tools/system-status.js';
import { registerDataTools } from './tools/data.js';
import { registerResources } from './resources.js';
import { registerPrompts } from './prompts.js';

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'mcp-server-woocommerce',
    version: '1.0.0',
  });

  registerProductTools(server);
  registerCategoryTools(server);
  registerOrderTools(server);
  registerCustomerTools(server);
  registerCouponTools(server);
  registerReportTools(server);
  registerMediaTools(server);
  registerAttributeTools(server);
  registerVariationTools(server);
  registerTagTools(server);
  registerBrandTools(server);
  registerShippingTools(server);
  registerTaxTools(server);
  registerWebhookTools(server);
  registerSettingsTools(server);
  registerRefundTools(server);
  registerOrderNoteTools(server);
  registerPaymentGatewayTools(server);
  registerReviewTools(server);
  registerSystemStatusTools(server);
  registerDataTools(server);
  registerResources(server);
  registerPrompts(server);

  return server;
}

export const server = createServer();
