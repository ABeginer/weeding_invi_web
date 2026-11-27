import { json, readBody } from "@/lib/server/http";
import { opsRoute, recordAuditLog } from "@/lib/server/ops";
import { coded } from "@/lib/server/owner";
import { PLAN_RANK } from "@/lib/server/payments";
import { db } from "@/lib/server/supabase";
import { isUuid } from "@/lib/server/validate";

export const POST = opsRoute(async (req, admin, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  if (!isUuid(id)) {
    return coded("Không tìm thấy đơn hàng.", "NOT_FOUND", 404);
  }

  const body = await readBody(req);
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  if (reason.length < 5 || reason.length > 300) {
    return coded("Lý do phải có ít nhất 5 ký tự và tối đa 300 ký tự.", "VALIDATION", 400);
  }

  const client = db();

  const { data: order, error: fetchErr } = await client
    .from("orders")
    .select("id, code, plan, amount_vnd, status, wedding_id, user_id, created_at, paid_at")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (!order) {
    return coded("Không tìm thấy đơn hàng.", "NOT_FOUND", 404);
  }

  if (order.status !== "pending") {
    return coded("Đơn này đã được xử lý.", "VALIDATION", 400);
  }

  const nowIso = new Date().toISOString();

  // Khóa đơn hàng nguyên tử TRƯỚC khi nâng gói
  const { data: updatedOrder, error: updateErr } = await client
    .from("orders")
    .update({
      status: "paid",
      paid_at: nowIso,
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("id, code, plan, amount_vnd, status, wedding_id, user_id, created_at, paid_at")
    .maybeSingle();

  if (updateErr) throw updateErr;
  if (!updatedOrder) {
    return coded("Đơn này đã được xử lý trước đó.", "VALIDATION", 409);
  }

  // Chỉ nâng gói khi bậc gói mới cao hơn gói hiện tại (chống hạ gói)
  const { data: currentWedding } = await client
    .from("weddings")
    .select("plan")
    .eq("id", order.wedding_id)
    .maybeSingle();
  const currentPlan = (currentWedding?.plan as "free" | "pro" | "vip" | undefined) ?? "free";
  const targetPlan = order.plan as "pro" | "vip";
  if ((PLAN_RANK[targetPlan] ?? 0) > (PLAN_RANK[currentPlan] ?? 0)) {
    await client
      .from("weddings")
      .update({
        plan: targetPlan,
        updated_at: nowIso,
      })
      .eq("id", order.wedding_id);
  }

  await recordAuditLog({
    adminEmail: admin.email || "admin",
    action: "CONFIRM_ORDER",
    targetType: "order",
    targetId: id,
    reason: `Xác nhận nhận tiền đơn ${order.code}: ${reason}`,
  });

  return json({
    ok: true,
    order: {
      id: updatedOrder.id,
      code: updatedOrder.code,
      plan: updatedOrder.plan,
      amountVnd: Number(updatedOrder.amount_vnd),
      status: updatedOrder.status,
      weddingId: updatedOrder.wedding_id,
      createdAt: updatedOrder.created_at,
      paidAt: updatedOrder.paid_at,
    },
  });
});

