import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/wang-unit/**/*.test.js'],
    globals: false,
    environment: 'node',
  },
});
