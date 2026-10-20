import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    dirs: ['src', 'pages', 'components', 'lib', 'utils'],
  },
};

export default nextConfig;
