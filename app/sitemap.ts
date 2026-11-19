import type { MetadataRoute } from "next";
import { TEMPLATE_REGISTRY } from "@/templates/registry";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://wedding-invitation.inviwedd.workers.dev";

function makeUrl(path: string): string {
  const base = SITE_URL.replace(/\/+$/, "");
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
    {
      url: makeUrl("/chinh-sach-bao-mat"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: makeUrl("/dieu-khoan-su-dung"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // 2. All 27 template preview routes
  const templateEntries: MetadataRoute.Sitemap = TEMPLATE_REGISTRY.map((tpl) => ({
    url: makeUrl(`/mau/${tpl.id}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...coreEntries, ...templateEntries];
}
