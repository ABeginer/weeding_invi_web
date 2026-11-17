"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  ClipboardList,
  Heart,
  LayoutDashboard,
  LayoutGrid,
  LayoutTemplate,
  ShoppingBag,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getOpsHomePath,
  getOpsRoleLabel,
  type OpsRole,
} from "@/lib/ops-roles";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  roles: OpsRole[];
}

export const OPS_NAV_ITEMS: NavItem[] = [
  { label: "Tổng quan", href: "/ops", icon: LayoutDashboard, roles: ["admin"] },
  { label: "Thiệp", href: "/ops/weddings", icon: Heart, roles: ["admin"] },
  {
    label: "Template",
    href: "/ops/templates",
    icon: LayoutGrid,
    roles: ["admin", "designer"],
  },
  {
    label: "Thiết kế mẫu",
    href: "/ops/designer",
    icon: LayoutTemplate,
    roles: ["admin", "designer"],
  },
  { label: "Người dùng", href: "/ops/users", icon: Users, roles: ["admin"] },
  { label: "Đơn hàng", href: "/ops/orders", icon: ShoppingBag, roles: ["admin"] },
  {
    label: "Giao dịch chưa khớp",
    href: "/ops/transactions",
    icon: ArrowLeftRight,
    roles: ["admin"],
  },
  {
    label: "Nhật ký",
    href: "/ops/audit",
    icon: ClipboardList,
    roles: ["admin"],
  },
  { label: "Phân quyền", href: "/ops/roles", icon: UserCog, roles: ["admin"] },
];

interface OpsSidebarProps {
  role: OpsRole;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function OpsSidebar({
  role,
  isOpenMobile = false,
  onCloseMobile,
}: OpsSidebarProps) {
  const pathname = usePathname();
  const items = OPS_NAV_ITEMS.filter((item) => item.roles.includes(role));

  const isItemActive = (href: string) => {
    if (href === "/ops") return pathname === "/ops";
    return pathname.startsWith(href);
  };

  const navContent = (
    <div className="flex h-full flex-col bg-surface text-text">
      {/* Brand / Logo */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
        <Link
          href={getOpsHomePath(role)}
          className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-accent-text"
        >
          <span>Inviwedd Ops</span>
        </Link>
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Đóng thanh điều hướng"
            className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-lg border border-border text-text-muted hover:border-accent hover:text-text md:hidden"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1.5">
          {items.map((item) => {
            const active = isItemActive(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onCloseMobile}
                  className={cn(
                    "flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-accent-fg shadow-xs font-semibold"
                      : "text-text hover:bg-surface-alt",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden={true} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer info */}
      <div className="border-t border-border p-4 text-xs text-text-muted">
        <p className="font-semibold text-text">Ops Control Panel</p>
        <p className="mt-0.5 text-[11px]">Vai trò: {getOpsRoleLabel(role)}</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar (240px) */}
      <aside className="hidden h-screen w-[240px] shrink-0 border-r border-border md:block">
        {navContent}
      </aside>

      {/* Mobile drawer / sheet */}
      {isOpenMobile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu quản trị Ops"
          className="fixed inset-0 z-50 flex md:hidden"
        >
          {/* Backdrop */}
          <div
            aria-hidden="true"
            onClick={onCloseMobile}
            className="fixed inset-0 bg-bg/85 backdrop-blur-xs transition-opacity"
          />
          {/* Drawer container */}
          <div className="relative z-10 w-[280px] max-w-[80vw] bg-surface shadow-2xl">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
