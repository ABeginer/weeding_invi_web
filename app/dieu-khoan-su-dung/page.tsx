import type { Metadata } from "next";
import Link from "next/link";
import { LANDING_COPY } from "@/config/landing";
import { SITE_EMAIL, SITE_LINKS, SITE_NAME } from "@/config/site";
import { landingThemeCssVars } from "@/lib/theme";

export const metadata: Metadata = {
  title: `${LANDING_COPY.legalPages.termsTitle} | ${SITE_NAME}`,
};

export default function TermsOfUsePage() {
  const copy = LANDING_COPY.legalPages;

  return (
    <div
      style={landingThemeCssVars as React.CSSProperties}
      className="landing-theme min-h-screen bg-lnd-bg px-4 py-16 text-lnd-body sm:px-6"
    >
      <main className="mx-auto max-w-2xl rounded-2xl border border-lnd-border bg-lnd-surface p-6 sm:p-10">
        <p className="text-[11px] font-medium tracking-[0.18em] text-lnd-gold uppercase">
          {SITE_NAME}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-lnd-gold sm:text-4xl">
          {copy.termsTitle}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-lnd-body sm:text-base">
          {copy.placeholderNote}
        </p>
        <p className="mt-3 text-xs text-lnd-muted sm:text-sm">
          {LANDING_COPY.footer.contactPrefix}{" "}
          <a href={`mailto:${SITE_EMAIL}`} className="text-lnd-gold underline">
            {SITE_EMAIL}
          </a>
        </p>
        <div className="mt-8">
          <Link
            href={SITE_LINKS.home}
            className="inline-flex h-10 items-center rounded-full border border-lnd-gold-soft px-5 text-xs font-medium text-lnd-body transition-colors hover:border-lnd-gold hover:text-lnd-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold"
          >
            {copy.backHomeLabel}
          </Link>
        </div>
      </main>
    </div>
  );
}

