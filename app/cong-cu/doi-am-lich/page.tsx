import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/tools/JsonLd";
import { LunarConverterClient } from "@/components/tools/LunarConverterClient";
import { ToolFaqSection } from "@/components/tools/ToolFaqSection";
import { ToolsPageShell } from "@/components/tools/ToolsPageShell";
import { SITE_LINKS, toAbsoluteSiteUrl } from "@/config/site";
import { IS_LUNAR_TOOL_PUBLIC, LUNAR_CONVERTER_COPY } from "@/config/tools-copy";

const canonicalUrl = toAbsoluteSiteUrl(SITE_LINKS.toolLunar);
const ogImageUrl = toAbsoluteSiteUrl("/templates/basic-3/cover.webp");

export const dynamic = "force-static";

export function generateMetadata(): Metadata {
  if (!IS_LUNAR_TOOL_PUBLIC) {
    return {
      title: LUNAR_CONVERTER_COPY.seo.title,
      robots: { index: false, follow: false },
    };
  }

  return {
    title: LUNAR_CONVERTER_COPY.seo.title,
    description: LUNAR_CONVERTER_COPY.seo.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: LUNAR_CONVERTER_COPY.seo.title,
      description: LUNAR_CONVERTER_COPY.seo.description,
      type: "website",
      locale: "vi_VN",
      url: canonicalUrl,
      images: [
        {
          url: ogImageUrl,
          width: 600,
          height: 800,
          alt: LUNAR_CONVERTER_COPY.seo.ogAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: LUNAR_CONVERTER_COPY.seo.title,
      description: LUNAR_CONVERTER_COPY.seo.description,
      images: [ogImageUrl],
    },
  };
}

export default function LunarConverterPage() {
  if (!IS_LUNAR_TOOL_PUBLIC) {
    notFound();
  }

  const jsonLdData = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: LUNAR_CONVERTER_COPY.h1,
      description: LUNAR_CONVERTER_COPY.seo.description,
      url: canonicalUrl,
      inLanguage: "vi",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "VND",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: LUNAR_CONVERTER_COPY.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: LUNAR_CONVERTER_COPY.breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.label,
        item: toAbsoluteSiteUrl(crumb.href),
      })),
    },
  ];

  return (
    <ToolsPageShell breadcrumbs={LUNAR_CONVERTER_COPY.breadcrumbs}>
      <JsonLd data={jsonLdData} />

      <header className="max-w-3xl">
        <p className="text-[11px] font-medium tracking-[0.18em] text-accent-text uppercase">
          {LUNAR_CONVERTER_COPY.eyebrow}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl">
          {LUNAR_CONVERTER_COPY.h1}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-text-muted sm:text-base">
          {LUNAR_CONVERTER_COPY.intro}
        </p>
      </header>

      <LunarConverterClient />

      <ToolFaqSection title="Câu hỏi thường gặp" items={LUNAR_CONVERTER_COPY.faqs} />

      <section className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-semibold text-text">
              {LUNAR_CONVERTER_COPY.bottomCta.title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
              {LUNAR_CONVERTER_COPY.bottomCta.description}
            </p>
          </div>
          <Link
            href={LUNAR_CONVERTER_COPY.bottomCta.href}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <span>{LUNAR_CONVERTER_COPY.bottomCta.buttonLabel}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <nav
          aria-label="Liên kết nhanh"
          className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-text-muted sm:text-sm"
        >
          <span className="font-medium text-text">Liên kết nhanh:</span>
          <Link
            href={SITE_LINKS.tools}
            className="text-accent-text underline-offset-4 hover:underline"
          >
            Trang tổng hợp công cụ
          </Link>
          <Link
            href={SITE_LINKS.toolWeddingCalc}
            className="text-accent-text underline-offset-4 hover:underline"
          >
            Bảng tính chi phí đám cưới
          </Link>
          <Link
            href={SITE_LINKS.createWedding}
            className="text-accent-text underline-offset-4 hover:underline"
          >
            Tạo thiệp miễn phí
          </Link>
        </nav>
      </section>
    </ToolsPageShell>
  );
}

