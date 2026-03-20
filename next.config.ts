import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	reactCompiler: true,
	experimental: {
		optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
		authInterrupts: true,
		serverActions: {
			bodySizeLimit: '6MB',
		},
	},
	transpilePackages: ['rimraf'],
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'pub-2b37ce26bd70421e9e59e4fe805c6873.r2.dev',
			},
		],
	},
};

export default nextConfig;
