import { json, readBody } from "@/lib/server/http";
import { opsRoute, recordAuditLog } from "@/lib/server/ops";
import { coded } from "@/lib/server/owner";
import { db } from "@/lib/server/supabase";
import { isUuid } from "@/lib/server/validate";

export const POST = opsRoute(async (req, admin, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  if (!isUuid(id)) {
    return coded("Không tìm thấy thiệp cưới.", "NOT_FOUND", 404);
  }

  const body = await readBody(req);
  if (!body || typeof body.suspended !== "boolean") {
    return coded("Dữ liệu không hợp lệ.", "VALIDATION", 400);
  }

  const suspended = body.suspended;
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (reason.length < 5 || reason.length > 300) {
    return coded("Lý do phải có ít nhất 5 ký tự và tối đa 300 ký tự.", "VALIDATION", 400);
  }

  const client = db();

  const { data: wedding, error: fetchErr } = await client
    .from("weddings")
    .select("id, slug, content")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (!wedding) {
    return coded("Không tìm thấy thiệp cưới.", "NOT_FOUND", 404);
  }

  const updatedContent = {
    ...((wedding.content || {}) as Record<string, unknown>),
    suspended,
  };

  // Try updating with suspended column first; fallback to content JSON if column does not exist yet
  const { error: updateErr } = await client
    .from("weddings")
    .update({
      suspended,
      content: updatedContent,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateErr) {
    // Fallback updating content only
    const { error: fallbackErr } = await client
      .from("weddings")
      .update({
        content: updatedContent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (fallbackErr) throw fallbackErr;
  }

  await recordAuditLog({
    adminEmail: admin.email || "admin",
    action: suspended ? "SUSPEND_WEDDING" : "UNSUSPEND_WEDDING",
    targetType: "wedding",
    targetId: id,
    reason: `${suspended ? "Khóa thiệp" : "Mở khóa thiệp"}: ${reason}`,
  });

  return json({ ok: true, suspended });
});

