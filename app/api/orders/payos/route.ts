import { resolveAppBaseUrl } from "@/config/site";
import { getUser } from "@/lib/server/auth";
import { readBody, route, json, fail } from "@/lib/server/http";
import { coded, ownedWedding } from "@/lib/server/owner";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { db } from "@/lib/server/supabase";
import { isUuid } from "@/lib/server/validate";
import { calculateUpgradeAmount, newOrderCode } from "@/lib/server/payments";
import { createPayosPaymentLink } from "@/lib/server/payos";

export const POST = route(async (req: Request) => {
  const user = await getUser(req);
  if (!user) return coded("Bạn cần đăng nhập.", "UNAUTHORIZED", 401);

  const limited = rateLimit(req, `orders-payos:${user.id}`, 10, 60_000);
  if (!limited.ok) return tooManyRequests(limited);

  const body = await readBody(req);
  if (!body || !isUuid(body.weddingId)) {
    return coded("Thiệp không hợp lệ.", "VALIDATION", 400);
  }
  if (body.plan !== "pro" && body.plan !== "vip") {
    return coded("Gói không hợp lệ.", "VALIDATION", 400);
  }

  const wedding = await ownedWedding(user.id, body.weddingId);
  if (!wedding) return coded("Không tìm thấy thiệp.", "NOT_FOUND", 404);

  const amount = calculateUpgradeAmount(wedding.plan, body.plan);
  if (amount === null) {
    return coded("Thiệp đã ở gói này hoặc cao hơn.", "VALIDATION", 400);
  }

  const client = db();

  type OrderInsertResult = {
    id: string;
    code: string;
    plan: string;
    amount_vnd: number;
  };

  // Sinh mã code INV-[A-Z0-9]{6} & payos orderCode với cơ chế retry nếu trùng (Postgres error 23505)
  let order: OrderInsertResult | null = null;
  let orderCode = 0;
  const maxRetries = 5;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const code = newOrderCode();
    orderCode = Number(
      `${Math.floor(Date.now() / 1000)}${Math.floor(100 + Math.random() * 900)}`,
    );
    const insertPayload: Record<string, unknown> = {
      code,
      user_id: user.id,
      wedding_id: wedding.id,
      plan: body.plan,
      amount_vnd: amount,
      status: "pending",
      payos_order_code: orderCode,
    };

    let { data: inserted, error: insertError } = await client
      .from("orders")
      .insert(insertPayload)
      .select("id, code, plan, amount_vnd")
      .single();

    // Nếu DB chưa có cột payos_order_code (Postgres error 42703), retry không có trường này
    if (insertError && (insertError.code === "42703" || insertError.message?.includes("payos_order_code"))) {
      delete insertPayload.payos_order_code;
      const fallbackInsert = await client
        .from("orders")
        .insert(insertPayload)
        .select("id, code, plan, amount_vnd")
        .single();
      inserted = fallbackInsert.data;
      insertError = fallbackInsert.error;
    }

    // Nếu trùng mã code (23505 unique violation), thử lại với mã code mới
    if (insertError && insertError.code === "23505") {
      continue;
    }

    if (insertError || !inserted) {
      throw insertError || new Error("Không thể khởi tạo bản ghi đơn hàng.");
    }

    order = inserted as unknown as OrderInsertResult;
    break;
  }

  if (!order) {
    return fail("Không thể sinh mã đơn hàng không trùng sau nhiều lần thử.", 500);
  }

  const baseUrl = resolveAppBaseUrl();
  const returnUrl = `${baseUrl}/dashboard/weddings/${wedding.id}?payment=success`;
  const cancelUrl = `${baseUrl}/dashboard/weddings/${wedding.id}?payment=cancelled`;
  // Đưa mã code INV-[A-Z0-9]{6} vào description thanh toán payOS (10 ký tự, thỏa mãn <= 25 ký tự)
  const description = order.code;

  try {
    const paymentData = await createPayosPaymentLink({
      orderCode,
      amount,
      description,
      returnUrl,
      cancelUrl,
    });

    return json(
      {
        orderId: order.id,
        orderCode: paymentData.orderCode,
        amount: paymentData.amount,
        checkoutUrl: paymentData.checkoutUrl,
        qrCode: paymentData.qrCode,
        accountName: paymentData.accountName,
        accountNumber: paymentData.accountNumber,
        bin: paymentData.bin,
        description: paymentData.description,
      },
      201,
    );
  } catch (err: unknown) {
    // Nếu gọi payOS thất bại, xóa bản ghi pending để không tạo rác dữ liệu
    await client.from("orders").delete().eq("id", order.id);
    console.error("[Orders PayOS Direct Error]", err);
    return fail("Không thể khởi tạo liên kết thanh toán lúc này. Vui lòng thử lại sau ít phút.", 502);
  }
});
