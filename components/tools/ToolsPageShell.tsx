import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { LandingFooter } from "@/components/landing/footer";
import { LandingNavbar } from "@/components/landing/navbar";

export interface BreadcrumbItem {
  label: string;
  href: string;
}

interface ToolsPageShellProps {
  breadcrumbs?: readonly BreadcrumbItem[];
  children: React.ReactNode;
}

export function ToolsPageShell({ breadcrumbs, children }: ToolsPageShellProps) {
  return (
    <div className="landing-theme min-h-screen-dvh overflow-x-hidden bg-bg text-text print:min-h-0 print:bg-white">
      <div className="print:hidden">
        <LandingNavbar isAuthenticated={false} />
      </div>

      <main className="mx-auto w-full max-w-5xl px-4 py-7 sm:px-6 sm:py-10 print:max-w-none print:p-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            aria-label="Đường dẫn trang"
            className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-text-muted print:hidden"
          >
            {breadcrumbs.map((item, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={item.href}>
                  {idx > 0 && (
                    <ChevronRight
                      className="h-3.5 w-3.5 shrink-0 text-text-muted/70"
                      aria-hidden="true"
                    />
                  )}
                  {isLast ? (
                    <span
                      aria-current="page"
                      className="font-medium text-accent-text"
                    >
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className="rounded px-0.5 transition-colors hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                    >
                      {item.label}
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        )}

        {children}
      </main>

      <div className="border-t border-border print:hidden">
        <LandingFooter />
      </div>
    </div>
  );
}
