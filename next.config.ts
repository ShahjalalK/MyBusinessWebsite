import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/clarity-script/:path*',
        destination: 'https://www.clarity.ms/:path*',
      },
      {
        // এটি মাইক্রোসফটের সব সাব-ডোমেইনকে আপনার সাইটের সাথে কানেক্ট করবে
        source: '/clarity-data/:path*',
        destination: 'https://*.clarity.ms/:path*',
      },
    ];
  },
};

export default nextConfig;