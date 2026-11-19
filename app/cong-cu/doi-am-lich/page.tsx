import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CrossToolNav } from "@/components/tools/CrossToolNav";
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
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#B89B72]">
          {LUNAR_CONVERTER_COPY.eyebrow}
        </p>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#1F1D1A]">
          {LUNAR_CONVERTER_COPY.h1}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#6B655E] sm:text-base">
          {LUNAR_CONVERTER_COPY.intro}
        </p>
      </header>

      <LunarConverterClient />

      <ToolFaqSection title="Câu hỏi thường gặp" items={LUNAR_CONVERTER_COPY.faqs} />

      <CrossToolNav currentTool="lunar-converter" />
    </ToolsPageShell>
  );
}
