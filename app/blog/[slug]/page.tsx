import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Calendar, Clock, User } from "lucide-react";
import { MarkdownContent } from "@/components/blog/MarkdownContent";
import { JsonLd } from "@/components/tools/JsonLd";
import { ToolFaqSection } from "@/components/tools/ToolFaqSection";
import { ToolsPageShell } from "@/components/tools/ToolsPageShell";
import { SITE_LINKS, SITE_NAME, toAbsoluteSiteUrl } from "@/config/site";
import { getAllBlogPosts, getBlogPostBySlug } from "@/lib/blog";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllBlogPosts().map((post) => ({ slug: post.slug }));
}

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) {
    return {
      title: "Không tìm thấy bài viết",
    };
  }

  const canonicalUrl = toAbsoluteSiteUrl(`/blog/${post.slug}`);
  const ogImageUrl = toAbsoluteSiteUrl(
    post.cover || "/templates/basic-1/cover.webp",
  );

  return {
    title: post.title,
    description: post.description,
    keywords: post.tags.length > 0 ? post.tags : undefined,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "vi-VN": canonicalUrl,
      },
    },
    openGraph: {
      title: `${post.title} | ${SITE_NAME}`,
      description: post.description,
      type: "article",
      locale: "vi_VN",
      url: canonicalUrl,
      siteName: SITE_NAME,
      publishedTime: post.date || undefined,
      modifiedTime: post.updated || post.date || undefined,
      authors: [post.author],
      tags: post.tags.length > 0 ? post.tags : undefined,
      images: [
        {
          url: ogImageUrl,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | ${SITE_NAME}`,
      description: post.description,
      images: [ogImageUrl],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) {
    notFound();
  }

  const canonicalUrl = toAbsoluteSiteUrl(`/blog/${post.slug}`);
  const ogImageUrl = toAbsoluteSiteUrl(
    post.cover || "/templates/basic-1/cover.webp",
  );

  const breadcrumbs = [
    { label: "Trang chủ", href: "/" },
    { label: "Cẩm nang cưới", href: "/blog" },
    { label: post.title, href: `/blog/${post.slug}` },
  ] as const;

  const relatedPosts = getAllBlogPosts()
    .filter((item) => item.slug !== post.slug)
    .slice(0, 3);
  const estimatedWordCount = post.content
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const jsonLdData: Array<Record<string, unknown>> = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      image: [ogImageUrl],
      datePublished: post.date || undefined,
      dateModified: post.updated || post.date || undefined,
      articleSection: post.category || "Cẩm nang cưới",
      keywords: post.tags.length > 0 ? post.tags.join(", ") : undefined,
      wordCount: estimatedWordCount,
      author: {
        "@type": "Organization",
        name: post.author,
        url: toAbsoluteSiteUrl("/"),
      },
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        url: toAbsoluteSiteUrl("/"),
      },
      mainEntityOfPage: canonicalUrl,
      inLanguage: "vi-VN",
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

  if (post.faqs.length > 0) {
    jsonLdData.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: post.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    });
  }

  return (
    <ToolsPageShell breadcrumbs={breadcrumbs}>
      <JsonLd data={jsonLdData} />

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10">
        <article className="min-w-0">
          <header>
            {post.category && (
              <p className="text-[11px] font-medium tracking-[0.18em] text-accent-text uppercase">
                {post.category}
              </p>
            )}
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl">
              {post.title}
            </h1>
            {post.description && (
              <p className="mt-3 text-sm leading-relaxed text-text-muted sm:text-base">
                {post.description}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-4 border-y border-border py-3 text-xs text-text-muted">
              <span className="inline-flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{post.author}</span>
              </span>
              {post.date && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  <time dateTime={post.date}>{post.date}</time>
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{post.readingTimeMinutes} phút đọc</span>
              </span>
            </div>

            {post.cover && (
              <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface-alt">
                <img
                  src={post.cover}
                  alt={post.title}
                  className="aspect-video w-full object-cover"
                />
              </div>
            )}
          </header>

          <div className="mt-6">
            <MarkdownContent content={post.content} />
          </div>

          {post.faqs.length > 0 && (
            <ToolFaqSection title="Câu hỏi thường gặp" items={post.faqs} />
          )}

          {relatedPosts.length > 0 && (
            <section
              aria-label="Bài viết liên quan"
              className="mt-10 rounded-2xl border border-border bg-surface p-6 sm:p-8"
            >
              <p className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
                ĐỌC TIẾP CẨM NANG CƯỚI
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-text">
                Bài viết liên quan
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {relatedPosts.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/blog/${related.slug}`}
                    className="group flex flex-col justify-between rounded-xl border border-border bg-surface-alt/40 p-4 transition-colors hover:border-accent"
                  >
                    <div>
                      <p className="text-xs text-text-muted">
                        {related.readingTimeMinutes} phút đọc
                      </p>
                      <h3 className="mt-1 font-display text-lg font-semibold text-text transition-colors group-hover:text-accent-text">
                        {related.title}
                      </h3>
                      {related.description && (
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-text-muted">
                          {related.description}
                        </p>
                      )}
                    </div>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent-text">
                      Đọc bài viết
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="mt-10 rounded-2xl border border-border bg-surface p-6 sm:p-8 lg:hidden">
            <h2 className="font-display text-2xl font-semibold text-text">
              Tạo thiệp cưới online cá nhân hóa tên từng khách
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              Khởi tạo miễn phí cho 20 khách mời đầu tiên trên {SITE_NAME}, kèm RSVP tự động và sơ đồ bàn tiệc.
            </p>
            <Link
              href={SITE_LINKS.createWedding}
              className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
            >
              <span>Tạo thiệp miễn phí</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-8 border-t border-border pt-6">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-medium text-accent-text transition-colors hover:text-accent-hover"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Quay lại tất cả bài viết</span>
            </Link>
          </div>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-5">
            {post.headings.length > 0 && (
              <nav
                aria-label="Mục lục bài viết"
                className="rounded-2xl border border-border bg-surface p-5"
              >
                <p className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
                  Trên trang này
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  {post.headings.map((heading) => (
                    <li key={heading.id}>
                      <a
                        href={`#${heading.id}`}
                        className="block leading-snug text-text-muted transition-colors hover:text-accent-text"
                      >
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
                {SITE_NAME}
              </p>
              <h2 className="mt-1.5 font-display text-lg font-semibold text-text">
                Thiệp cưới cá nhân hóa &amp; quản lý RSVP
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-text-muted">
                Tạo link mời riêng cho từng vị khách trong vài phút. Miễn phí cho 20 khách đầu tiên, không cần thẻ.
              </p>
              <Link
                href={SITE_LINKS.createWedding}
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-accent px-4 text-xs font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
              >
                <span>Tạo thiệp miễn phí</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </ToolsPageShell>
  );
}
