"use client";

import * as React from "react";
import Link from "next/link";
import { LayoutDashboard, LogOut, Moon, Sun } from "lucide-react";
import { SITE_LINKS } from "@/config/site";
import { cn } from "@/lib/utils";
import { useBrandTheme } from "./ThemeProvider";

function getAvatarInitial(email: string | null | undefined): string {
  const trimmed = (email ?? "").trim();
  if (!trimmed) return "U";
  return trimmed.charAt(0).toUpperCase();
}

export function ProfileMenu({
  email,
  className,
}: {
  email?: string | null;
  className?: string;
}) {
  const { theme, userEmail, toggleTheme } = useBrandTheme();
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const itemRefs = React.useRef<Array<HTMLElement | null>>([]);

  const resolvedEmail = email ?? userEmail;
  const initial = getAvatarInitial(resolvedEmail);
  const isDark = theme === "dark";

  React.useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      itemRefs.current[0]?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const items = itemRefs.current.filter((el): el is HTMLElement => Boolean(el));
    if (items.length === 0) return;

    const currentIndex = items.findIndex((el) => el === document.activeElement);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % items.length : 0;
      items[nextIndex]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const prevIndex =
        currentIndex >= 0
          ? (currentIndex - 1 + items.length) % items.length
          : items.length - 1;
      items[prevIndex]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      items[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      items[items.length - 1]?.focus();
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Mở menu tài khoản"
        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border bg-accent text-sm font-semibold text-accent-fg shadow-xs transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Menu tài khoản"
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 z-50 mt-2 w-60 rounded-2xl border border-border bg-surface p-1.5 shadow-xl"
        >
          {resolvedEmail && (
            <div className="border-b border-border px-3 py-2">
              <p className="truncate text-xs font-medium text-text-muted">
                {resolvedEmail}
              </p>
            </div>
          )}

          <div className="py-1">
            <Link
              ref={(el) => {
                itemRefs.current[0] = el;
              }}
              role="menuitem"
              href={SITE_LINKS.dashboard}
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-text transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              <LayoutDashboard
                className="h-4 w-4 text-accent-text"
                aria-hidden="true"
              />
              <span>Dashboard</span>
            </Link>

            <button
              ref={(el) => {
                itemRefs.current[1] = el;
              }}
              type="button"
              role="menuitemcheckbox"
              aria-checked={isDark}
              onClick={() => {
                void toggleTheme();
              }}
              className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-text transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              <span className="inline-flex items-center gap-2.5">
                {isDark ? (
                  <Moon className="h-4 w-4 text-accent-text" aria-hidden="true" />
                ) : (
                  <Sun className="h-4 w-4 text-accent-text" aria-hidden="true" />
                )}
                <span>Giao diện</span>
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-alt px-2.5 py-0.5 text-xs font-semibold text-text">
                <span>{isDark ? "Tối" : "Sáng"}</span>
              </span>
            </button>
          </div>

          <div className="border-t border-border pt-1">
            <a
              ref={(el) => {
                itemRefs.current[2] = el;
              }}
              role="menuitem"
              href={SITE_LINKS.logout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-danger-fg transition-colors hover:bg-danger-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>Đăng xuất</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

