import { json, readBody } from "@/lib/server/http";
import { opsRoute, recordAuditLog } from "@/lib/server/ops";
import { coded } from "@/lib/server/owner";
import { purgeExpiredFreeWeddings } from "@/lib/server/retention";
import { deletePhotoObject } from "@/lib/server/storage";

/**
 * Chạy job xoá dữ liệu hết hạn (gói free quá 30 ngày).
 * `dryRun: true` chỉ liệt kê ứng viên, không xoá gì.
 */
export const POST = opsRoute(async (req, admin) => {
  const body = await readBody(req);
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  if (reason.length < 5 || reason.length > 300) {
    return coded(
      "Lý do phải có ít nhất 5 ký tự và tối đa 300 ký tự.",
      "VALIDATION",
      400,
    );
  }

  const dryRun = body?.dryRun === true;
  const result = await purgeExpiredFreeWeddings({
    dryRun,
    deleteObject: dryRun ? undefined : deletePhotoObject,
  });

  await recordAuditLog({
    adminEmail: admin.email || "admin",
    action: dryRun ? "RETENTION_DRY_RUN" : "RETENTION_PURGE",
    targetType: "wedding",
    targetId: "batch",
    reason: `${dryRun ? "Kiểm tra" : "Xoá"} dữ liệu hết hạn (${result.candidates.length} thiệp, cutoff ${result.cutoff}): ${reason}`,
  });

  return json(result);
});
