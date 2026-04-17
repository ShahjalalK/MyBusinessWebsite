import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/clarity-script/:path*',
        destination: 'https://www.clarity.ms/:path*',
      },
      {
        // মাইক্রোসফটের কালেকশন সার্ভারকে আপনার ডোমেইনের সাথে ম্যাপ করা
        source: '/clarity-data/:path*',
        destination: 'https://l.clarity.ms/:path*',
      },
    ];
  },
};

export default nextConfig;