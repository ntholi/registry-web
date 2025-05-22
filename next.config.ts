import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
    authInterrupts: true,
    serverActions: {
      bodySizeLimit: '3MB',
    },
  },
  transpilePackages: ['rimraf'],
};

export default nextConfig;
