import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  allowedDevOrigins: ["*.trycloudflare.com"],
  async redirects() {
    return [
      {
        source: "/",
        has: [{ type: "query", key: "shop" }],
        destination: "/app",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
