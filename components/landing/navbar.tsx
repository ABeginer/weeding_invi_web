"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useUser } from "@auth0/nextjs-auth0";
import { ProfileMenu } from "@/components/theme/ProfileMenu";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LANDING_COPY } from "@/config/landing";
import { AUTH0_EMAIL_CLAIM, SITE_LINKS, SITE_NAME } from "@/config/site";

interface LandingNavbarProps {
  isAuthenticated?: boolean;
  userEmail?: string | null;
  hideThemeToggle?: boolean;
  revealMobileCtaOnScroll?: boolean;
}

interface LandingNavbarContentProps {
  isAuthenticated: boolean;
  userEmail: string | null;
  hideThemeToggle?: boolean;
  revealMobileCtaOnScroll?: boolean;
}

function LandingNavbarContent({
  isAuthenticated,
  userEmail,
  hideThemeToggle = false,
  revealMobileCtaOnScroll = false,
}: LandingNavbarContentProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [scrolledPastHero, setScrolledPastHero] = React.useState(false);

  React.useEffect(() => {
    if (!revealMobileCtaOnScroll || typeof window === "undefined") return;
    const onScroll = () => {
      const next = window.scrollY > 260;
      setScrolledPastHero((prev) => (prev === next ? prev : next));
    };
    const rafId = window.requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
    };
  }, [revealMobileCtaOnScroll]);

  const showMobileCta = !revealMobileCtaOnScroll || scrolledPastHero;

  React.useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-[#E8E2D9] bg-[#FAF8F5]/95 transition-colors duration-200 md:bg-[#FAF8F5]/85 md:backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href={SITE_LINKS.home}
          className="inline-flex items-center gap-2 rounded-lg font-serif text-2xl font-semibold tracking-tight text-[#1F1D1A] transition-colors hover:text-[#7A1C24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
        >
          <span>{SITE_NAME}</span>
        </Link>

        <nav
          aria-label="Điều hướng chính"
          className="hidden items-center gap-8 md:flex"
        >
          {LANDING_COPY.navbar.links.map((item) =>
            item.href.includes("#") ? (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-[#1F1D1A]/80 transition-colors hover:text-[#7A1C24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-[#1F1D1A]/80 transition-colors hover:text-[#7A1C24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-3.5 md:flex">
          {!hideThemeToggle && <ThemeToggle />}
          {isAuthenticated ? (
            <ProfileMenu email={userEmail} />
          ) : (
            <a
              href={SITE_LINKS.login}
              className="text-sm font-medium text-[#1F1D1A]/85 transition-colors hover:text-[#7A1C24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
            >
              {LANDING_COPY.navbar.loginLabel}
            </a>
          )}
          <Link
            href={SITE_LINKS.createWedding}
            className="inline-flex h-9 items-center justify-center rounded-full bg-[#7A1C24] px-5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#5E141B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F5]"
          >
            {LANDING_COPY.navbar.startLabel}
          </Link>
        </div>

        {/* Điều khiển mobile: Theme / Profile + CTA Tạo thiệp + Nút mở menu */}
        <div className="flex items-center md:hidden">
          {!hideThemeToggle && (
            <div className="mr-2">
              <ThemeToggle />
            </div>
          )}
          {isAuthenticated && (
            <div className="mr-2">
              <ProfileMenu email={userEmail} />
            </div>
          )}
          <Link
            href={SITE_LINKS.createWedding}
            aria-hidden={!showMobileCta}
            tabIndex={showMobileCta ? 0 : -1}
            className={`inline-flex h-9 items-center justify-center whitespace-nowrap rounded-full bg-[#7A1C24] text-xs font-semibold text-white shadow-2xs transition-all duration-200 hover:bg-[#5E141B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24] ${
              showMobileCta
                ? "mr-2 max-w-[120px] translate-y-0 px-3.5 opacity-100 scale-100"
                : "pointer-events-none mr-0 w-0 min-w-0 max-w-0 -translate-y-1 overflow-hidden border-0 px-0 opacity-0 scale-95"
            }`}
          >
            Tạo thiệp
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-label={
              menuOpen
                ? LANDING_COPY.navbar.menuCloseLabel
                : LANDING_COPY.navbar.menuOpenLabel
            }
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-[#E8E2D9] bg-white text-[#1F1D1A] transition-colors hover:border-[#7A1C24] hover:text-[#7A1C24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
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
        <div className="border-t border-[#E8E2D9] bg-[#FAF8F5] px-4 py-4 md:hidden">
          <nav aria-label="Menu di động" className="flex flex-col gap-2">
            {LANDING_COPY.navbar.links.map((item) =>
              item.href.includes("#") ? (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-[#1F1D1A] transition-colors hover:bg-[#F4EFEA] hover:text-[#7A1C24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-[#1F1D1A] transition-colors hover:bg-[#F4EFEA] hover:text-[#7A1C24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className="mt-4 flex flex-col gap-2 border-t border-[#E8E2D9] pt-4">
            <Link
              href={SITE_LINKS.createWedding}
              onClick={() => setMenuOpen(false)}
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#7A1C24] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#5E141B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
            >
              {LANDING_COPY.navbar.startLabel}
            </Link>
            {isAuthenticated ? (
              <Link
                href={SITE_LINKS.dashboard}
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-full border border-[#E8E2D9] bg-white px-5 text-sm font-medium text-[#1F1D1A] transition-colors hover:bg-[#F4EFEA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
              >
                {LANDING_COPY.navbar.dashboardLabel}
              </Link>
            ) : (
              <a
                href={SITE_LINKS.login}
                className="inline-flex h-10 items-center justify-center rounded-full border border-[#E8E2D9] bg-white px-5 text-sm font-medium text-[#1F1D1A] transition-colors hover:bg-[#F4EFEA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
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

function LandingNavbarWithAuth({
  userEmail: propUserEmail,
  hideThemeToggle = false,
  revealMobileCtaOnScroll = false,
}: {
  userEmail?: string | null;
  hideThemeToggle?: boolean;
  revealMobileCtaOnScroll?: boolean;
}) {
  const { user } = useUser();
  const sessionEmail = React.useMemo(() => {
    const record = user as Record<string, unknown> | null | undefined;
    const raw = record?.email ?? record?.[AUTH0_EMAIL_CLAIM];
    return typeof raw === "string" && raw.trim() ? raw.trim() : null;
  }, [user]);

  return (
    <LandingNavbarContent
      isAuthenticated={Boolean(user)}
      userEmail={propUserEmail !== undefined ? propUserEmail : sessionEmail}
      hideThemeToggle={hideThemeToggle}
      revealMobileCtaOnScroll={revealMobileCtaOnScroll}
    />
  );
}

export function LandingNavbar(props: LandingNavbarProps = {}) {
  if (props.isAuthenticated !== undefined) {
    return (
      <LandingNavbarContent
        isAuthenticated={props.isAuthenticated}
        userEmail={props.userEmail ?? null}
        hideThemeToggle={props.hideThemeToggle}
        revealMobileCtaOnScroll={props.revealMobileCtaOnScroll}
      />
    );
  }
  return (
    <LandingNavbarWithAuth
      userEmail={props.userEmail}
      hideThemeToggle={props.hideThemeToggle}
      revealMobileCtaOnScroll={props.revealMobileCtaOnScroll}
    />
  );
}
