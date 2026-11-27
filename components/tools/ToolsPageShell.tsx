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
    <div className="landing-theme min-h-screen-dvh overflow-x-hidden bg-[#FAF8F5] text-[#1F1D1A] print:min-h-0 print:bg-white">
      <div className="print:hidden">
        <LandingNavbar isAuthenticated={false} />
      </div>

      <main className="mx-auto w-full max-w-5xl xl:max-w-6xl px-4 py-8 sm:px-6 sm:py-12 print:max-w-none print:p-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            aria-label="Đường dẫn trang"
            className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-[#6B655E] print:hidden"
          >
            {breadcrumbs.map((item, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={item.href}>
                  {idx > 0 && (
                    <ChevronRight
                      className="h-3.5 w-3.5 shrink-0 text-[#B89B72]/80"
                      aria-hidden="true"
                    />
                  )}
                  {isLast ? (
                    <span
                      aria-current="page"
                      className="font-medium text-[#7A1C24]"
                    >
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className="rounded px-0.5 transition-colors hover:text-[#7A1C24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]/30"
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

      <div className="border-t border-[#E8E2D9] print:hidden">
        <LandingFooter />
      </div>
    </div>
  );
}

