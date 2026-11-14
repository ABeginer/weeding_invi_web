"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ProfileMenu } from "@/components/theme/ProfileMenu";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LANDING_COPY } from "@/config/landing";
import { SITE_LINKS, SITE_NAME } from "@/config/site";

interface LandingNavbarProps {
  isAuthenticated: boolean;
  userEmail?: string | null;
}

export function LandingNavbar({
  isAuthenticated,
  userEmail,
}: LandingNavbarProps) {
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
    <header className="sticky top-0 z-40 border-b border-border bg-bg/95 sm:bg-bg/85 sm:backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
        <Link
          href={SITE_LINKS.home}
          className="inline-flex items-center gap-2 rounded-lg px-1 py-0.5 font-display text-xl font-semibold tracking-wide text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring sm:text-2xl"
        >
          <span>{SITE_NAME}</span>
        </Link>

        <nav
          aria-label="Điều hướng chính"
          className="hidden items-center gap-7 md:flex"
        >
          {LANDING_COPY.navbar.links.map((item) =>
            item.href.includes("#") ? (
              <a
                key={item.href}
                href={item.href}
                className="rounded-md px-1 py-1 text-sm text-text transition-colors hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-1 py-1 text-sm text-text transition-colors hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          <ThemeToggle />
          <Link
            href={SITE_LINKS.createWedding}
            className="inline-flex h-9 items-center justify-center rounded-full bg-accent px-5 text-xs font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            {LANDING_COPY.navbar.startLabel}
          </Link>
          {isAuthenticated ? (
            <ProfileMenu email={userEmail} />
          ) : (
            <a
              href={SITE_LINKS.login}
              className="inline-flex h-9 items-center justify-center rounded-full border border-text bg-transparent px-4 text-xs font-medium text-text transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              {LANDING_COPY.navbar.loginLabel}
            </a>
          )}
        </div>

        {/* Điều khiển mobile: Theme / Profile + Nút mở menu */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          {isAuthenticated && <ProfileMenu email={userEmail} />}

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-label={
              menuOpen
                ? LANDING_COPY.navbar.menuCloseLabel
                : LANDING_COPY.navbar.menuOpenLabel
            }
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border bg-surface text-text transition-colors hover:border-accent hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            {menuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Menu mở rộng trên điện thoại */}
      {menuOpen && (
        <div className="border-t border-border bg-surface px-4 py-4 md:hidden">
          <nav aria-label="Menu di động" className="flex flex-col gap-2">
            {LANDING_COPY.navbar.links.map((item) =>
              item.href.includes("#") ? (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-text transition-colors hover:bg-surface-alt hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-text transition-colors hover:bg-surface-alt hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
            <Link
              href={SITE_LINKS.createWedding}
              onClick={() => setMenuOpen(false)}
              className="inline-flex h-10 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              {LANDING_COPY.navbar.startLabel}
            </Link>
            {isAuthenticated ? (
              <Link
                href={SITE_LINKS.dashboard}
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-full border border-text bg-transparent px-5 text-sm font-medium text-text transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                {LANDING_COPY.navbar.dashboardLabel}
              </Link>
            ) : (
              <a
                href={SITE_LINKS.login}
                className="inline-flex h-10 items-center justify-center rounded-full border border-text bg-transparent px-5 text-sm font-medium text-text transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                {LANDING_COPY.navbar.loginLabel}
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
