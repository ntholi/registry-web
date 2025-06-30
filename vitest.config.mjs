import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    env: {
      LOCAL_DATABASE_URL: 'file:test.db',
    },
  },
  optimizeDeps: {
    exclude: ['next', 'next-auth'],
  },
});
