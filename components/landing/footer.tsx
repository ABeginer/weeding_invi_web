import * as React from "react";
import Link from "next/link";
import { HeartHandshake, ShieldCheck, Zap } from "lucide-react";
import { SITE_CONFIG, SITE_COPYRIGHT, SITE_LINKS, SITE_NAME } from "@/config/site";

const RITUAL_LINKS = [
  { label: "Lễ Vu Quy", href: SITE_LINKS.templates },
  { label: "Lễ Thành Hôn", href: SITE_LINKS.templates },
  { label: "Lễ Báo Hỷ", href: SITE_LINKS.templates },
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
                <HeartHandshake className="h-3.5 w-3.5 text-accent-text" aria-hidden="true" />
                Hỗ trợ Zalo trong suốt ngày cưới
              </li>
            </ul>
          </div>

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

          <nav aria-label="Chính sách và hỗ trợ">
            <h2 className="text-[11px] font-semibold tracking-[0.16em] text-text uppercase">
              Chính sách &amp; hỗ trợ
            </h2>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <FooterLink href={SITE_LINKS.privacy}>Chính sách bảo mật</FooterLink>
              </li>
              <li>
                <FooterLink href={SITE_LINKS.terms}>Điều khoản sử dụng</FooterLink>
              </li>
              {hasContact && (
                <>
                  {SITE_CONFIG.contactEmail && (
                    <li>
                      <a
                        href={`mailto:${SITE_CONFIG.contactEmail}`}
                        className="text-text-muted transition-colors hover:text-accent-text"
                      >
                        {SITE_CONFIG.contactEmail}
                      </a>
                    </li>
                  )}
                  {SITE_CONFIG.contactPhone && (
                    <li>
                      <a
                        href={`tel:${SITE_CONFIG.contactPhone}`}
                        className="text-text-muted transition-colors hover:text-accent-text"
                      >
                        Hotline: {SITE_CONFIG.contactPhone}
                      </a>
                    </li>
                  )}
                  {SITE_CONFIG.contactZalo && (
                    <li>
                      <a
                        href={
                          SITE_CONFIG.contactZalo.startsWith("http")
                            ? SITE_CONFIG.contactZalo
                            : `https://zalo.me/${SITE_CONFIG.contactZalo}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-muted transition-colors hover:text-accent-text"
                      >
                        Zalo hỗ trợ: {SITE_CONFIG.contactZalo}
                      </a>
                    </li>
                  )}
                  {SITE_CONFIG.contactFacebook && (
                    <li>
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

        <div className="mt-8 flex flex-col gap-2 border-t border-border pt-5 text-[11px] sm:flex-row sm:items-center sm:justify-between">
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
