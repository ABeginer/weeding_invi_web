import type { Metadata } from "next";
import { CrossToolNav } from "@/components/tools/CrossToolNav";
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
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#B89B72]">
          {WEDDING_CALC_COPY.eyebrow}
        </p>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#1F1D1A]">
          {WEDDING_CALC_COPY.h1}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#6B655E] sm:text-base">
          {WEDDING_CALC_COPY.intro}
        </p>
      </header>

      {/* Khối Cách dùng 3 bước */}
      <section
        aria-labelledby="how-to-title"
        className="mt-6 rounded-2xl border border-[#E8E2D9] bg-white p-5 sm:p-6 shadow-xs print:hidden"
      >
        <div className="flex flex-col gap-0.5">
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#B89B72]">
            HƯỚNG DẪN NHANH
          </p>
          <h2
            id="how-to-title"
            className="font-serif text-lg font-medium text-[#1F1D1A]"
          >
            {WEDDING_CALC_COPY.howToTitle}
          </h2>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {WEDDING_CALC_COPY.howToSteps.map((step) => (
            <div
              key={step.step}
              className="rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] p-4 transition-colors hover:border-[#7A1C24]/20"
            >
              <span className="text-[11px] font-semibold tracking-wider text-[#7A1C24]">
                BƯỚC {step.step}
              </span>
              <h3 className="mt-1 font-serif text-base font-medium text-[#1F1D1A]">
                {step.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#6B655E]">
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

      <CrossToolNav currentTool="wedding-calc" />
    </ToolsPageShell>
  );
}
