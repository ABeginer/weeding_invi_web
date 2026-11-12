import type { Metadata } from "next";
import { LANDING_COPY } from "@/config/landing";
import { SITE_URL } from "@/config/site";
import { getAuth0 } from "@/lib/auth0";
import { LandingPageClient } from "@/components/landing/landing-page-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: LANDING_COPY.seo.title,
  description: LANDING_COPY.seo.description,
  openGraph: {
    title: LANDING_COPY.seo.title,
    description: LANDING_COPY.seo.description,
    type: "website",
    locale: "vi_VN",
    url: SITE_URL,
    images: [
      {
        url: `${SITE_URL}/templates/basic-1/cover.webp`,
        width: 600,
        height: 800,
        alt: LANDING_COPY.seo.ogAlt,
      },
    ],
  },
};

export default async function HomePage() {
  let isAuthenticated = false;

  try {
    const session = await getAuth0().getSession();
    isAuthenticated = Boolean(session);
  } catch {
    isAuthenticated = false;
  }

  return <LandingPageClient isAuthenticated={isAuthenticated} />;
}
