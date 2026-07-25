import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Batch photo uploads go through a server action as multipart FormData,
      // and multiple photos can be submitted in one request.
      bodySizeLimit: "64mb",
    },
  },
};

export default nextConfig;
