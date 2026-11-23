import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import fs from "node:fs";
import os from "node:os";
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
//
// Trên Windows, workerd không tạo được thư mục state trong project nếu project
// nằm ở Desktop/OneDrive (Defender Controlled Folder Access) — lỗi
// "CreateDirectory: Access is denied; path = miniflare-email-store". Vì vậy
// state của Miniflare được đặt trong thư mục tạm của hệ điều hành.
// Đặt CLOUDFLARE_DEV_BINDINGS=0 để tắt hẳn (khi đó /media sẽ không đọc được R2).
if (process.env.NODE_ENV === "development" && process.env.CLOUDFLARE_DEV_BINDINGS !== "0") {
  void initOpenNextCloudflareForDev({
    persist: { path: path.join(os.tmpdir(), "inviwedd-miniflare") },
  }).catch((error: unknown) => {
    const reason = error instanceof Error ? error.message.split("\n")[0] : String(error);
    console.warn(
      `[cloudflare] Bỏ qua binding dev vì Miniflare/workerd không khởi động được: ${reason}\n` +
      "  → /media/[...key] sẽ trả 404 trong dev (ảnh trên thiệp không hiển thị).\n" +
      "  → Trên Windows: chuyển project ra khỏi Desktop/OneDrive, hoặc thêm workerd.exe vào\n" +
      "    Windows Security → Ransomware protection → Allow an app.\n" +
      "  → Hoặc đặt CLOUDFLARE_DEV_BINDINGS=0 để tắt hẳn và không hiện cảnh báo này.",
    );
  });
}

const nextConfig: NextConfig = {
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/cong-cu/du-tru-chi-phi",
        destination: "/cong-cu/bang-tinh-dam-cuoi",
        statusCode: 301,
      },
      {
        source: "/mau/basic-1",
        destination: "/mau/vuon-o-liu",
        statusCode: 301,
      },
    ];
  },
  async headers() {
    // React dev cần eval() để dựng lại callstack; production tuyệt đối không bật.
    const isDev = process.env.NODE_ENV !== "production";
    const scriptSrc = [
      "'self'",
      "'unsafe-inline'",
      ...(isDev ? ["'unsafe-eval'"] : []),
      "https://challenges.cloudflare.com",
      "https://static.cloudflareinsights.com",
    ].join(" ");

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
      `script-src ${scriptSrc}`,
      "connect-src 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
      "frame-src 'self' https://www.google.com https://maps.google.com https://challenges.cloudflare.com",
      "worker-src 'self' blob:",
      "media-src 'self' blob:",
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
            value: "camera=(self), microphone=(), geolocation=()",
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
        source: "/media/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, s-maxage=31536000, immutable",
          },
        ],
      },
      {
        source: "/(templates|photos|images|sfx)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/w/:slug*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
      {
        source: "/m/:slug*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

