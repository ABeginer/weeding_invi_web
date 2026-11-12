import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/tools/JsonLd";
import { ToolFaqSection } from "@/components/tools/ToolFaqSection";
import { ToolsPageShell } from "@/components/tools/ToolsPageShell";
import { WeddingCalcClient } from "@/components/tools/WeddingCalcClient";
import { SITE_LINKS, toAbsoluteSiteUrl } from "@/config/site";
import { WEDDING_CALC_COPY } from "@/config/tools-copy";

const canonicalUrl = toAbsoluteSiteUrl(SITE_LINKS.toolWeddingCalc);
const ogImageUrl = toAbsoluteSiteUrl("/templates/basic-2/cover.webp");

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: WEDDING_CALC_COPY.seo.title,
  description: WEDDING_CALC_COPY.seo.description,
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title: WEDDING_CALC_COPY.seo.title,
    description: WEDDING_CALC_COPY.seo.description,
    type: "website",
    locale: "vi_VN",
    url: canonicalUrl,
    images: [
      {
        url: ogImageUrl,
        width: 600,
        height: 800,
        alt: WEDDING_CALC_COPY.seo.ogAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: WEDDING_CALC_COPY.seo.title,
    description: WEDDING_CALC_COPY.seo.description,
    images: [ogImageUrl],
  },
};

export default function WeddingBudgetCalculatorPage() {
  const jsonLdData = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: WEDDING_CALC_COPY.h1,
      description: WEDDING_CALC_COPY.seo.description,
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
      mainEntity: WEDDING_CALC_COPY.faqs.map((faq) => ({
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
      itemListElement: WEDDING_CALC_COPY.breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.label,
        item: toAbsoluteSiteUrl(crumb.href),
      })),
    },
  ];

  return (
    <ToolsPageShell breadcrumbs={WEDDING_CALC_COPY.breadcrumbs}>
      <JsonLd data={jsonLdData} />

      <header className="max-w-3xl print:hidden">
        <p className="text-[11px] font-medium tracking-[0.18em] text-accent-text uppercase">
          {WEDDING_CALC_COPY.eyebrow}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl">
          {WEDDING_CALC_COPY.h1}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-text-muted sm:text-base">
          {WEDDING_CALC_COPY.intro}
        </p>
      </header>

      {/* Khối Cách dùng 3 bước */}
      <section
        aria-labelledby="how-to-title"
        className="mt-6 rounded-2xl border border-border bg-surface p-4 sm:p-5 print:hidden"
      >
        <h2
          id="how-to-title"
          className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-text"
        >
          {WEDDING_CALC_COPY.howToTitle}
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {WEDDING_CALC_COPY.howToSteps.map((step) => (
            <div
              key={step.step}
              className="rounded-xl border border-border bg-bg p-3.5"
            >
              <span className="text-[11px] font-semibold text-accent-text">
                Bước {step.step}
              </span>
              <h3 className="mt-0.5 text-sm font-semibold text-text">
                {step.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-text-muted">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <WeddingCalcClient />

      <ToolFaqSection
        title={WEDDING_CALC_COPY.faqTitle}
        items={WEDDING_CALC_COPY.faqs}
      />

      {/* Hộp kêu gọi cuối trang */}
      <section className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8 print:hidden">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-semibold text-text">
              {WEDDING_CALC_COPY.bottomCta.title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
              {WEDDING_CALC_COPY.bottomCta.description}
            </p>
          </div>
          <Link
            href={WEDDING_CALC_COPY.bottomCta.href}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <span>{WEDDING_CALC_COPY.bottomCta.buttonLabel}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <nav
          aria-label={WEDDING_CALC_COPY.crossLinks.title}
          className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-text-muted sm:text-sm"
        >
          <span className="font-medium text-text">
            {WEDDING_CALC_COPY.crossLinks.title}:
          </span>
          {WEDDING_CALC_COPY.crossLinks.items.map((linkItem) => (
            <Link
              key={linkItem.href}
              href={linkItem.href}
              className="text-accent-text underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              {linkItem.label}
            </Link>
          ))}
        </nav>
      </section>
    </ToolsPageShell>
  );
}
