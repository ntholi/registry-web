import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

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
