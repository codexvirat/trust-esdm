import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Batch photo uploads go through a server action as multipart FormData,
      // and multiple photos can be submitted in one request.
      bodySizeLimit: "64mb",
    },
    // src/proxy.ts matches every request, so Next also buffers the request
    // body at the proxy layer (separately from serverActions.bodySizeLimit)
    // — must be raised too or multi-photo uploads get truncated there first.
    proxyClientMaxBodySize: "64mb",
  },
};

export default nextConfig;
