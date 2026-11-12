import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calculator, Calendar, Clock } from "lucide-react";
import { JsonLd } from "@/components/tools/JsonLd";
import { ToolsPageShell } from "@/components/tools/ToolsPageShell";
import { SITE_LINKS, SITE_NAME, toAbsoluteSiteUrl } from "@/config/site";
import { TOOLS_HUB_COPY } from "@/config/tools-copy";
import { cn } from "@/lib/utils";

const canonicalUrl = toAbsoluteSiteUrl(SITE_LINKS.tools);
const ogImageUrl = toAbsoluteSiteUrl("/templates/basic-1/cover.webp");

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: TOOLS_HUB_COPY.seo.title,
  description: TOOLS_HUB_COPY.seo.description,
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title: TOOLS_HUB_COPY.seo.title,
    description: TOOLS_HUB_COPY.seo.description,
    type: "website",
    locale: "vi_VN",
    url: canonicalUrl,
    images: [
      {
        url: ogImageUrl,
        width: 600,
        height: 800,
        alt: TOOLS_HUB_COPY.seo.ogAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TOOLS_HUB_COPY.seo.title,
    description: TOOLS_HUB_COPY.seo.description,
    images: [ogImageUrl],
  },
};

export default function ToolsHubPage() {
  const breadcrumbs = [
    { label: "Trang chủ", href: "/" },
    { label: "Công cụ", href: "/cong-cu" },
  ] as const;

  const jsonLdData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: TOOLS_HUB_COPY.title,
      description: TOOLS_HUB_COPY.seo.description,
      url: canonicalUrl,
      inLanguage: "vi",
      isPartOf: {
        "@type": "WebSite",
        name: SITE_NAME,
        url: toAbsoluteSiteUrl("/"),
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

      <header className="max-w-2xl">
        <p className="text-[11px] font-medium tracking-[0.18em] text-accent-text uppercase">
          {TOOLS_HUB_COPY.eyebrow}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl">
          {TOOLS_HUB_COPY.title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-text-muted sm:text-base">
          {TOOLS_HUB_COPY.description}
        </p>
      </header>

      <section
        aria-label="Danh sách công cụ miễn phí"
        className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2"
      >
        {TOOLS_HUB_COPY.cards.map((card) => {
          const isWeddingCalc = card.id === "wedding-calc";

          return (
            <article
              key={card.id}
              id={card.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-bg text-accent-text">
                    {isWeddingCalc ? (
                      <Calculator className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Calendar className="h-5 w-5" aria-hidden="true" />
                    )}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                      card.available
                        ? "border-success-border bg-success-bg text-success-fg"
                        : "border-soon-border bg-soon-bg text-soon-fg",
                    )}
                  >
                    {card.badge}
                  </span>
                </div>

                <h2 className="mt-4 font-display text-2xl font-semibold text-text">
                  {card.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  {card.description}
                </p>

                {!card.available && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-bg p-3 text-xs leading-relaxed text-text-muted">
                    <Clock
                      className="mt-0.5 h-4 w-4 shrink-0 text-accent-text"
                      aria-hidden="true"
                    />
                    <p>
                      Công cụ đang trong bước kiểm thử đối chiếu với bảng ngày lịch Việt Nam chính thống trước khi mở công khai.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6">
                {card.available ? (
                  <Link
                    href={card.href}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-5 text-xs font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring sm:text-sm"
                  >
                    <span>{card.ctaLabel}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-bg px-5 text-xs font-medium text-text-muted sm:text-sm"
                  >
                    {card.ctaLabel}
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </section>

      <section className="mt-10 rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-semibold text-text">
              Sẵn sàng tạo thiệp cưới cá nhân hóa tên từng khách?
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
              Khởi tạo thiệp miễn phí cho 20 khách đầu tiên, tự động tổng hợp xác nhận tham dự và chế độ ăn ngay trong Dashboard.
            </p>
          </div>
          <Link
            href={SITE_LINKS.createWedding}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <span>Tạo thiệp miễn phí</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </ToolsPageShell>
  );
}
