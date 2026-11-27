import * as React from "react";
import Link from "next/link";
import { HeartHandshake, ShieldCheck, Zap } from "lucide-react";
import {
  SITE_CONFIG,
  SITE_COPYRIGHT,
  SITE_LINKS,
  SITE_NAME,
  ZALO_SUPPORT_URL,
} from "@/config/site";
import { LEGAL_INFO, LEGAL_POLICIES } from "@/lib/legal-config";

const RITUAL_LINKS = [
  { label: "Lễ Vu Quy", href: `${SITE_LINKS.templates}?ceremony=vu-quy` },
  { label: "Lễ Thành Hôn", href: `${SITE_LINKS.templates}?ceremony=thanh-hon` },
  { label: "Lễ Báo Hỷ", href: `${SITE_LINKS.templates}?ceremony=bao-hy` },
  { label: "Tất cả mẫu thiệp", href: SITE_LINKS.templates },
];

const TOOL_LINKS = [
  { label: "Bảng tính đám cưới", href: "/cong-cu/bang-tinh-dam-cuoi" },
  { label: "Đổi ngày âm lịch", href: "/cong-cu/doi-am-lich" },
  { label: "Tạo lời mời Zalo", href: "/cong-cu/tao-loi-moi-zalo" },
  { label: "Tất cả công cụ", href: SITE_LINKS.tools },
];

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-text-muted transition-colors hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
    >
      {children}
    </Link>
  );
}

export function LandingFooter() {
  const hasContact = Boolean(
    SITE_CONFIG.contactEmail ||
      SITE_CONFIG.contactPhone ||
      SITE_CONFIG.contactZalo ||
      SITE_CONFIG.contactFacebook,
  );

  return (
    <footer className="border-t border-border bg-bg py-10 text-text-muted">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Brand & Highlights */}
          <div>
            <Link href={SITE_LINKS.home} className="font-display text-2xl font-semibold text-accent-text">
              {SITE_NAME}
            </Link>
            <p className="mt-2 max-w-xs text-xs leading-relaxed">
              Thiệp cưới online cá nhân hóa tên từng khách — tạo trong vài phút, chia
              sẻ bằng một đường link, không cần in ấn.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px]">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-accent-text" aria-hidden="true" />
                Dữ liệu khách mời được bảo mật
              </li>
              <li className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-accent-text" aria-hidden="true" />
                Tải nhanh trên mọi điện thoại
              </li>
              <li className="flex items-center gap-1.5">
                <HeartHandshake className="h-3.5 w-3.5 shrink-0 text-accent-text" aria-hidden="true" />
                <a
                  href={ZALO_SUPPORT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-accent-text transition-colors hover:underline"
                >
                  <span>Nhắn Zalo hỗ trợ trực tiếp</span>
                  <span aria-hidden="true">→</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Ritual Templates */}
          <nav aria-label="Mẫu thiệp theo nghi lễ">
            <h2 className="text-[11px] font-semibold tracking-[0.16em] text-text uppercase">
              Mẫu thiệp theo nghi lễ
            </h2>
            <ul className="mt-3 space-y-2 text-xs">
              {RITUAL_LINKS.map((item) => (
                <li key={item.label}>
                  <FooterLink href={item.href}>{item.label}</FooterLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Column 3: Free Wedding Tools */}
          <nav aria-label="Công cụ cưới miễn phí">
            <h2 className="text-[11px] font-semibold tracking-[0.16em] text-text uppercase">
              Công cụ cưới miễn phí
            </h2>
            <ul className="mt-3 space-y-2 text-xs">
              {TOOL_LINKS.map((item) => (
                <li key={item.label}>
                  <FooterLink href={item.href}>{item.label}</FooterLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Column 4: Policies & Legal (MoIT Compliance) */}
          <nav aria-label="Chính sách & Pháp lý">
            <h2 className="text-[11px] font-semibold tracking-[0.16em] text-text uppercase">
              Chính sách &amp; Pháp lý
            </h2>
            <ul className="mt-3 space-y-2 text-xs">
              {LEGAL_POLICIES.map((policy) => (
                <li key={policy.slug}>
                  <FooterLink href={policy.href}>{policy.title}</FooterLink>
                </li>
              ))}
              <li className="pt-1" data-nosnippet>
                <a
                  href={`mailto:${LEGAL_INFO.email}`}
                  className="text-text-muted transition-colors hover:text-accent-text"
                >
                  Email: {LEGAL_INFO.email}
                </a>
              </li>
              <li data-nosnippet>
                <a
                  href={LEGAL_INFO.hotlineHref}
                  className="text-text-muted transition-colors hover:text-accent-text"
                >
                  Hotline: {LEGAL_INFO.hotline}
                </a>
              </li>
              {hasContact && (
                <>
                  {SITE_CONFIG.contactZalo && (
                    <li data-nosnippet>
                      <a
                        href={ZALO_SUPPORT_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-muted transition-colors hover:text-accent-text"
                      >
                        Zalo hỗ trợ: {SITE_CONFIG.contactZalo}
                      </a>
                    </li>
                  )}
                  {SITE_CONFIG.contactFacebook && (
                    <li data-nosnippet>
                      <a
                        href={SITE_CONFIG.contactFacebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-muted transition-colors hover:text-accent-text"
                      >
                        Facebook
                      </a>
                    </li>
                  )}
                </>
              )}
            </ul>
          </nav>
        </div>

        {/* Legal & MoIT Compliance Info Block */}
        <div
          data-nosnippet
          className="mt-8 rounded-2xl border border-border/80 bg-surface/50 p-4 sm:p-5 text-xs text-text-muted"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <p className="font-semibold text-text">
                {LEGAL_INFO.brandName} — {LEGAL_INFO.serviceType}
              </p>
              <p className="text-[11px] leading-relaxed">
                Chủ sở hữu: <span className="font-medium text-text">{LEGAL_INFO.ownerName}</span> · Địa chỉ: {LEGAL_INFO.address}
              </p>
              <p className="text-[11px] leading-relaxed">
                Hotline hỗ trợ:{" "}
                <a href={LEGAL_INFO.hotlineHref} className="font-medium text-text hover:text-accent-text hover:underline">
                  {LEGAL_INFO.hotline}
                </a>{" "}
                · Email tiếp nhận:{" "}
                <a href={`mailto:${LEGAL_INFO.email}`} className="font-medium text-text hover:text-accent-text hover:underline">
                  {LEGAL_INFO.email}
                </a>{" "}
                · Giờ phục vụ: {LEGAL_INFO.operatingHours}
              </p>
              {(Boolean(LEGAL_INFO.taxId) || Boolean(LEGAL_INFO.businessLicense)) && (
                <p className="text-[11px] text-text-muted">
                  {LEGAL_INFO.taxId ? `Mã số thuế: ${LEGAL_INFO.taxId}` : ""}
                  {LEGAL_INFO.taxId && LEGAL_INFO.businessLicense ? " · " : ""}
                  {LEGAL_INFO.businessLicense ? `Số ĐKKD: ${LEGAL_INFO.businessLicense}` : ""}
                </p>
              )}
            </div>

            {/* Official MoIT Badge (Conditionally rendered when moitBadgeUrl is configured) */}
            {LEGAL_INFO.moitBadgeUrl && (
              <div className="shrink-0 pt-2 lg:pt-0">
                <a
                  href={LEGAL_INFO.moitRegistrationUrl || "http://online.gov.vn"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block transition-opacity hover:opacity-80"
                  title="Đã thông báo Bộ Công Thương"
                >
                  <img
                    src={LEGAL_INFO.moitBadgeUrl}
                    alt="Đã thông báo Bộ Công Thương"
                    loading="lazy"
                    decoding="async"
                    className="h-10 w-auto object-contain"
                  />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Copyright divider bar */}
        <div className="mt-6 flex flex-col gap-2 border-t border-border pt-4 text-[11px] sm:flex-row sm:items-center sm:justify-between">
          <p>{SITE_COPYRIGHT}</p>
          {(SITE_CONFIG.companyName || SITE_CONFIG.taxCode) && (
            <p>
              {SITE_CONFIG.companyName}
              {SITE_CONFIG.taxCode ? ` · MST: ${SITE_CONFIG.taxCode}` : ""}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
