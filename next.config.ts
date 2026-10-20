import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during production build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript checks during build (we'll check separately)
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
