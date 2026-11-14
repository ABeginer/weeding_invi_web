import { getUser, type AuthUser } from "./auth";
import { coded } from "./owner";
import { db } from "./supabase";

export function getAdminEmails(): string[] {
  const envEmail = process.env.ADMIN_EMAIL || process.env.ADMIN_EMAILS || "";
  return envEmail
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function getOpsAdminUser(req: Request): Promise<AuthUser | null> {
  const user = await getUser(req);
  if (!user || !user.email) return null;

  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[ops] ADMIN_EMAIL chưa được cấu hình. Truy cập quản trị bị từ chối.");
    }
    return null;
  }

  if (!adminEmails.includes(user.email.toLowerCase())) {
    return null;
  }

  return user;
}

export function opsRoute<C = { params: Promise<Record<string, string>> }>(
  handler: (req: Request, admin: AuthUser, context: C) => Promise<Response>,
) {
  return async (req: Request, context: C): Promise<Response> => {
    try {
      const admin = await getOpsAdminUser(req);
      if (!admin) {
        return coded("Bạn không có quyền truy cập quản trị.", "FORBIDDEN", 403);
      }
      return await handler(req, admin, context);
    } catch (error) {
      console.error("[Ops Route Error]", error);
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

