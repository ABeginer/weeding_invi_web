function resolveSiteUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.APP_BASE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, "");
  }
  return "http://localhost:3000";
}

// TODO: Chủ thiệp xác nhận lại SITE_NAME và email liên hệ chính thức trước khi phát hành.
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "Kim Hỷ";
export const SITE_URL = resolveSiteUrl();
export const SITE_EMAIL = "lienhe@kimhy.example";
export const SITE_COPYRIGHT = `© ${new Date().getFullYear()} ${SITE_NAME}. Bảo lưu mọi quyền.`;

export const SITE_LINKS = {
  home: "/",
  templatesAnchor: "/#mau-thiep",
  pricingAnchor: "/#bang-gia",
  howItWorksAnchor: "/#cach-hoat-dong",
  login: "/auth/login?returnTo=/dashboard",
  logout: "/auth/logout",
  dashboard: "/dashboard",
  dashboardNew: "/dashboard/new",
  privacy: "/chinh-sach-bao-mat",
  terms: "/dieu-khoan-su-dung",
} as const;

