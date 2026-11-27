import type { MetadataRoute } from "next";
import { resolveAppBaseUrl } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  const base = resolveAppBaseUrl().replace(/\/+$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/thiep-cuoi",
          "/mau-thiep",
          "/blog",
          "/blog/*",
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
          "/a/",
          "/led/",
          "/share/",
          "/photo-wall/",
          "/qa/",
          "/media/",
          "/tao-thiep/luu",
          "/tao-thiep/preview",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
