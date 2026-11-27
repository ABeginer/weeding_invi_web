/**
 * Vai trò nội bộ của ops. `admin` thấy toàn bộ; `designer` chỉ thấy
 * "Template" (mẫu đã publish) và "Thiết kế mẫu" (canvas).
 */
export const OPS_ROLES = ["admin", "designer"] as const;

export type OpsRole = (typeof OPS_ROLES)[number];

export const OPS_ROLE_LABELS: Record<OpsRole, string> = {
  admin: "Quản trị viên",
  designer: "Designer",
};

/** Các path designer được phép mở; mọi path /ops khác đều admin-only. */
const DESIGNER_ALLOWED_PREFIXES = ["/ops/templates", "/ops/designer"];

export function isOpsRole(value: unknown): value is OpsRole {
  return typeof value === "string" && (OPS_ROLES as readonly string[]).includes(value);
}

/** Email role được lưu lowercase để so khớp ổn định với Auth0. */
export function normalizeOpsEmail(email: string | null | undefined): string {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidOpsEmail(email: string | null | undefined): boolean {
  const normalized = normalizeOpsEmail(email);
  return (
    normalized.length >= 3 &&
    normalized.length <= 254 &&
    EMAIL_RE.test(normalized)
  );
}

export function isOpsPathAllowed(role: OpsRole, pathname: string): boolean {
  if (role === "admin") return true;
  return DESIGNER_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Trang mặc định sau khi đăng nhập / khi bị chặn path. */
export function getOpsHomePath(role: OpsRole): string {
  return role === "designer" ? "/ops/templates" : "/ops";
}

export function getOpsRoleLabel(role: OpsRole | null | undefined): string {
  return role ? OPS_ROLE_LABELS[role] : "Khách";
}
