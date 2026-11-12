export function resolveAppBaseUrl(): string {
  const fromEnv =
    process.env.APP_BASE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, "");
  }
  return "http://localhost:3000";
}

export function toAbsoluteSiteUrl(pathOrUrl: string): string {
  const trimmed = pathOrUrl.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const base = resolveAppBaseUrl();
  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${normalizedPath}`;
}

// TODO: Chủ dự án xác nhận email liên hệ chính thức trước khi phát hành.
export const SITE_NAME =
  process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "Inviwedd";
export const SITE_URL = resolveAppBaseUrl();
export const SITE_EMAIL = "lienhe@inviwedd.example";
export const SITE_COPYRIGHT = `© ${new Date().getFullYear()} ${SITE_NAME}. Bảo lưu mọi quyền.`;

export const SITE_LINKS = {
  home: "/",
  createWedding: "/tao-thiep",
  createWeddingSave: "/tao-thiep/luu",
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
