"use client";

import * as React from "react";
import { notFound } from "next/navigation";
import { getOpsMe, type OpsMe } from "@/lib/ops-api";
import { OpsHeader } from "@/components/ops/OpsHeader";
import { OpsSidebar } from "@/components/ops/OpsSidebar";
import { Loader2 } from "lucide-react";

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  const [me, setMe] = React.useState<OpsMe | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    getOpsMe()
      .then((data) => {
        if (cancelled) return;
        setMe(data);
      })
      .catch(() => {
        if (cancelled) return;
        setMe({ email: "", isAdmin: false });
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

  // Non-admins see standard 404
  if (!me || !me.isAdmin) {
    notFound();
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg text-text">
      {/* Sidebar for desktop & mobile sheet */}
      <OpsSidebar
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <OpsHeader
          adminEmail={me.email}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

