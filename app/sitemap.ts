import type { MetadataRoute } from "next";
import { resolveAppBaseUrl } from "@/config/site";
import { getAllBlogPosts } from "@/lib/blog";
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
      url: makeUrl("/blog"),
      lastModified: now,
      changeFrequency: "daily",
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
      url: makeUrl("/cong-cu/tao-danh-sach-khach-moi"),
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

  // 2. Blog posts
  const blogEntries: MetadataRoute.Sitemap = getAllBlogPosts().map((post) => ({
    url: makeUrl(`/blog/${post.slug}`),
    lastModified:
      post.updated || post.date ? new Date(post.updated || post.date) : now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // 3. All active template preview routes
  const templateEntries: MetadataRoute.Sitemap = TEMPLATE_REGISTRY.filter(
    (tpl) => !tpl.isPlaceholder,
  ).map((tpl) => ({
    url: makeUrl(`/mau/${tpl.id}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...coreEntries, ...blogEntries, ...templateEntries];
}
