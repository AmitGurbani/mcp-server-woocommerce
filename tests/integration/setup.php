<?php
/**
 * Integration test setup script.
 * Creates WooCommerce API keys, WordPress app password, and seeds test data.
 * Run via: npx wp-env run cli -- wp eval-file wp-content/integration-tests/setup.php --allow-root
 */

// Create WooCommerce REST API keys
global $wpdb;

$consumer_key    = 'ck_' . bin2hex( random_bytes( 20 ) );
$consumer_secret = 'cs_' . bin2hex( random_bytes( 20 ) );

$result = $wpdb->insert(
	$wpdb->prefix . 'woocommerce_api_keys',
	array(
		'user_id'         => 1,
		'description'     => 'Integration Tests',
		'permissions'     => 'read_write',
		'consumer_key'    => wc_api_hash( $consumer_key ),
		'consumer_secret' => $consumer_secret,
		'truncated_key'   => substr( $consumer_key, -7 ),
	)
);

if ( false === $result ) {
	fwrite( STDERR, 'ERROR: Failed to insert API key: ' . $wpdb->last_error . PHP_EOL );
	exit( 1 );
}

// Create WordPress Application Password (for media tools)
$app_password_result = WP_Application_Passwords::create_new_application_password(
	1,
	array( 'name' => 'Integration Tests' )
);
$app_password = is_wp_error( $app_password_result ) ? '' : $app_password_result[0];

// Seed test data: category
wp_insert_term( 'Integration Test Category', 'product_cat' );

// Seed test data: simple product (skip if already exists)
$existing_products = wc_get_products( array( 'name' => 'Test Product Simple', 'limit' => 1 ) );
if ( empty( $existing_products ) ) {
	$product = new WC_Product_Simple();
	$product->set_name( 'Test Product Simple' );
	$product->set_regular_price( '19.99' );
	$product->set_status( 'publish' );
	$product->save();
}

// Seed test data: customer (skip if email already exists)
if ( ! email_exists( 'test@integration.local' ) ) {
	$customer = new WC_Customer();
	$customer->set_email( 'test@integration.local' );
	$customer->set_first_name( 'Test' );
	$customer->set_last_name( 'Customer' );
	$customer->save();
}

// Output credentials for parsing
echo 'WOO_CONSUMER_KEY=' . $consumer_key . PHP_EOL;
echo 'WOO_CONSUMER_SECRET=' . $consumer_secret . PHP_EOL;
echo 'WP_APP_PASSWORD=' . $app_password . PHP_EOL;
