import { json, readBody } from "@/lib/server/http";
import { opsRoute, recordAuditLog } from "@/lib/server/ops";
import { coded } from "@/lib/server/owner";
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
    .select("id, code, plan, status, wedding_id")
    .eq("id", orderId)
    .maybeSingle();

  if (orderErr) throw orderErr;
  if (!order) {
    return coded("Không tìm thấy đơn hàng.", "NOT_FOUND", 404);
  }

  const nowIso = new Date().toISOString();

  // Update transaction
  const { error: matchErr } = await client
    .from("bank_transactions")
    .update({ matched_order_id: order.id })
    .eq("id", id);
  if (matchErr) throw matchErr;

  // Update order to paid
  const { error: orderUpdateErr } = await client
    .from("orders")
    .update({
      status: "paid",
      paid_at: nowIso,
    })
    .eq("id", order.id);
  if (orderUpdateErr) throw orderUpdateErr;

  // Upgrade wedding plan
  await client
    .from("weddings")
    .update({
      plan: order.plan,
      updated_at: nowIso,
    })
    .eq("id", order.wedding_id);

  await recordAuditLog({
    adminEmail: admin.email || "admin",
    action: "MATCH_TRANSACTION",
    targetType: "transaction",
    targetId: id,
    reason: `Gán giao dịch ${tx.ref} vào đơn ${order.code}: ${reason}`,
  });

  return json({ ok: true });
});

