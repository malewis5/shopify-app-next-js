import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;
