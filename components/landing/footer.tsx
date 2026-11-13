import * as React from "react";
import Link from "next/link";
import { LANDING_COPY } from "@/config/landing";
import {
  SITE_CONFIG,
  SITE_COPYRIGHT,
  SITE_LINKS,
  SITE_NAME,
} from "@/config/site";

export function LandingFooter() {
  const copy = LANDING_COPY.footer;
  const hasContact = Boolean(
    SITE_CONFIG.contactEmail ||
      SITE_CONFIG.contactPhone ||
      SITE_CONFIG.contactZalo ||
      SITE_CONFIG.contactFacebook,
  );

  return (
    <footer className="bg-bg py-8 text-text-muted">
      <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-4 px-4 sm:flex-row sm:items-center sm:px-6">
        <div>
          <Link
            href={SITE_LINKS.home}
            className="font-display text-xl font-semibold text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring sm:text-2xl"
          >
            {SITE_NAME}
          </Link>
          <p className="mt-1 text-xs text-text-muted">{SITE_COPYRIGHT}</p>
          {(SITE_CONFIG.companyName ||
            SITE_CONFIG.companyAddress ||
            SITE_CONFIG.taxCode) && (
            <div className="mt-2 space-y-0.5 text-xs text-text-muted">
              {SITE_CONFIG.companyName && <p>{SITE_CONFIG.companyName}</p>}
              {SITE_CONFIG.companyAddress && <p>{SITE_CONFIG.companyAddress}</p>}
              {SITE_CONFIG.taxCode && <p>MST: {SITE_CONFIG.taxCode}</p>}
            </div>
          )}
        </div>

        <nav
          aria-label="Liên kết công cụ, pháp lý và liên hệ"
          className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm"
        >
          <Link
            href={SITE_LINKS.tools}
            className="text-text transition-colors hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            {copy.toolsLabel}
          </Link>
          <Link
            href={SITE_LINKS.privacy}
            className="text-text transition-colors hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            {copy.privacyLabel}
          </Link>
          <Link
            href={SITE_LINKS.terms}
            className="text-text transition-colors hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            {copy.termsLabel}
          </Link>

          {hasContact && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/60 pt-2 sm:border-t-0 sm:border-l sm:border-border/60 sm:pt-0 sm:pl-4">
              {SITE_CONFIG.contactEmail && (
                <a
                  href={`mailto:${SITE_CONFIG.contactEmail}`}
                  className="text-text-muted transition-colors hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  {copy.contactPrefix} {SITE_CONFIG.contactEmail}
                </a>
              )}
              {SITE_CONFIG.contactPhone && (
                <a
                  href={`tel:${SITE_CONFIG.contactPhone}`}
                  className="text-text-muted transition-colors hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  Hotline: {SITE_CONFIG.contactPhone}
                </a>
              )}
              {SITE_CONFIG.contactZalo && (
                <a
                  href={
                    SITE_CONFIG.contactZalo.startsWith("http")
                      ? SITE_CONFIG.contactZalo
                      : `https://zalo.me/${SITE_CONFIG.contactZalo}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted transition-colors hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  Zalo: {SITE_CONFIG.contactZalo}
                </a>
              )}
              {SITE_CONFIG.contactFacebook && (
                <a
                  href={SITE_CONFIG.contactFacebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted transition-colors hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  Facebook
                </a>
              )}
            </div>
          )}
        </nav>
      </div>
    </footer>
  );
}
