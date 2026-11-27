import { json, readBody } from "@/lib/server/http";
import { opsRoute, recordAuditLog } from "@/lib/server/ops";
import { coded } from "@/lib/server/owner";
import { PLAN_RANK } from "@/lib/server/payments";
import { db } from "@/lib/server/supabase";
import { isUuid } from "@/lib/server/validate";

export const POST = opsRoute(async (req, admin, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  if (!isUuid(id)) {
    return coded("Không tìm thấy giao dịch.", "NOT_FOUND", 404);
  }

  const body = await readBody(req);
  if (!body || !isUuid(body.orderId)) {
    return coded("Đơn hàng không hợp lệ.", "VALIDATION", 400);
  }

  const orderId = body.orderId as string;
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (reason.length < 5 || reason.length > 300) {
    return coded("Lý do phải có ít nhất 5 ký tự và tối đa 300 ký tự.", "VALIDATION", 400);
  }

  const client = db();

  // Find transaction
  const { data: tx, error: txErr } = await client
    .from("bank_transactions")
    .select("id, ref, amount_vnd, matched_order_id")
    .eq("id", id)
    .maybeSingle();

  if (txErr) throw txErr;
  if (!tx) {
    return coded("Không tìm thấy giao dịch.", "NOT_FOUND", 404);
  }
  if (tx.matched_order_id) {
    return coded("Giao dịch này đã được gán trước đó.", "VALIDATION", 400);
  }

  // Find order
  const { data: order, error: orderErr } = await client
    .from("orders")
    .select("id, code, plan, amount_vnd, status, wedding_id")
    .eq("id", orderId)
    .maybeSingle();

  if (orderErr) throw orderErr;
  if (!order) {
    return coded("Không tìm thấy đơn hàng.", "NOT_FOUND", 404);
  }
  if (order.status !== "pending") {
    return coded("Chỉ có thể khớp vào đơn hàng đang chờ thanh toán (pending).", "VALIDATION", 400);
  }
  if (Number(tx.amount_vnd) < Number(order.amount_vnd)) {
    return coded(
      `Số tiền giao dịch (${Number(tx.amount_vnd).toLocaleString("vi-VN")}đ) nhỏ hơn giá trị đơn hàng (${Number(order.amount_vnd).toLocaleString("vi-VN")}đ).`,
      "VALIDATION",
      400,
    );
  }

  const nowIso = new Date().toISOString();

  // Khóa đơn hàng nguyên tử TRƯỚC khi nâng gói
  const { data: claimedOrder, error: orderUpdateErr } = await client
    .from("orders")
    .update({
      status: "paid",
      paid_at: nowIso,
    })
    .eq("id", order.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (orderUpdateErr) throw orderUpdateErr;
  if (!claimedOrder) {
    return coded("Đơn hàng đã được xử lý trước đó.", "VALIDATION", 409);
  }

  // Khóa giao dịch ngân hàng nguyên tử
  const { error: matchErr } = await client
    .from("bank_transactions")
    .update({ matched_order_id: order.id })
    .eq("id", id)
    .is("matched_order_id", null);
  if (matchErr) throw matchErr;

  // Chỉ nâng gói khi bậc gói mới cao hơn gói hiện tại (chống hạ gói từ vip xuống pro)
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
    action: "MATCH_TRANSACTION",
    targetType: "transaction",
    targetId: id,
    reason: `Gán giao dịch ${tx.ref} vào đơn ${order.code}: ${reason}`,
  });

  return json({ ok: true });
});

