import WooCommerceRestApiPkg from '@woocommerce/woocommerce-rest-api';

// Handle CJS default export in ESM context
const WooCommerceRestApi = (WooCommerceRestApiPkg as any).default || WooCommerceRestApiPkg;

const { WORDPRESS_SITE_URL, WOOCOMMERCE_CONSUMER_KEY, WOOCOMMERCE_CONSUMER_SECRET } = process.env;

if (!WORDPRESS_SITE_URL) throw new Error('WORDPRESS_SITE_URL environment variable is required');
if (!WOOCOMMERCE_CONSUMER_KEY)
  throw new Error('WOOCOMMERCE_CONSUMER_KEY environment variable is required');
if (!WOOCOMMERCE_CONSUMER_SECRET)
  throw new Error('WOOCOMMERCE_CONSUMER_SECRET environment variable is required');

export const wooApi = new WooCommerceRestApi({
  url: WORDPRESS_SITE_URL,
  consumerKey: WOOCOMMERCE_CONSUMER_KEY,
  consumerSecret: WOOCOMMERCE_CONSUMER_SECRET,
  version: 'wc/v3',
});
