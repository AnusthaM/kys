import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      //for 4-6 document images
      bodySizeLimit: "15mb"
    }
  }
};

export default nextConfig;
