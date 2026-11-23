import type { Metadata } from "next";
import { JsonLd } from "@/components/tools/JsonLd";
import { LandingPageClient } from "@/components/landing/landing-page-client";
import { FAQ_ITEMS } from "@/components/landing/faq";
import { LANDING_COPY } from "@/config/landing";
import { resolveAppBaseUrl, toAbsoluteSiteUrl } from "@/config/site";

// Trang chủ là static; trạng thái đăng nhập được đọc phía client (/auth/profile)
// để không phải render lại toàn trang theo session.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: LANDING_COPY.seo.title,
  description: LANDING_COPY.seo.description,
  openGraph: {
    title: LANDING_COPY.seo.title,
    description: LANDING_COPY.seo.description,
    type: "website",
    locale: "vi_VN",
    url: resolveAppBaseUrl(),
    images: [
      {
        url: toAbsoluteSiteUrl("/images/og-cover.png"),
        width: 1200,
        height: 630,
        alt: LANDING_COPY.seo.ogAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: LANDING_COPY.seo.title,
    description: LANDING_COPY.seo.description,
    images: [toAbsoluteSiteUrl("/images/og-cover.png")],
  },
};

export default function HomePage() {
  const siteUrl = resolveAppBaseUrl();

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Inviwedd",
    url: siteUrl,
    logo: toAbsoluteSiteUrl("/images/og-cover.png"),
    description: LANDING_COPY.seo.description,
  };

  const webApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Inviwedd",
    applicationCategory: "LifestyleApplication",
    operatingSystem: "All",
    url: siteUrl,
    description: LANDING_COPY.seo.description,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "VND",
      lowPrice: "0",
      highPrice: "399000",
      offerCount: "3",
    },
  };

  const faqPageSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <JsonLd data={organizationSchema} />
      <JsonLd data={webApplicationSchema} />
      <JsonLd data={faqPageSchema} />
      <LandingPageClient />
    </>
  );
}
