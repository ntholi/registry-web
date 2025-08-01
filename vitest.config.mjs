import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
  },
  optimizeDeps: {
    exclude: ['next', 'next-auth'],
  },
});
