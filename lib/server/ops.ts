import { getUser, type AuthUser } from "./auth";
import { coded } from "./owner";
import { db } from "./supabase";
import { isOpsRole, normalizeOpsEmail, type OpsRole } from "../ops-roles";

export function getAdminEmails(): string[] {
  const envEmail = process.env.ADMIN_EMAIL || process.env.ADMIN_EMAILS || "";
  return envEmail
    .split(",")
    .map((e) => normalizeOpsEmail(e))
    .filter(Boolean);
}

/** Bảng ops_members được thêm ở migration_v16; code vẫn chạy nếu chưa có. */
export function isMissingOpsMembersTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: unknown; message?: unknown };
  const code = typeof err.code === "string" ? err.code : "";
  const message = typeof err.message === "string" ? err.message : "";
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    (/ops_members/i.test(message) &&
      /does not exist|schema cache|not found/i.test(message))
  );
}

/** Role lưu trong DB; null nếu email chưa được cấp hoặc bảng chưa có. */
export async function getStoredOpsRole(
  email: string | null | undefined,
): Promise<OpsRole | null> {
  const normalized = normalizeOpsEmail(email);
  if (!normalized) return null;

  const { data, error } = await db()
    .from("ops_members")
    .select("role")
    .eq("email", normalized)
    .maybeSingle();

  if (error) {
    if (isMissingOpsMembersTable(error)) return null;
    throw error;
  }

  return isOpsRole(data?.role) ? data.role : null;
}

/** ADMIN_EMAIL/ADMIN_EMAILS là super-admin; role DB chỉ bổ sung, không hạ được env admin. */
export async function resolveOpsRole(
  email: string | null | undefined,
): Promise<OpsRole | null> {
  const normalized = normalizeOpsEmail(email);
  if (!normalized) return null;
  if (getAdminEmails().includes(normalized)) return "admin";
  return getStoredOpsRole(normalized);
}

export interface OpsMember {
  user: AuthUser;
  role: OpsRole;
}

async function getOpsMember(req: Request): Promise<OpsMember | null> {
  const user = await getUser(req);
  if (!user || !user.email) return null;
  const role = await resolveOpsRole(user.email);
  if (!role) return null;
  return { user, role };
}

function opsErrorResponse(): Response {
  return coded("Bạn không có quyền truy cập quản trị.", "FORBIDDEN", 403);
}

/** Route chỉ dành cho admin (mặc định của mọi màn ops cũ). */
export function opsRoute<C = { params: Promise<Record<string, string>> }>(
  handler: (req: Request, admin: AuthUser, context: C) => Promise<Response>,
) {
  return async (req: Request, context: C): Promise<Response> => {
    try {
      const member = await getOpsMember(req);
      if (!member || member.role !== "admin") return opsErrorResponse();
      return await handler(req, member.user, context);
    } catch (error) {
      console.error("[Ops Route Error]", error);
      return coded("Có lỗi xảy ra ở máy chủ.", "VALIDATION", 500);
    }
  };
}

/** Route dùng chung cho admin và designer (Template / Thiết kế mẫu). */
export function opsDesignerRoute<C = { params: Promise<Record<string, string>> }>(
  handler: (req: Request, user: AuthUser, context: C) => Promise<Response>,
) {
  return async (req: Request, context: C): Promise<Response> => {
    try {
      const member = await getOpsMember(req);
      if (!member) return opsErrorResponse();
      return await handler(req, member.user, context);
    } catch (error) {
      console.error("[Ops Designer Route Error]", error);
      return coded("Có lỗi xảy ra ở máy chủ.", "VALIDATION", 500);
    }
  };
}

export async function recordAuditLog(log: {
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
}) {
  try {
    await db()
      .from("audit_logs")
      .insert({
        admin_email: log.adminEmail,
        action: log.action,
        target_type: log.targetType,
        target_id: log.targetId,
        reason: log.reason,
      });
  } catch (err) {
    console.error("[Record Audit Log Error]", err);
  }
}
