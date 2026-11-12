import * as React from "react";
import Link from "next/link";
import { LANDING_COPY } from "@/config/landing";
import { SITE_COPYRIGHT, SITE_EMAIL, SITE_LINKS, SITE_NAME } from "@/config/site";

export function LandingFooter() {
  const copy = LANDING_COPY.footer;

  return (
    <footer className="bg-lnd-bg py-10 text-lnd-muted">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-5 px-4 sm:flex-row sm:items-center sm:px-6">
        <div>
          <Link
            href={SITE_LINKS.home}
            className="font-display text-2xl font-semibold text-lnd-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold"
          >
            {SITE_NAME}
          </Link>
          <p className="mt-1 text-xs text-lnd-muted">{SITE_COPYRIGHT}</p>
        </div>

        <nav
          aria-label="Liên kết pháp lý và liên hệ"
          className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm"
        >
          <Link
            href={SITE_LINKS.privacy}
            className="text-lnd-body transition-colors hover:text-lnd-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold"
          >
            {copy.privacyLabel}
          </Link>
          <Link
            href={SITE_LINKS.terms}
            className="text-lnd-body transition-colors hover:text-lnd-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold"
          >
            {copy.termsLabel}
          </Link>
          <a
            href={`mailto:${SITE_EMAIL}`}
            className="text-lnd-muted transition-colors hover:text-lnd-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold"
          >
            {copy.contactPrefix} {SITE_EMAIL}
          </a>
        </nav>
      </div>
    </footer>
  );
}

