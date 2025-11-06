import { config } from 'dotenv';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

config({ path: '.env.test' });

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		environment: 'node',
		setupFiles: ['./src/test/setup.ts'],
		testTimeout: 30000,
		hookTimeout: 30000,
		fileParallelism: false,
		pool: 'forks',
		poolOptions: {
			forks: {
				singleFork: true,
			},
		},
	},
	optimizeDeps: {
		exclude: ['next', 'next-auth'],
	},
});
