import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.APP_BASE_URL ||
  "https://inviwedd.date";

export default function robots(): MetadataRoute.Robots {
  const base = SITE_URL.replace(/\/+$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/thiep-cuoi",
          "/mau-thiep",
          "/cong-cu",
          "/cong-cu/*",
          "/mau/*",
          "/chinh-sach",
          "/chinh-sach/*",
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
