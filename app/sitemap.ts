import type { MetadataRoute } from "next";
import { SITE_LINKS, toAbsoluteSiteUrl } from "@/config/site";
import { IS_LUNAR_TOOL_PUBLIC } from "@/config/tools-copy";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    {
      url: toAbsoluteSiteUrl(SITE_LINKS.home),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: toAbsoluteSiteUrl(SITE_LINKS.tools),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: toAbsoluteSiteUrl(SITE_LINKS.toolWeddingCalc),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: toAbsoluteSiteUrl(SITE_LINKS.privacy),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: toAbsoluteSiteUrl(SITE_LINKS.terms),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  if (IS_LUNAR_TOOL_PUBLIC) {
    entries.push({
      url: toAbsoluteSiteUrl(SITE_LINKS.toolLunar),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  return entries;
}

