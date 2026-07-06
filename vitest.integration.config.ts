import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/__tests__/**/*.test.ts'],
    exclude: ['**/*.e2e.test.ts', '**/node_modules/**'],
    testTimeout: 30000,
    hookTimeout: 30000,
    globalSetup: './vitest.integration.setup.ts',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'app'),
      '@backend': resolve(__dirname, 'backend'),
      '@frontend': resolve(__dirname, 'frontend'),
    },
  },
});
