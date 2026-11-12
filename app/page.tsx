import type { Metadata } from "next";
import { LandingPageClient } from "@/components/landing/landing-page-client";
import { LANDING_COPY } from "@/config/landing";
import { resolveAppBaseUrl, toAbsoluteSiteUrl } from "@/config/site";
import { getAuth0 } from "@/lib/auth0";

export const dynamic = "force-dynamic";

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

export default async function HomePage() {
  let isAuthenticated = false;
  let userEmail: string | null = null;

  try {
    const session = await getAuth0().getSession();
    isAuthenticated = Boolean(session);
    if (session?.user) {
      const userObj = session.user as Record<string, unknown>;
      const rawEmail = userObj.email ?? userObj["https://thiepcuoi/email"];
      if (typeof rawEmail === "string" && rawEmail.trim()) {
        userEmail = rawEmail.trim();
      }
    }
  } catch {
    isAuthenticated = false;
    userEmail = null;
  }

  return (
    <LandingPageClient
      isAuthenticated={isAuthenticated}
      userEmail={userEmail}
    />
  );
}
