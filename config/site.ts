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

export interface SiteConfig {
  contactEmail: string;
  contactPhone: string;
  contactZalo: string;
  contactFacebook: string;
  companyName: string;
  companyAddress: string;
  taxCode: string;
  legalNoticeVisible: boolean;
  showDashboardPreview: boolean;
}

export const SITE_CONFIG: SiteConfig = {
  contactEmail: "",
  contactPhone: "",
  contactZalo: "",
  contactFacebook: "",
  companyName: "",
  companyAddress: "",
  taxCode: "",
  legalNoticeVisible: false,
  showDashboardPreview: true,
};

export const SITE_NAME =
  process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "Inviwedd";
export const SITE_URL = resolveAppBaseUrl();
export const SITE_EMAIL = SITE_CONFIG.contactEmail;
export const SITE_COPYRIGHT = `© ${new Date().getFullYear()} ${SITE_NAME}. Bảo lưu mọi quyền.`;

export const SITE_LINKS = {
  home: "/",
  tools: "/cong-cu",
  toolWeddingCalc: "/cong-cu/bang-tinh-dam-cuoi",
  toolLunar: "/cong-cu/doi-am-lich",
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
