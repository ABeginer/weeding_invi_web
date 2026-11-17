"use client";

import * as React from "react";
import { notFound, usePathname, useRouter } from "next/navigation";
import { getOpsMe, OPS_ERROR_EVENT, type OpsMe } from "@/lib/ops-api";
import { getOpsHomePath, isOpsPathAllowed } from "@/lib/ops-roles";
import { OpsHeader } from "@/components/ops/OpsHeader";
import { OpsRoleProvider } from "@/components/ops/OpsRoleContext";
import { OpsSidebar } from "@/components/ops/OpsSidebar";
import { AlertCircle, Loader2, X } from "lucide-react";

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = React.useState<OpsMe | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);

  const role = me?.role ?? null;
  const pathAllowed = role ? isOpsPathAllowed(role, pathname ?? "") : false;

  React.useEffect(() => {
    const handleError = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setApiError(detail || "Không thể tải dữ liệu quản trị.");
    };
    window.addEventListener(OPS_ERROR_EVENT, handleError);
    return () => window.removeEventListener(OPS_ERROR_EVENT, handleError);
  }, []);


  React.useEffect(() => {
    let cancelled = false;
    let retryTimer: number | undefined;

    const loadMe = (attempt: number) => {
      getOpsMe()
        .then((data) => {
          if (cancelled) return;
          setMe(data);
          setIsLoading(false);
        })
        .catch(() => {
          if (cancelled) return;
          // Auth0 v4 có thể chưa kịp trả access token ngay sau khi điều hướng.
          // Thử lại vài lần thay vì render 404 bắt người dùng F5.
          if (attempt < 6) {
            retryTimer = window.setTimeout(
              () => loadMe(attempt + 1),
              300 * (attempt + 1),
            );
            return;
          }
          setMe({ email: "", isAdmin: false, role: null });
          setIsLoading(false);
        });
    };

    loadMe(0);

    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, []);

  // Designer vào path admin (kể cả /ops) thì đưa về trang Template.
  React.useEffect(() => {
    if (!role || pathAllowed) return;
    router.replace(getOpsHomePath(role));
  }, [pathAllowed, role, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg text-text">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-accent-text" />
          <span className="text-xs text-text-muted">Đang xác thực quyền truy cập...</span>
        </div>
      </div>
    );
  }

  // Người không có role ops thấy 404 như cũ.
  if (!me || !role) {
    notFound();
  }

  if (!pathAllowed) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg text-text">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-accent-text" />
          <span className="text-xs text-text-muted">Đang chuyển trang...</span>
        </div>
      </div>
    );
  }

  return (
    <OpsRoleProvider me={me}>
      <div className="flex h-screen w-full overflow-hidden bg-bg text-text">
        {/* Sidebar for desktop & mobile sheet */}
        <OpsSidebar
          role={role}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <OpsHeader
            adminEmail={me.email}
            role={role}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />

          {apiError && (
            <div
              role="alert"
              className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger-border bg-danger-bg p-3.5 text-xs font-semibold text-danger-fg sm:mx-6 lg:mx-8"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{apiError}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setApiError(null);
                    window.location.reload();
                  }}
                  className="inline-flex h-8 cursor-pointer items-center justify-center rounded-lg border border-danger-border bg-surface px-3 font-semibold text-danger-fg transition-colors hover:bg-danger-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  Thử lại
                </button>
                <button
                  type="button"
                  onClick={() => setApiError(null)}
                  aria-label="Đóng thông báo lỗi"
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-danger-fg transition-colors hover:bg-danger-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl w-full">{children}</div>
          </main>
        </div>
      </div>
    </OpsRoleProvider>
  );
}

