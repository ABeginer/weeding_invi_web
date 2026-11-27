import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Calendar, Clock } from "lucide-react";
import { JsonLd } from "@/components/tools/JsonLd";
import { ToolsPageShell } from "@/components/tools/ToolsPageShell";
import { SITE_LINKS, SITE_NAME, toAbsoluteSiteUrl } from "@/config/site";
import { getAllBlogPosts } from "@/lib/blog";

const BLOG_INDEX_URL = toAbsoluteSiteUrl("/blog");
const OG_IMAGE_URL = toAbsoluteSiteUrl("/templates/basic-1/cover.webp");

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Blog cẩm nang cưới & kinh nghiệm chuẩn bị đám cưới",
  description:
    "Hướng dẫn lập kế hoạch cưới, cách xưng hô ghi thiệp cưới, nghi thức lễ Vu Quy - Thành Hôn, dự trù ngân sách và quản lý danh sách khách mời từ Inviwedd.",
  keywords: [
    "cẩm nang cưới",
    "kinh nghiệm chuẩn bị đám cưới",
    "cách ghi thiệp cưới",
    "thiệp cưới online",
    "nghi thức cưới hỏi Việt Nam",
    "Inviwedd",
  ],
  alternates: {
    canonical: BLOG_INDEX_URL,
    languages: {
      "vi-VN": BLOG_INDEX_URL,
    },
  },
  openGraph: {
    title: `Blog cẩm nang cưới & kinh nghiệm chuẩn bị đám cưới | ${SITE_NAME}`,
    description:
      "Hướng dẫn lập kế hoạch cưới, cách xưng hô ghi thiệp cưới, nghi thức lễ Vu Quy - Thành Hôn, dự trù ngân sách và quản lý danh sách khách mời từ Inviwedd.",
    type: "website",
    locale: "vi_VN",
    url: BLOG_INDEX_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: OG_IMAGE_URL,
        width: 600,
        height: 800,
        alt: `Cẩm nang cưới ${SITE_NAME}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Blog cẩm nang cưới & kinh nghiệm chuẩn bị đám cưới | ${SITE_NAME}`,
    description:
      "Hướng dẫn lập kế hoạch cưới, cách xưng hô ghi thiệp cưới, nghi thức lễ Vu Quy - Thành Hôn, dự trù ngân sách và quản lý danh sách khách mời từ Inviwedd.",
    images: [OG_IMAGE_URL],
  },
};

export default function BlogIndexPage() {
  const posts = getAllBlogPosts();
  const breadcrumbs = [
    { label: "Trang chủ", href: "/" },
    { label: "Cẩm nang cưới", href: "/blog" },
  ] as const;

  const jsonLdData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `Cẩm nang cưới ${SITE_NAME}`,
      description:
        "Tổng hợp bài viết hướng dẫn chuẩn bị đám cưới, cách ghi thiệp cưới, lập ngân sách và quản lý danh sách khách mời.",
      url: BLOG_INDEX_URL,
      inLanguage: "vi-VN",
      isPartOf: {
        "@type": "WebSite",
        name: SITE_NAME,
        url: toAbsoluteSiteUrl("/"),
      },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: posts.length,
        itemListElement: posts.map((post, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          url: toAbsoluteSiteUrl(`/blog/${post.slug}`),
          name: post.title,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.label,
        item: toAbsoluteSiteUrl(crumb.href),
      })),
    },
  ];

  return (
    <ToolsPageShell breadcrumbs={breadcrumbs}>
      <JsonLd data={jsonLdData} />

      <header className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div className="max-w-2xl">
          <p className="text-[11px] font-medium tracking-[0.18em] text-accent-text uppercase">
            CẨM NANG CƯỚI {SITE_NAME.toUpperCase()}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl">
            Kinh nghiệm chuẩn bị đám cưới &amp; thiệp mời trực tuyến
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-text-muted sm:text-base">
            Hướng dẫn thực tế từ dự trù chi phí, sắp xếp bàn tiệc đến tạo thiệp cưới cá nhân hóa theo từng vị khách trên {SITE_NAME}.
          </p>
        </div>

        <Link
          href={SITE_LINKS.createWedding}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          <span>Tạo thiệp miễn phí</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </header>

      {posts.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-border bg-surface p-8 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-bg text-accent-text">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-semibold text-text">
            Các bài viết hướng dẫn đang được cập nhật
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-muted">
            Trong lúc chờ bài viết mới, bạn có thể dùng ngay bộ công cụ tính chi phí tiệc cưới hoặc tạo mẫu thiệp cưới miễn phí cho 20 khách đầu tiên.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={SITE_LINKS.tools}
              className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-bg px-5 text-sm font-medium text-text transition-colors hover:border-accent hover:text-accent-text"
            >
              Mở công cụ cưới
            </Link>
            <Link
              href={SITE_LINKS.createWedding}
              className="inline-flex h-10 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
            >
              Tạo thiệp ngay
            </Link>
          </div>
        </section>
      ) : (
        <section
          aria-label="Danh sách bài viết cẩm nang cưới"
          className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2"
        >
          {posts.map((post, idx) => (
            <article
              key={post.slug}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-accent"
            >
              <Link href={`/blog/${post.slug}`} className="block aspect-video w-full overflow-hidden border-b border-border bg-surface-alt">
                {post.cover ? (
                  <img
                    src={post.cover}
                    alt={post.title}
                    loading={idx < 2 ? "eager" : "lazy"}
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-surface-alt px-6 text-center">
                    <span className="font-display text-lg font-medium text-accent-text">
                      {post.category || SITE_NAME}
                    </span>
                  </div>
                )}
              </Link>

              <div className="flex flex-1 flex-col justify-between p-6">
                <div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
                    {post.date && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                        <time dateTime={post.date}>{post.date}</time>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{post.readingTimeMinutes} phút đọc</span>
                    </span>
                  </div>

                  <h2 className="mt-3 font-display text-xl font-semibold text-text transition-colors group-hover:text-accent-text">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>

                  {post.description && (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-text-muted">
                      {post.description}
                    </p>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-xs font-medium text-text-muted">
                    {post.author}
                  </span>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-text transition-colors hover:text-accent-hover"
                  >
                    <span>Đọc bài</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Liên kết nội bộ sang bộ công cụ cưới miễn phí */}
      <section
        aria-label="Công cụ cưới miễn phí đi kèm"
        className="mt-10 rounded-2xl border border-border bg-surface p-6 sm:p-8"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
              CÔNG CỤ CƯỚI MIỄN PHÍ
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-text">
              Áp dụng ngay vào kế hoạch đám cưới của bạn
            </h2>
          </div>
          <Link
            href={SITE_LINKS.tools}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-text hover:text-accent-hover"
          >
            <span>Xem tất cả công cụ</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Lập danh sách khách mời", href: SITE_LINKS.toolGuestList },
            { label: "Bảng tính chi phí cưới", href: SITE_LINKS.toolWeddingCalc },
            { label: "Soạn lời mời Zalo", href: SITE_LINKS.toolZaloInvite },
            { label: "Đổi ngày âm lịch", href: SITE_LINKS.toolLunar },
          ].map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="flex items-center justify-between rounded-xl border border-border bg-surface-alt/50 px-4 py-3 text-sm font-medium text-text transition-colors hover:border-accent hover:text-accent-text"
            >
              <span>{tool.label}</span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </ToolsPageShell>
  );
}
