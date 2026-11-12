import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/cong-cu/du-tru-chi-phi",
        destination: "/cong-cu/bang-tinh-dam-cuoi",
        statusCode: 301,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(templates|photos|images)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

