import { execSync } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const PROJECT_ROOT = resolve(import.meta.dirname, '../..');
const ENV_FILE = resolve(PROJECT_ROOT, '.integration-env');
const WP_URL = 'http://localhost:8888';

let weStartedWpEnv = false;

async function isWpEnvRunning(): Promise<boolean> {
  try {
    const response = await fetch(WP_URL, { signal: AbortSignal.timeout(3000) });
    return response.ok || response.status === 302;
  } catch {
    return false;
  }
}

function parseCredentials(output: string): Record<string, string> {
  const creds: Record<string, string> = {};
  for (const line of output.split('\n')) {
    const match = line.match(/^(WOO_CONSUMER_KEY|WOO_CONSUMER_SECRET|WP_APP_PASSWORD)=(.+)$/);
    if (match) {
      creds[match[1]] = match[2];
    }
  }
  return creds;
}

export async function setup() {
  if (process.env.WOOCOMMERCE_MCP_READ_ONLY === 'true') {
    throw new Error(
      'Integration tests require write access. Unset WOOCOMMERCE_MCP_READ_ONLY to run.'
    );
  }

  const running = await isWpEnvRunning();

  if (!running) {
    console.log('Starting wp-env...');
    execSync('npx wp-env start', { cwd: PROJECT_ROOT, stdio: 'inherit', timeout: 600_000 });
    weStartedWpEnv = true;

    // Wait for WooCommerce to fully initialize
    await new Promise((r) => setTimeout(r, 5000));
  } else {
    console.log('wp-env already running');
  }

  if (!existsSync(ENV_FILE)) {
    console.log('Running WooCommerce setup...');

    // Set pretty permalinks (required for REST API)
    execSync('npx wp-env run cli -- wp rewrite structure "/%postname%/" --allow-root', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      timeout: 30_000,
    });
    execSync('npx wp-env run cli -- wp rewrite flush --allow-root', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      timeout: 30_000,
    });

    // Run PHP setup script (mounted via .wp-env.json mappings)
    const output = execSync(
      'npx wp-env run cli -- wp eval-file wp-content/integration-tests/setup.php --allow-root',
      {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8',
        timeout: 60_000,
        stdio: ['pipe', 'pipe', 'inherit'],
      }
    );

    const creds = parseCredentials(output);

    if (!creds.WOO_CONSUMER_KEY || !creds.WOO_CONSUMER_SECRET) {
      throw new Error('Failed to parse WooCommerce API credentials from setup output');
    }

    const envContent = [
      `WORDPRESS_SITE_URL=${WP_URL}`,
      `WOOCOMMERCE_CONSUMER_KEY=${creds.WOO_CONSUMER_KEY}`,
      `WOOCOMMERCE_CONSUMER_SECRET=${creds.WOO_CONSUMER_SECRET}`,
      `WORDPRESS_USERNAME=admin`,
      `WORDPRESS_APP_PASSWORD=${creds.WP_APP_PASSWORD || ''}`,
    ].join('\n');

    writeFileSync(ENV_FILE, envContent);
    console.log('Credentials written to .integration-env');
  } else {
    console.log('Using existing .integration-env');
  }
}

export async function teardown() {
  if (weStartedWpEnv) {
    try {
      console.log('Stopping wp-env...');
      execSync('npx wp-env stop', {
        cwd: PROJECT_ROOT,
        stdio: 'inherit',
        timeout: 30_000,
      });
    } catch {
      console.error(
        'Warning: Failed to stop wp-env. You may need to run "npx wp-env stop" manually.'
      );
    }
  }
}
