import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "tip-s3-bucket.s3.us-west-1.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
