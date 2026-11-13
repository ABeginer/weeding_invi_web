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
  if (!body) return coded("Dữ liệu không hợp lệ.", "VALIDATION", 400);

  const plan = body.plan;
  if (plan !== "free" && plan !== "pro" && plan !== "vip") {
    return coded("Gói dịch vụ không hợp lệ.", "VALIDATION", 400);
  }

  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (reason.length < 5 || reason.length > 300) {
    return coded("Lý do phải có ít nhất 5 ký tự và tối đa 300 ký tự.", "VALIDATION", 400);
  }

  const client = db();

  const { data: wedding, error: fetchErr } = await client
    .from("weddings")
    .select("id, plan, slug")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (!wedding) {
    return coded("Không tìm thấy thiệp cưới.", "NOT_FOUND", 404);
  }

  const oldPlan = wedding.plan;

  const { error: updateErr } = await client
    .from("weddings")
    .update({ plan, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateErr) throw updateErr;

  await recordAuditLog({
    adminEmail: admin.email || "admin",
    action: "UPDATE_WEDDING_PLAN",
    targetType: "wedding",
    targetId: id,
    reason: `Đổi gói từ ${oldPlan.toUpperCase()} sang ${plan.toUpperCase()}: ${reason}`,
  });

  return json({ ok: true, plan });
});

