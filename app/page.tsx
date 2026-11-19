import type { Metadata } from "next";
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
        url: toAbsoluteSiteUrl("/templates/basic-1/cover.webp"),
        width: 600,
        height: 800,
        alt: LANDING_COPY.seo.ogAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: LANDING_COPY.seo.title,
    description: LANDING_COPY.seo.description,
    images: [toAbsoluteSiteUrl("/templates/basic-1/cover.webp")],
  },
};

export default function HomePage() {
  const siteUrl = resolveAppBaseUrl();

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webApplicationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqPageSchema),
        }}
      />
      <LandingPageClient />
    </>
  );
}
