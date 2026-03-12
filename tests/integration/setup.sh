#!/bin/bash
set -e

# Set pretty permalinks (required for REST API)
wp rewrite structure '/%postname%/' --allow-root
wp rewrite flush --allow-root

# Create WooCommerce REST API keys
KEYS=$(wp wc api_key create \
  --user=admin \
  --description="Integration Tests" \
  --permissions=read_write \
  --format=json \
  --allow-root 2>/dev/null)

# Parse JSON using PHP (available in WordPress container, more reliable than grep/cut)
CONSUMER_KEY=$(echo "$KEYS" | php -r '$d=json_decode(stream_get_contents(STDIN));echo $d->consumer_key;')
CONSUMER_SECRET=$(echo "$KEYS" | php -r '$d=json_decode(stream_get_contents(STDIN));echo $d->consumer_secret;')

# Create WordPress application password for media tests
APP_PASSWORD=$(wp user application-password create admin "integration-tests" --porcelain --allow-root 2>/dev/null)

# Seed minimal test data
wp wc product_cat create --name="Integration Test Category" --allow-root 2>/dev/null || true
wp wc product create \
  --name="Test Product Simple" \
  --type=simple \
  --regular_price=19.99 \
  --status=publish \
  --allow-root 2>/dev/null || true
wp wc customer create \
  --user=admin \
  --email="test@integration.local" \
  --first_name="Test" \
  --last_name="Customer" \
  --allow-root 2>/dev/null || true

# Output credentials
echo "WOO_CONSUMER_KEY=$CONSUMER_KEY"
echo "WOO_CONSUMER_SECRET=$CONSUMER_SECRET"
echo "WP_APP_PASSWORD=$APP_PASSWORD"
