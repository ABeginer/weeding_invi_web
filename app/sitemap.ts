import type { MetadataRoute } from "next";
import { resolveAppBaseUrl } from "@/config/site";
import { LEGAL_POLICIES } from "@/lib/legal-config";
import { TEMPLATE_REGISTRY } from "@/templates/registry";

function makeUrl(path: string): string {
  const base = resolveAppBaseUrl().replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // 1. Core pages
  const coreEntries: MetadataRoute.Sitemap = [
    {
      url: makeUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: makeUrl("/thiep-cuoi"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: makeUrl("/mau-thiep"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: makeUrl("/cong-cu"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: makeUrl("/cong-cu/bang-tinh-dam-cuoi"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: makeUrl("/cong-cu/doi-am-lich"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: makeUrl("/cong-cu/tao-loi-moi-zalo"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    ...LEGAL_POLICIES.map((p) => ({
      url: makeUrl(p.href),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];

  // 2. All active template preview routes
  const templateEntries: MetadataRoute.Sitemap = TEMPLATE_REGISTRY
    .filter((tpl) => !tpl.isPlaceholder)
    .map((tpl) => ({
      url: makeUrl(`/mau/${tpl.id}`),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    }));

  return [...coreEntries, ...templateEntries];
}
