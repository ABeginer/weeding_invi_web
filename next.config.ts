import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import fs from "node:fs";
import path from "node:path";

// Ensure .env.local takes precedence over stale OS/process environment variables in development
if (process.env.NODE_ENV !== "production") {
  try {
    const envLocalPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envLocalPath)) {
      const lines = fs.readFileSync(envLocalPath, "utf-8").split(/\r?\n/);
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;
        const eqIdx = line.indexOf("=");
        if (eqIdx !== -1) {
          const key = line.slice(0, eqIdx).trim();
          const val = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
          process.env[key] = val;
        }
      }
    }
  } catch (err) {
    console.warn("Could not load .env.local overrides:", err);
  }
}

// Chỉ khởi động Miniflare/workerd cho `next dev`: khi build production thì
// binding do Cloudflare cung cấp lúc chạy, không cần (và workerd không khởi
// động được trong môi trường build bị giới hạn quyền).
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}

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
    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Next.js chèn bootstrap inline; Turnstile và Cloudflare Analytics cần domain riêng.
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
      "connect-src 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
      "frame-src 'self' https://www.google.com https://maps.google.com https://challenges.cloudflare.com",
      "worker-src 'self' blob:",
      "media-src 'self'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
        ],
      },
      {
        source: "/(templates|photos|images|media)/:path*",
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

