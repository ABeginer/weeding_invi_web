import { PLAN_LIMITS } from "@/config/plans";
import { SELECTABLE_DASHBOARD_TEMPLATES } from "@/templates/registry";

export const WEDDING_SLUG_RE = /^[a-z0-9-]{3,40}$/;

export const FORBIDDEN_WEDDING_SLUGS = new Set([
  "admin",
  "api",
  "dashboard",
  "auth",
  "login",
  "logout",
  "w",
  "m",
  "media",
  "static",
  "_next",
]);

export const WEDDING_TEMPLATES = SELECTABLE_DASHBOARD_TEMPLATES.map((tpl) => ({
  id: tpl.id,
  name: tpl.plan === "free" ? `${tpl.name} (Miễn phí)` : `${tpl.name} (${tpl.plan.toUpperCase()})`,
  description: tpl.description,
  plan: tpl.plan,
}));

export const FREE_PLAN_MAX_WEDDINGS = PLAN_LIMITS.free.weddings ?? 1;
export const FREE_PLAN_MAX_GUESTS = PLAN_LIMITS.free.guests ?? 20;

export function validateWeddingSlug(raw: unknown): {
  valid: boolean;
  slug: string;
  error?: string;
} {
  if (typeof raw !== "string") {
    return { valid: false, slug: "", error: "Vui lòng nhập đường dẫn thiệp." };
  }
  const slug = raw.trim();
  if (!WEDDING_SLUG_RE.test(slug)) {
    return {
      valid: false,
      slug,
      error:
        "Đường dẫn chỉ gồm chữ thường (a-z), số (0-9) và dấu gạch ngang (-), từ 3 đến 40 ký tự.",
    };
  }
  if (FORBIDDEN_WEDDING_SLUGS.has(slug)) {
    return {
      valid: false,
      slug,
      error: "Đường dẫn này được hệ thống dành riêng, vui lòng chọn tên khác.",
    };
  }
  return { valid: true, slug };
}

