export const AUTH0_EMAIL_CLAIM = "https://thiepcuoi/email";

export function resolveAppBaseUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_BASE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, "");
  }
  if (process.env.NODE_ENV === "production") {
    return "https://inviwedd.date";
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
  contactEmail: "support@inviwedd.date",
  contactPhone: "0902 955 594",
  contactZalo: "0902955594",
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

export function resolveZaloSupportUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_ZALO_SUPPORT_URL?.trim();
  if (fromEnv) return fromEnv;
  if (SITE_CONFIG.contactZalo?.trim()) {
    const raw = SITE_CONFIG.contactZalo.trim();
    return raw.startsWith("http") ? raw : `https://zalo.me/${raw.replace(/\D/g, "")}`;
  }
  return "https://zalo.me/0902955594";
}

export const ZALO_SUPPORT_URL = resolveZaloSupportUrl();

export function resolveSupportEmail(): string {
  return (
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ||
    SITE_CONFIG.contactEmail ||
    "support@inviwedd.date"
  );
}

export const SUPPORT_EMAIL = resolveSupportEmail();

export const SITE_LINKS = {
  home: "/",
  templates: "/thiep-cuoi",
  blog: "/blog",
  tools: "/cong-cu",
  toolWeddingCalc: "/cong-cu/bang-tinh-dam-cuoi",
  toolLunar: "/cong-cu/doi-am-lich",
  toolZaloInvite: "/cong-cu/tao-loi-moi-zalo",
  toolGuestList: "/cong-cu/tao-danh-sach-khach-moi",
  toolWeddingQuiz: "/cong-cu/quiz-dam-cuoi-co-dau-chu-re",
  createWedding: "/tao-thiep",
  createWeddingSave: "/tao-thiep/luu",
  templatesAnchor: "/#mau-thiep",
  pricingAnchor: "/#bang-gia",
  howItWorksAnchor: "/#cach-hoat-dong",
  login: "/auth/login?returnTo=/dashboard",
  logout: "/auth/logout",
  dashboard: "/dashboard",
  dashboardNew: "/dashboard/new",
  privacy: "/chinh-sach/bao-mat",
  terms: "/chinh-sach/dieu-khoan-su-dung",
  policyPayment: "/chinh-sach/thanh-toan",
  policyService: "/chinh-sach/cung-cap-dich-vu",
  policyRefund: "/chinh-sach/doi-tra-hoan-tien",
} as const;
