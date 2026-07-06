import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.ts'],
    exclude: ['**/*.e2e.test.ts', '**/node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'backend/lib/**',
        'backend/services/**',
        'backend/workers/**',
        'backend/middleware/**',
        'app/api/**',
      ],
      exclude: [
        '**/*.test.ts',
        '**/__tests__/**',
        '**/node_modules/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    restoreMocks: false,
    clearMocks: true,
    mockReset: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'app'),
      '@backend': resolve(__dirname, 'backend'),
      '@frontend': resolve(__dirname, 'frontend'),
    },
  },
});
