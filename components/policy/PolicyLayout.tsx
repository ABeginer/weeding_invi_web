import * as React from "react";
import Link from "next/link";
import { ChevronRight, FileText, Mail, Phone, ShieldCheck, User } from "lucide-react";
import { LandingFooter } from "@/components/landing/footer";
import { LandingNavbar } from "@/components/landing/navbar";
import { LEGAL_INFO, LEGAL_POLICIES } from "@/lib/legal-config";
import { cn } from "@/lib/utils";

interface PolicyLayoutProps {
  currentSlug: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function PolicyLayout({
  currentSlug,
  title,
  subtitle,
  children,
}: PolicyLayoutProps) {
  const currentPolicy = LEGAL_POLICIES.find((p) => p.slug === currentSlug);

  return (
    <div className="landing-theme min-h-screen-dvh overflow-x-hidden bg-[#FAF8F5] text-[#1F1D1A]">
      {/* Site-wide Navbar */}
      <LandingNavbar isAuthenticated={false} />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Đường dẫn trang"
          className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-[#6B655E]"
        >
          <Link
            href="/"
            className="rounded px-0.5 transition-colors hover:text-[#7A1C24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]/30"
          >
            Trang chủ
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#B89B72]/80" aria-hidden="true" />
          <span className="text-[#6B655E]">Chính sách &amp; Pháp lý</span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#B89B72]/80" aria-hidden="true" />
          <span aria-current="page" className="font-medium text-[#7A1C24]">
            {currentPolicy?.shortTitle || title}
          </span>
        </nav>

        {/* Mobile Quick Navigation Tabs */}
        <div className="mb-6 block lg:hidden">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#B89B72]">
            Các chính sách quy định
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {LEGAL_POLICIES.map((p) => {
              const isActive = p.slug === currentSlug;
              return (
                <Link
                  key={p.slug}
                  href={p.href}
                  className={cn(
                    "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                    isActive
                      ? "border-[#7A1C24] bg-[#7A1C24] text-white shadow-2xs"
                      : "border-[#E8E2D9] bg-white text-[#6B655E] hover:border-[#B89B72] hover:text-[#1F1D1A]",
                  )}
                >
                  {p.shortTitle}
                </Link>
              );
            })}
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left Column: Sticky Policy Navigation & Owner Contact Card */}
          <aside className="hidden lg:col-span-4 lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Navigation Box */}
              <div className="rounded-2xl border border-[#E8E2D9] bg-white p-5 shadow-2xs">
                <div className="flex items-center gap-2 border-b border-[#E8E2D9] pb-3">
                  <FileText className="h-4 w-4 text-[#7A1C24]" />
                  <h2 className="font-serif text-base font-semibold text-[#1F1D1A]">
                    Chính sách &amp; Quy định
                  </h2>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-[#6B655E]">
                  Tuân thủ quy định thương mại điện tử theo Nghị định 52/2013/NĐ-CP &amp; Nghị định 85/2021/NĐ-CP.
                </p>

                <nav className="mt-4 space-y-1" aria-label="Danh mục chính sách">
                  {LEGAL_POLICIES.map((p) => {
                    const isActive = p.slug === currentSlug;
                    return (
                      <Link
                        key={p.slug}
                        href={p.href}
                        className={cn(
                          "flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all",
                          isActive
                            ? "bg-[#FAF8F5] text-[#7A1C24] font-semibold border-l-3 border-[#7A1C24] pl-2.5 shadow-2xs"
                            : "text-[#6B655E] hover:bg-[#FAF8F5]/80 hover:text-[#1F1D1A]",
                        )}
                      >
                        <span>{p.navTitle}</span>
                        {isActive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#7A1C24]" aria-hidden="true" />
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Owner / Official Contact Card */}
              <div className="rounded-2xl border border-[#E8E2D9] bg-[#FAF8F5] p-5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#7A1C24]">
                  <ShieldCheck className="h-4 w-4 text-[#B89B72]" />
                  <span>Đơn vị sở hữu website</span>
                </div>
                <div className="mt-3 space-y-2 text-xs text-[#6B655E]">
                  <div className="flex items-start gap-2">
                    <User className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#B89B72]" />
                    <div>
                      <p className="font-medium text-[#1F1D1A]">{LEGAL_INFO.ownerName}</p>
                      <p className="text-[11px] text-[#8C827A]">Chủ sở hữu nền tảng {LEGAL_INFO.brandName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-[#B89B72]" />
                    <a
                      href={LEGAL_INFO.hotlineHref}
                      className="font-medium text-[#1F1D1A] hover:text-[#7A1C24] hover:underline"
                    >
                      {LEGAL_INFO.hotline}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-[#B89B72]" />
                    <a
                      href={`mailto:${LEGAL_INFO.email}`}
                      className="break-all text-[#1F1D1A] hover:text-[#7A1C24] hover:underline"
                    >
                      {LEGAL_INFO.email}
                    </a>
                  </div>
                </div>
                <p className="mt-3 border-t border-[#E8E2D9] pt-2 text-[10px] text-[#8C827A]">
                  Địa chỉ: {LEGAL_INFO.address}
                </p>
              </div>
            </div>
          </aside>

          {/* Right Column: Editorial Prose Content */}
          <section className="lg:col-span-8">
            <article className="rounded-3xl border border-[#E8E2D9] bg-white p-6 sm:p-10 shadow-2xs">
              {/* Header */}
              <div className="border-b border-[#E8E2D9] pb-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#B89B72]/30 bg-[#B89B72]/10 px-3 py-1 text-[11px] font-semibold text-[#7A1C24]">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#B89B72]" />
                    Văn bản pháp lý chính thức
                  </span>
                  <span className="text-[11px] text-[#6B655E]">
                    Hiệu lực từ ngày: <strong className="text-[#1F1D1A]">{LEGAL_INFO.effectiveDate}</strong>
                  </span>
                </div>

                <h1 className="mt-4 font-serif text-2xl font-normal leading-tight text-[#1F1D1A] sm:text-3xl lg:text-[2rem]">
                  {title}
                </h1>

                {subtitle && (
                  <p className="mt-3 text-sm leading-relaxed text-[#6B655E] sm:text-base">
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Body Content */}
              <div className="prose prose-neutral max-w-none pt-6 text-sm leading-relaxed text-[#1F1D1A] sm:text-[15px]">
                {children}
              </div>

              {/* Bottom Reassurance Card */}
              <div className="mt-10 rounded-2xl border border-[#E8E2D9] bg-[#FAF8F5] p-5 sm:p-6">
                <h3 className="font-serif text-base font-semibold text-[#1F1D1A]">
                  Bạn cần giải đáp thêm về các điều khoản hoặc hỗ trợ kỹ thuật?
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#6B655E]">
                  Đội ngũ chăm sóc khách hàng Inviwedd luôn sẵn sàng đồng hành cùng hai bạn chuẩn bị cho ngày trọng đại một cách chu toàn nhất.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <a
                    href={LEGAL_INFO.hotlineHref}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#7A1C24] px-4 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-[#5E141B]"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>Gọi Hotline: {LEGAL_INFO.hotline}</span>
                  </a>
                  <a
                    href={`mailto:${LEGAL_INFO.email}`}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-[#E8E2D9] bg-white px-4 text-xs font-medium text-[#1F1D1A] transition-colors hover:bg-[#F4EFEA]"
                  >
                    <Mail className="h-3.5 w-3.5 text-[#B89B72]" />
                    <span>Gửi Email: {LEGAL_INFO.email}</span>
                  </a>
                </div>
              </div>
            </article>
          </section>
        </div>
      </main>

      {/* Site-wide Footer */}
      <div className="border-t border-[#E8E2D9]">
        <LandingFooter />
      </div>
    </div>
  );
}
