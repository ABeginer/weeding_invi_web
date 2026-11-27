import {
  deleteOpsMember,
  listOpsMembers,
  MissingOpsMembersError,
  MISSING_OPS_MEMBERS_MESSAGE,
  upsertOpsMember,
} from "@/lib/server/ops-members";
import { fail, json, readBody } from "@/lib/server/http";
import { getAdminEmails, opsRoute, recordAuditLog } from "@/lib/server/ops";
import {
  isOpsRole,
  isValidOpsEmail,
  normalizeOpsEmail,
  type OpsRole,
} from "@/lib/ops-roles";

/** Danh sách role ops (admin only). */
export const GET = opsRoute(async () => {
  const list = await listOpsMembers();
  const envAdmins = getAdminEmails();
  return json({
    items: list.items.map((item) => ({
      ...item,
      isEnvAdmin: envAdmins.includes(item.email),
    })),
    needsMigration: list.needsMigration,
    envAdminCount: envAdmins.length,
  });
});

/** Cấp / đổi role cho một email. */
export const POST = opsRoute(async (req, admin) => {
  const body = await readBody(req);
  const email = normalizeOpsEmail(
    typeof body?.email === "string" ? body.email : "",
  );
  const role = body?.role;

  if (!isValidOpsEmail(email)) {
    return fail("Email không hợp lệ.");
  }
  if (!isOpsRole(role)) {
    return fail("Role phải là admin hoặc designer.");
  }
  if (getAdminEmails().includes(email) && role !== "admin") {
    return fail("Email này nằm trong ADMIN_EMAIL nên luôn có quyền admin.");
  }
  if (normalizeOpsEmail(admin.email) === email && role !== "admin") {
    return fail("Không thể tự hạ quyền admin của chính mình.");
  }

  try {
    await upsertOpsMember({
      email,
      role: role as OpsRole,
      actorEmail: admin.email ?? "ops",
    });
  } catch (error) {
    if (error instanceof MissingOpsMembersError) {
      return fail(MISSING_OPS_MEMBERS_MESSAGE, 503);
    }
    throw error;
  }

  await recordAuditLog({
    adminEmail: admin.email ?? "ops",
    action: "ops_role.grant",
    targetType: "ops_member",
    targetId: email,
    reason: `Cấp quyền ${role} cho ${email}`,
  });

  return json({ ok: true, email, role });
});

/** Thu hồi role (admin only). */
export const DELETE = opsRoute(async (req, admin) => {
  const email = normalizeOpsEmail(
    new URL(req.url).searchParams.get("email") ?? "",
  );

  if (!isValidOpsEmail(email)) {
    return fail("Email không hợp lệ.");
  }
  if (getAdminEmails().includes(email)) {
    return fail("Email này nằm trong ADMIN_EMAIL nên không thể thu hồi quyền.");
  }
  if (normalizeOpsEmail(admin.email) === email) {
    return fail("Không thể tự thu hồi quyền admin của chính mình.");
  }

  try {
    await deleteOpsMember(email);
  } catch (error) {
    if (error instanceof MissingOpsMembersError) {
      return fail(MISSING_OPS_MEMBERS_MESSAGE, 503);
    }
    throw error;
  }

  await recordAuditLog({
    adminEmail: admin.email ?? "ops",
    action: "ops_role.revoke",
    targetType: "ops_member",
    targetId: email,
    reason: `Thu hồi quyền ops của ${email}`,
  });

  return json({ ok: true, email });
});
