import type { MetadataRoute } from "next";
import { toAbsoluteSiteUrl } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/cong-cu", "/cong-cu/bang-tinh-dam-cuoi"],
        disallow: [
          "/api/",
          "/auth/",
          "/dashboard/",
          "/m/",
          "/w/",
          "/tao-thiep/luu",
        ],
      },
    ],
    sitemap: toAbsoluteSiteUrl("/sitemap.xml"),
  };
}
