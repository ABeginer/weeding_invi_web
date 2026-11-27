import type { Metadata } from "next";
import { JsonLd } from "@/components/tools/JsonLd";
import { LandingPageClient } from "@/components/landing/landing-page-client";
import { FAQ_ITEMS, LandingFaq } from "@/components/landing/faq";
import { LandingFooter } from "@/components/landing/footer";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ToolsPreviewSection } from "@/components/landing/tools-preview";
import { LANDING_COPY } from "@/config/landing";
import {
  resolveAppBaseUrl,
  SITE_CONFIG,
  SITE_NAME,
  SUPPORT_EMAIL,
  toAbsoluteSiteUrl,
  ZALO_SUPPORT_URL,
} from "@/config/site";

// Trang chủ là static; trạng thái đăng nhập được đọc phía client (/auth/profile)
// để không phải render lại toàn trang theo session.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: {
    absolute: LANDING_COPY.seo.title,
  },
  description: LANDING_COPY.seo.description,
  alternates: {
    canonical: "/",
    languages: {
      "vi-VN": "/",
    },
  },
  openGraph: {
    title: LANDING_COPY.seo.title,
    description: LANDING_COPY.seo.description,
    type: "website",
    locale: "vi_VN",
    siteName: SITE_NAME,
    url: "/",
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
  const organizationId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;
  const sameAs = [
    ZALO_SUPPORT_URL,
    ...(SITE_CONFIG.contactFacebook.trim()
      ? [SITE_CONFIG.contactFacebook.trim()]
      : []),
  ];

  const structuredDataGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: SITE_NAME,
        url: siteUrl,
        logo: toAbsoluteSiteUrl("/icon.png"),
        description: LANDING_COPY.seo.description,
        areaServed: "VN",
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+84902955594",
          email: SUPPORT_EMAIL,
          contactType: "customer service",
          availableLanguage: "Vietnamese",
        },
        sameAs,
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: SITE_NAME,
        alternateName: "inviwedd.date",
        url: siteUrl,
        inLanguage: "vi-VN",
        publisher: {
          "@id": organizationId,
        },
      },
      {
        "@type": "WebApplication",
        name: SITE_NAME,
        applicationCategory: "LifestyleApplication",
        operatingSystem: "All",
        url: siteUrl,
        description: LANDING_COPY.seo.description,
        publisher: {
          "@id": organizationId,
        },
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "VND",
          lowPrice: "0",
          highPrice: "399000",
          offerCount: "3",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ_ITEMS.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <>
      <link
        rel="preload"
        as="image"
        href="/templates/nhat-ky-mua-yeu/cover-sm.webp?v=2"
        fetchPriority="high"
        media="(max-width: 1023px)"
      />
      <JsonLd data={structuredDataGraph} />
      <LandingPageClient
        toolsSection={<ToolsPreviewSection />}
        howItWorksSection={<HowItWorks />}
        faqSection={<LandingFaq />}
        footerSection={<LandingFooter />}
      />
    </>
  );
}
