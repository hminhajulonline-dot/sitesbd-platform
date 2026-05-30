import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@sitesbd/shared', '@sitesbd/ui'],
};

export default nextConfig;
