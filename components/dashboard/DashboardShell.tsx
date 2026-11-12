"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, LogOut } from "lucide-react";
import { ApiError, syncMe } from "@/lib/api";

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
    <div className="min-h-screen bg-bg text-fg">
      <a
        href="#dashboard-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-xs focus:font-medium focus:text-white"
      >
        Chuyển tới nội dung chính
      </a>

      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg px-1 py-0.5 text-base font-semibold text-fg hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-lg"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-hover">
                <Heart className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="truncate">Quản lý Thiệp Cưới</span>
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {userEmail && (
              <span className="hidden max-w-[220px] truncate rounded-full bg-surface-muted px-3 py-1 text-xs text-fg-muted sm:inline-block">
                {userEmail}
              </span>
            )}
            <a
              href="/auth/logout"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-medium text-fg transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Đăng xuất</span>
            </a>
          </div>
        </div>
      </header>

      <main
        id="dashboard-main-content"
        className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8"
      >
        {children}
      </main>
    </div>
  );
}

