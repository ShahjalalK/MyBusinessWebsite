import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/clarity-script/:path*',
        destination: 'https://www.clarity.ms/:path*',
      },
      {
        source: '/clarity-data/:path*',
        destination: 'https://*.b.clarity.ms/:path*',
      },
    ];
  },
};

export default nextConfig;