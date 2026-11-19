import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://wedding-invitation.inviwedd.workers.dev";

export default function robots(): MetadataRoute.Robots {
  const base = SITE_URL.replace(/\/+$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/thiep-cuoi",
          "/cong-cu",
          "/cong-cu/*",
          "/mau/*",
          "/chinh-sach-bao-mat",
          "/dieu-khoan-su-dung",
        ],
        disallow: [
          "/api/",
          "/auth/",
          "/dashboard/",
          "/dashboard/*",
          "/ops/",
          "/ops/*",
          "/m/",
          "/w/",
          "/led/",
          "/media/",
          "/tao-thiep/luu",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
