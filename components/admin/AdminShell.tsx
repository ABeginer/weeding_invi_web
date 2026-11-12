"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, ExternalLink, LogOut, MessageSquareHeart, Users } from "lucide-react";
import { adminLogout, adminMe } from "@/lib/api";
import { wedding } from "@/content/wedding";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

const NAV_TABS = [
  { href: "/admin/guests", label: "Khách mời", Icon: Users },
  { href: "/admin/wishes", label: "Lời chúc", Icon: MessageSquareHeart },
  { href: "/admin/overview", label: "Tổng quan", Icon: BarChart3 },
];

type AuthState = "checking" | "authenticated" | "unauthenticated";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();
  const [loggingOut, setLoggingOut] = React.useState(false);
  const [authState, setAuthState] = React.useState<AuthState>(
    pathname === "/admin/login" ? "authenticated" : "checking"
  );

  React.useEffect(() => {
    if (pathname === "/admin/login") {
      setAuthState("authenticated");
      return;
    }

    let active = true;
    setAuthState("checking");

    adminMe()
      .then((ok) => {
        if (!active) return;
        if (ok) {
          setAuthState("authenticated");
        } else {
          setAuthState("unauthenticated");
          router.replace("/admin/login");
        }
      })
      .catch(() => {
        if (!active) return;
        setAuthState("unauthenticated");
        router.replace("/admin/login");
      });

    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (authState !== "authenticated") {
    return (
      <div className="min-h-screen bg-bg px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-9 w-28" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await adminLogout();
      setAuthState("unauthenticated");
      showToast("Đã đăng xuất", "info");
      router.replace("/admin/login");
    } catch {
      showToast("Có lỗi khi đăng xuất", "error");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-fg">
      <a
        href="#admin-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-xs focus:font-medium focus:text-white"
      >
        Chuyển tới nội dung chính
      </a>
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/guests"
                className="font-display text-2xl font-semibold text-fg hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg px-1"
              >
                {wedding.groom.shortName} &amp; {wedding.bride.shortName}
              </Link>
              <span className="hidden rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent-hover sm:inline-block">
                Quản trị thiệp
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-medium text-fg transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span>Xem thiệp</span>
                <ExternalLink className="h-3.5 w-3.5 text-fg-muted" aria-hidden="true" />
              </Link>

              <Button
                variant="outline"
                size="sm"
                loading={loggingOut}
                onClick={handleLogout}
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Đăng xuất</span>
              </Button>
            </div>
          </div>

          <nav
            aria-label="Điều hướng trang quản trị"
            className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5"
          >
            {NAV_TABS.map(({ href, label, Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    active
                      ? "bg-accent text-white shadow-xs"
                      : "text-fg-muted hover:bg-surface-muted hover:text-fg"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main
        id="admin-main-content"
        className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8"
      >
        {children}
      </main>
    </div>
  );
}
