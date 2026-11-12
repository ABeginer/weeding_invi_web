import type { Metadata } from "next";
import Link from "next/link";
import { LANDING_COPY } from "@/config/landing";
import { SITE_EMAIL, SITE_LINKS, SITE_NAME } from "@/config/site";

export const metadata: Metadata = {
  title: `${LANDING_COPY.legalPages.privacyTitle} | ${SITE_NAME}`,
};

export default function PrivacyPolicyPage() {
  const copy = LANDING_COPY.legalPages;

  return (
    <div className="landing-theme min-h-screen-dvh bg-bg px-4 py-16 text-text sm:px-6">
      <main className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-xs sm:p-10">
        <p className="text-[11px] font-medium tracking-[0.18em] text-accent-text uppercase">
          {SITE_NAME}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-accent-text sm:text-4xl">
          {copy.privacyTitle}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-text sm:text-base">
          {copy.placeholderNote}
        </p>
        <p className="mt-3 text-xs text-text-muted sm:text-sm">
          {LANDING_COPY.footer.contactPrefix}{" "}
          <a href={`mailto:${SITE_EMAIL}`} className="text-accent-text underline">
            {SITE_EMAIL}
          </a>
        </p>
        <div className="mt-8">
          <Link
            href={SITE_LINKS.home}
            className="inline-flex h-10 items-center rounded-full border border-text bg-transparent px-5 text-xs font-medium text-text transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            {copy.backHomeLabel}
          </Link>
        </div>
      </main>
    </div>
  );
}
