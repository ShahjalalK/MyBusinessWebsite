import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/clarity-script/:path*',
        destination: 'https://www.clarity.ms/:path*',
      },
      {
        // এই লাইনটি খুবই গুরুত্বপূর্ণ
        source: '/clarity-data/:path*',
        destination: 'https://l.clarity.ms/:path*', 
      },
    ];
  },
};

export default nextConfig;