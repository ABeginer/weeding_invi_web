import { json, readBody } from "@/lib/server/http";
import { opsRoute, recordAuditLog } from "@/lib/server/ops";
import { coded } from "@/lib/server/owner";
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

  const { data: updatedOrder, error: updateErr } = await client
    .from("orders")
    .update({
      status: "cancelled",
    })
    .eq("id", id)
    .select("id, code, plan, amount_vnd, status, wedding_id, user_id, created_at, paid_at")
    .single();

  if (updateErr) throw updateErr;

  await recordAuditLog({
    adminEmail: admin.email || "admin",
    action: "CANCEL_ORDER",
    targetType: "order",
    targetId: id,
    reason: `Hủy đơn hàng ${order.code}: ${reason}`,
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

