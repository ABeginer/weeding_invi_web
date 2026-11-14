"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import { ProfileMenu } from "@/components/theme/ProfileMenu";
import { useBrandTheme } from "@/components/theme/ThemeProvider";
import { SITE_LINKS, SITE_NAME } from "@/config/site";
import { ApiError, syncMe } from "@/lib/api";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  userEmail?: string | null;
  children: React.ReactNode;
}

export function DashboardShell({ userEmail, children }: DashboardShellProps) {
  const pathname = usePathname();
  const { setSessionInfo, adoptAccountTheme } = useBrandTheme();

  React.useEffect(() => {
    setSessionInfo({ isAuthenticated: true, email: userEmail ?? null });
    let cancelled = false;

    syncMe()
      .then((profile) => {
        if (cancelled) return;
        setSessionInfo({
          isAuthenticated: true,
          email: profile.email ?? userEmail ?? null,
        });
        if (profile.theme) {
          adoptAccountTheme(profile.theme);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          window.location.assign("/auth/login");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [adoptAccountTheme, setSessionInfo, userEmail]);

  return (
    <div className="dashboard-theme min-h-screen-dvh bg-bg text-text font-sans">
      <a
        href="#dashboard-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-xs focus:font-semibold focus:text-accent-fg"
      >
        Chuyển tới nội dung chính
      </a>

      <header className="sticky top-0 z-30 border-b border-border bg-bg/95 sm:bg-bg/85 sm:backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <Link
              href={SITE_LINKS.home}
              className="hidden shrink-0 items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] font-medium tracking-[0.16em] text-accent-text uppercase transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring sm:inline-flex"
            >
              <span>{SITE_NAME}</span>
            </Link>
            <Link
              href={SITE_LINKS.dashboard}
              className="inline-flex min-w-0 items-center gap-2 rounded-lg px-1 py-0.5 text-text transition-colors hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-accent/40 bg-accent-soft text-text">
                <Heart className="h-3.5 w-3.5 text-accent-text" aria-hidden="true" />
              </span>
              <span className="truncate font-display text-lg font-semibold tracking-tight text-accent-text sm:text-xl">
                Quản lý Thiệp Cưới
              </span>
            </Link>

            <nav className="ml-1 flex items-center gap-1 sm:ml-3 sm:gap-1.5" aria-label="Điều hướng chính Dashboard">
              <Link
                href="/dashboard"
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                  pathname === "/dashboard"
                    ? "bg-accent-soft font-semibold text-accent-text"
                    : "text-text-muted hover:bg-surface hover:text-text",
                )}
              >
                Thiệp cưới
              </Link>
              <Link
                href="/dashboard/so-mung"
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                  pathname.startsWith("/dashboard/so-mung")
                    ? "bg-accent-soft font-semibold text-accent-text"
                    : "text-text-muted hover:bg-surface hover:text-text",
                )}
              >
                Sổ mừng
              </Link>
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {userEmail && (
              <span className="hidden max-w-[240px] truncate rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-muted sm:inline-block">
                {userEmail}
              </span>
            )}
            <ProfileMenu email={userEmail} />
          </div>
        </div>
      </header>

      <main
        id="dashboard-main-content"
        className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6"
      >
        {children}
      </main>
    </div>
  );
}
