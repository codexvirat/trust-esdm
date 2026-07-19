import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Batch photo uploads go through a server action as multipart FormData.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
