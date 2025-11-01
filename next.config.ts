import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	reactCompiler: true,
	experimental: {
		optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
		authInterrupts: true,
		isolatedDevBuild: true,
		serverActions: {
			bodySizeLimit: '3MB',
		},
	},
	transpilePackages: ['rimraf'],
};

export default nextConfig;
