import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/integration/**/*.integration.test.ts'],
    globalSetup: ['tests/integration/global-setup.ts'],
    setupFiles: ['tests/integration/helpers/load-env.ts'],
    testTimeout: 30_000,
    hookTimeout: 600_000,
  },
});
