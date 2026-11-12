"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, LogOut } from "lucide-react";
import { SITE_LINKS, SITE_NAME } from "@/config/site";
import { ApiError, syncMe } from "@/lib/api";
import { dashboardThemeCssVars } from "@/lib/theme";

interface DashboardShellProps {
  userEmail?: string | null;
  children: React.ReactNode;
}

export function DashboardShell({ userEmail, children }: DashboardShellProps) {
  React.useEffect(() => {
    syncMe().catch((err) => {
      if (err instanceof ApiError && err.status === 401) {
        window.location.assign("/auth/login");
      }
    });
  }, []);

  return (
    <div
      style={dashboardThemeCssVars as React.CSSProperties}
      className="dashboard-theme min-h-screen bg-bg text-fg font-sans"
    >
      <a
        href="#dashboard-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-xs focus:font-semibold focus:text-accent-fg"
      >
        Chuyển tới nội dung chính
      </a>

      <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <Link
              href={SITE_LINKS.home}
              className="hidden shrink-0 items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] font-medium tracking-[0.16em] text-accent uppercase transition-colors hover:border-accent sm:inline-flex"
            >
              <span>{SITE_NAME}</span>
            </Link>
            <Link
              href={SITE_LINKS.dashboard}
              className="inline-flex min-w-0 items-center gap-2.5 rounded-lg px-1 py-0.5 text-fg transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/35 bg-accent-soft text-accent">
                <Heart className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="truncate font-display text-xl font-semibold tracking-tight text-accent sm:text-2xl">
                Quản lý Thiệp Cưới
              </span>
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {userEmail && (
              <span className="hidden max-w-[240px] truncate rounded-full border border-border bg-surface px-3 py-1 text-xs text-fg-muted sm:inline-block">
                {userEmail}
              </span>
            )}
            <a
              href={SITE_LINKS.logout}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-medium text-fg transition-colors hover:border-accent/60 hover:bg-surface-muted hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Đăng xuất</span>
            </a>
          </div>
        </div>
      </header>

      <main
        id="dashboard-main-content"
        className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8"
      >
        {children}
      </main>
    </div>
  );
}
