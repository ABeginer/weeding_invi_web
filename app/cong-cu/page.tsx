import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calculator, Calendar, ClipboardList, MessageSquare, Users } from "lucide-react";
import { JsonLd } from "@/components/tools/JsonLd";
import { ToolsPageShell } from "@/components/tools/ToolsPageShell";
import { SITE_LINKS, SITE_NAME, toAbsoluteSiteUrl } from "@/config/site";
import { TOOLS_HUB_COPY } from "@/config/tools-copy";

const canonicalUrl = toAbsoluteSiteUrl(SITE_LINKS.tools);
const ogImageUrl = toAbsoluteSiteUrl("/templates/vuon-o-liu/cover.webp");

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
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#B89B72]">
          {TOOLS_HUB_COPY.eyebrow}
        </p>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#1F1D1A]">
          {TOOLS_HUB_COPY.title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#6B655E] sm:text-base">
          {TOOLS_HUB_COPY.description}
        </p>
      </header>

      <section
        aria-label="Danh sách công cụ miễn phí"
        className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2"
      >
        {TOOLS_HUB_COPY.cards.map((card) => {
          const isWeddingCalc = card.id === "wedding-calc";
          const isLunar = card.id === "lunar-converter";
          const isGuestList = card.id === "guest-list";
          const isChecklist = card.id === "wedding-checklist";

          return (
            <article
              key={card.id}
              id={card.id}
              className="group flex flex-col justify-between rounded-2xl border border-[#E8E2D9] bg-white p-6 shadow-xs transition-all duration-200 hover:border-[#7A1C24]/30 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] text-[#7A1C24] transition-colors group-hover:border-[#7A1C24]/40">
                    {isWeddingCalc ? (
                      <Calculator className="h-5 w-5" aria-hidden="true" />
                    ) : isLunar ? (
                      <Calendar className="h-5 w-5" aria-hidden="true" />
                    ) : isGuestList ? (
                      <Users className="h-5 w-5" aria-hidden="true" />
                    ) : isChecklist ? (
                      <ClipboardList className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <MessageSquare className="h-5 w-5" aria-hidden="true" />
                    )}
                  </span>
                  {card.badge && card.badge !== "Đang mở" && (
                    <span className="rounded-full border border-[#B89B72]/40 bg-[#FAF8F5] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8A6D3B]">
                      {card.badge}
                    </span>
                  )}
                </div>

                <h2 className="mt-5 font-serif text-xl font-medium text-[#1F1D1A] transition-colors group-hover:text-[#7A1C24]">
                  {card.title}
                </h2>
                <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-[#6B655E]">
                  {card.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E8E2D9]/60">
                <Link
                  href={card.href}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#7A1C24] px-5 text-xs font-medium text-white shadow-xs transition-colors hover:bg-[#5E141B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89B72]"
                >
                  <span>{card.ctaLabel}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </article>
          );
        })}
      </section>

      <section className="relative overflow-hidden mt-12 rounded-2xl border border-[#E8E2D9]/20 bg-[#1F1D1A] p-6 sm:p-8 text-[#FAF8F5] shadow-md">
        <div
          className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-[#B89B72]/15 blur-2xl"
          aria-hidden="true"
        />
        <div className="relative z-10 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.16em] uppercase text-[#B89B72]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B89B72]" aria-hidden="true" />
              <span>CÁ NHÂN HÓA LỜI MỜI</span>
            </div>
            <h2 className="mt-1 font-serif text-2xl font-normal text-white sm:text-3xl">
              Sẵn sàng tạo thiệp cưới cá nhân hóa tên từng khách?
            </h2>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#D4CDC5]">
              Khởi tạo thiệp miễn phí cho 20 khách đầu tiên, tự động tổng hợp xác nhận tham dự và chế độ ăn ngay trong Dashboard.
            </p>
          </div>
          <Link
            href={SITE_LINKS.createWedding}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#7A1C24] px-6 text-xs sm:text-sm font-medium text-white shadow-xs transition-colors hover:bg-[#5E141B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89B72]"
          >
            <span>Tạo thiệp miễn phí</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </ToolsPageShell>
  );
}
