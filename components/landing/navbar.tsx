"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { LANDING_COPY } from "@/config/landing";
import { SITE_LINKS, SITE_NAME } from "@/config/site";

interface LandingNavbarProps {
  isAuthenticated: boolean;
}

export function LandingNavbar({ isAuthenticated }: LandingNavbarProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-lnd-border bg-lnd-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href={SITE_LINKS.home}
          className="inline-flex items-center gap-2 rounded-lg px-1 py-0.5 font-display text-2xl font-semibold tracking-wide text-lnd-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold"
        >
          <span>{SITE_NAME}</span>
        </Link>

        <nav aria-label="Điều hướng chính" className="hidden items-center gap-7 md:flex">
          {LANDING_COPY.navbar.links.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-md px-1 py-1 text-sm text-lnd-body transition-colors hover:text-lnd-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          {isAuthenticated ? (
            <>
              <a
                href={SITE_LINKS.logout}
                className="inline-flex h-9 items-center justify-center rounded-full border border-lnd-border px-4 text-xs font-medium text-lnd-body transition-colors hover:border-lnd-gold hover:text-lnd-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold"
              >
                {LANDING_COPY.navbar.logoutLabel}
              </a>
              <Link
                href={SITE_LINKS.dashboard}
                className="inline-flex h-9 items-center justify-center rounded-full bg-lnd-gold px-5 text-xs font-semibold text-lnd-bg transition-colors hover:bg-lnd-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold focus-visible:ring-offset-2 focus-visible:ring-offset-lnd-bg"
              >
                {LANDING_COPY.navbar.dashboardLabel}
              </Link>
            </>
          ) : (
            <>
              <a
                href={SITE_LINKS.login}
                className="inline-flex h-9 items-center justify-center rounded-full border border-lnd-gold px-4 text-xs font-medium text-lnd-gold transition-colors hover:bg-lnd-gold-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold"
              >
                {LANDING_COPY.navbar.loginLabel}
              </a>
              <a
                href={SITE_LINKS.login}
                className="inline-flex h-9 items-center justify-center rounded-full bg-lnd-gold px-5 text-xs font-semibold text-lnd-bg transition-colors hover:bg-lnd-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold focus-visible:ring-offset-2 focus-visible:ring-offset-lnd-bg"
              >
                {LANDING_COPY.navbar.startLabel}
              </a>
            </>
          )}
        </div>

        {/* Nút menu mobile */}
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
          aria-label={
            menuOpen
              ? LANDING_COPY.navbar.menuCloseLabel
              : LANDING_COPY.navbar.menuOpenLabel
          }
          className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-lnd-border bg-lnd-surface text-lnd-body transition-colors hover:border-lnd-gold hover:text-lnd-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold md:hidden"
        >
          {menuOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Menu mở rộng trên điện thoại */}
      {menuOpen && (
        <div className="border-t border-lnd-border bg-lnd-surface px-4 py-4 md:hidden">
          <nav aria-label="Menu di động" className="flex flex-col gap-2">
            {LANDING_COPY.navbar.links.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-lnd-body transition-colors hover:bg-lnd-surface-hover hover:text-lnd-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mt-4 flex flex-col gap-2 border-t border-lnd-border pt-4">
            {isAuthenticated ? (
              <>
                <Link
                  href={SITE_LINKS.dashboard}
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-lnd-gold px-5 text-sm font-semibold text-lnd-bg transition-colors hover:bg-lnd-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold"
                >
                  {LANDING_COPY.navbar.dashboardLabel}
                </Link>
                <a
                  href={SITE_LINKS.logout}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-lnd-border px-5 text-sm font-medium text-lnd-body transition-colors hover:border-lnd-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold"
                >
                  {LANDING_COPY.navbar.logoutLabel}
                </a>
              </>
            ) : (
              <>
                <a
                  href={SITE_LINKS.login}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-lnd-gold px-5 text-sm font-medium text-lnd-gold transition-colors hover:bg-lnd-gold-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold"
                >
                  {LANDING_COPY.navbar.loginLabel}
                </a>
                <a
                  href={SITE_LINKS.login}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-lnd-gold px-5 text-sm font-semibold text-lnd-bg transition-colors hover:bg-lnd-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold"
                >
                  {LANDING_COPY.navbar.startLabel}
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

