import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@sitesbd/shared', '@sitesbd/ui', '@sitesbd/auth'],
};

export default nextConfig;
