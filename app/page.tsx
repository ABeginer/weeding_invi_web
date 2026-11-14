import type { Metadata } from "next";
import { LandingPageClient } from "@/components/landing/landing-page-client";
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
  return <LandingPageClient />;
}
