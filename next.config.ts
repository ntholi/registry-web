import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  turbopack: {
    // Set the Turbopack root to this project directory to avoid
    // Next.js picking a different lockfile in the user's home.
    root: path.join(__dirname),
  },
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
