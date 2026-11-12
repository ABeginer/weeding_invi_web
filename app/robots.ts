import type { MetadataRoute } from "next";
import { SITE_LINKS, toAbsoluteSiteUrl } from "@/config/site";
import { IS_LUNAR_TOOL_PUBLIC } from "@/config/tools-copy";

export default function robots(): MetadataRoute.Robots {
  const allowPaths = [
    SITE_LINKS.home,
    SITE_LINKS.tools,
    SITE_LINKS.toolWeddingCalc,
    ...(IS_LUNAR_TOOL_PUBLIC ? [SITE_LINKS.toolLunar] : []),
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: allowPaths,
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

