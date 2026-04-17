import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/clarity-script/:path*',
        destination: 'https://www.clarity.ms/:path*',
      },
      {
        // মাইক্রোসফটের সব সম্ভাব্য কালেকশন সার্ভারকে কাভার করা
        source: '/clarity-data/:path*',
        destination: 'https://*.clarity.ms/:path*',
      },
    ];
  },
};

export default nextConfig;