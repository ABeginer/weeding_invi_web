"use client";

import * as React from "react";
import Link from "next/link";
import { LogOut, Menu, Shield } from "lucide-react";
import { SITE_LINKS } from "@/config/site";
import { getOpsRoleLabel, type OpsRole } from "@/lib/ops-roles";

interface OpsHeaderProps {
  adminEmail: string;
  role: OpsRole;
  onOpenMobileMenu?: () => void;
}

export function OpsHeader({
  adminEmail,
  role,
  onOpenMobileMenu,
}: OpsHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
      {/* Left side: Hamburger button on mobile */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Mở menu quản trị"
          className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-lg border border-border text-text hover:border-accent md:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-soft text-accent-text">
            <Shield className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="hidden sm:inline">Khu vực quản trị</span>
        </div>
      </div>

      {/* Right side: Admin email and logout button */}
      <div className="flex items-center gap-3">
        <span className="hidden rounded-full border border-border bg-surface-alt px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-text-muted uppercase sm:inline">
          {getOpsRoleLabel(role)}
        </span>
        <span className="max-w-[220px] truncate text-xs font-medium text-text sm:text-sm">
          {adminEmail || "Admin"}
        </span>

        <Link
          href={SITE_LINKS.logout}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text transition-colors hover:border-danger-border hover:bg-danger-bg hover:text-danger-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Đăng xuất</span>
        </Link>
      </div>
    </header>
  );
}

