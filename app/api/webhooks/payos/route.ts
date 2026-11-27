import { readBody, route, json, fail } from "@/lib/server/http";
import { db } from "@/lib/server/supabase";
import {
  verifyPayosWebhook,
  type PayosWebhookPayload,
} from "@/lib/server/payos";
import { findOrderCode, PLAN_RANK } from "@/lib/server/payments";

export const POST = route(async (req: Request) => {
  const body = (await readBody(req)) as unknown as PayosWebhookPayload;
  if (!body) return fail("Missing request body", 400);

  const { isValid, data } = await verifyPayosWebhook(body);
  if (!isValid) {
    return fail("Invalid signature", 400);
  }

  // payOS gửi webhook kiểm tra (ping test khi thiết lập webhook trong dashboard)
  // hoặc các mã trạng thái không phải giao dịch thành công ("00") — chỉ tin data.code đã ký HMAC
  if (!data || data.code !== "00") {
    return json({ success: true, message: "Webhook ping received" });
  }

  const client = db();

  type OrderRecord = {
    id: string;
    wedding_id: string;
    plan: "pro" | "vip";
    amount_vnd: number;
    status: string;
  };

  let order: OrderRecord | null = null;

  // 1. Tìm đơn bằng payos_order_code (nếu cột đã tồn tại trên DB và data.orderCode hợp lệ)
  if (data.orderCode) {
    const { data: orderPayos, error: payosErr } = await client
      .from("orders")
      .select("id, wedding_id, plan, amount_vnd, status")
      .eq("payos_order_code", data.orderCode)
      .maybeSingle();

    if (!payosErr && orderPayos) {
      order = orderPayos as OrderRecord;
    }
  }

  // 2. Nếu chưa tìm thấy, tìm bằng mã code trích xuất từ description (INV-XXXXXX)
  if (!order && data.description) {
    const parsedCode = findOrderCode(data.description);
    if (parsedCode) {
      const { data: orderByCode, error: codeErr } = await client
        .from("orders")
        .select("id, wedding_id, plan, amount_vnd, status")
        .eq("code", parsedCode)
        .maybeSingle();

      if (!codeErr && orderByCode) {
        order = orderByCode as OrderRecord;
      }
    }
  }

  // 3. Fallback cho các đơn cũ nếu từng lưu orderCode thẳng vào code
  if (!order && data.orderCode) {
    const { data: orderLegacy, error: legacyErr } = await client
      .from("orders")
      .select("id, wedding_id, plan, amount_vnd, status")
      .eq("code", String(data.orderCode))
      .maybeSingle();

    if (!legacyErr && orderLegacy) {
      order = orderLegacy as OrderRecord;
    }
  }

  // Nếu không tìm thấy đơn (ví dụ đơn test ping của payOS hoặc orderCode mẫu)
  if (!order) {
    return json({
      success: true,
      message: "Order not found or test webhook ping acknowledged",
    });
  }

  // Idempotency: nếu đơn đã được đánh dấu là paid trước đó
  if (order.status === "paid") {
    return json({ success: true, duplicate: true });
  }

  // Tuyệt đối không kích hoạt lại đơn hàng đã hủy hoặc không ở trạng thái pending
  if (order.status !== "pending") {
    return json({ success: true, ignored: true, reason: "Order is not pending" });
  }

  // Kiểm tra số tiền thực nhận có đủ theo số tiền đơn hàng
  if (data.amount < (order.amount_vnd as number)) {
    return fail("Insufficient payment amount", 400);
  }

  // 1. Khóa/claim đơn hàng nguyên tử TRƯỚC khi nâng gói (chống race condition & kích hoạt lại đơn đã hủy)
  const now = new Date().toISOString();
  const updatePayload: Record<string, unknown> = {
    status: "paid",
    paid_at: now,
  };
  if (data.orderCode) {
    updatePayload.payos_order_code = data.orderCode;
  }

  let { data: claimedOrder, error: markError } = await client
    .from("orders")
    .update(updatePayload)
    .eq("id", order.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  // Nếu DB chưa có cột payos_order_code, cập nhật không kèm payos_order_code
  if (markError && (markError.code === "42703" || markError.message?.includes("payos_order_code"))) {
    delete updatePayload.payos_order_code;
    const retryUpdate = await client
      .from("orders")
      .update(updatePayload)
      .eq("id", order.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    claimedOrder = retryUpdate.data;
    markError = retryUpdate.error;
  }

  if (markError) throw markError;
  if (!claimedOrder) {
    return json({ success: true, duplicate: true });
  }

  // 2. Nâng cấp gói dịch vụ cho thiệp cưới (chống hạ gói khi webhook đơn cũ đến trễ)
  const { data: currentWedding, error: weddingReadError } = await client
    .from("weddings")
    .select("plan")
    .eq("id", order.wedding_id)
    .maybeSingle();

  if (weddingReadError) throw weddingReadError;

  const currentPlan = (currentWedding?.plan as "free" | "pro" | "vip" | undefined) ?? "free";
  if ((PLAN_RANK[order.plan] ?? 0) > (PLAN_RANK[currentPlan] ?? 0)) {
    const { error: weddingError } = await client
      .from("weddings")
      .update({ plan: order.plan })
      .eq("id", order.wedding_id);

    if (weddingError) throw weddingError;
  }

  // 3. Ghi nhận lịch sử giao dịch vào bank_transactions để đối soát tài chính
  const ref = `payos_${data.reference || data.paymentLinkId || data.orderCode}`;
  const receivedAt =
    data.transactionDateTime && !Number.isNaN(Date.parse(data.transactionDateTime))
      ? new Date(data.transactionDateTime).toISOString()
      : now;

  const { error: txError } = await client.from("bank_transactions").upsert(
    {
      ref,
      amount_vnd: data.amount,
      description: data.description || "payOS VietQR",
      received_at: receivedAt,
      matched_order_id: order.id,
    },
    { onConflict: "ref", ignoreDuplicates: true },
  );

  if (txError) {
    console.error("Lỗi khi ghi nhận bank_transaction từ payOS:", txError);
  }

  return json({
    success: true,
    orderId: order.id,
    plan: order.plan,
  });
});
