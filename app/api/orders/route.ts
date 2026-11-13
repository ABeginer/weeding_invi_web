import { getUser } from "@/lib/server/auth";
import { readBody, route, json } from "@/lib/server/http";
import { coded, ownedWedding } from "@/lib/server/owner";
import { db, env } from "@/lib/server/supabase";
import { isUuid } from "@/lib/server/validate";
import { newOrderCode, PLAN_PRICES, PLAN_RANK } from "@/lib/server/payments";
import { buildVietQrPayload } from "@/lib/server/vietqr";

const REUSE_WINDOW_MS = 24 * 60 * 60 * 1000;

export const POST = route(async (req: Request) => {
  const user = await getUser(req);
  if (!user) return coded("Bạn cần đăng nhập.", "UNAUTHORIZED", 401);

  const body = await readBody(req);
  if (!body || !isUuid(body.weddingId)) return coded("Thiệp không hợp lệ.", "VALIDATION", 400);
  if (body.plan !== "pro" && body.plan !== "vip") return coded("Gói không hợp lệ.", "VALIDATION", 400);
  const plan = body.plan;

  const wedding = await ownedWedding(user.id, body.weddingId);
  if (!wedding) return coded("Không tìm thấy thiệp.", "NOT_FOUND", 404);
  if (PLAN_RANK[plan] <= PLAN_RANK[wedding.plan]) {
    return coded("Thiệp đã ở gói này hoặc cao hơn.", "VALIDATION", 400);
  }

  const client = db();
  const bankBin = env("BANK_BIN");
  const bank = {
    name: env("BANK_NAME"),
    accountNo: env("BANK_ACCOUNT_NO"),
    accountName: env("BANK_ACCOUNT_NAME"),
  };
  const qr = (amountVnd: number, code: string) =>
    buildVietQrPayload({ bin: bankBin, accountNo: bank.accountNo, amount: amountVnd, content: code });

  const { data: recent, error: recentError } = await client
    .from("orders")
    .select("id, code, plan, amount_vnd, created_at")
    .eq("wedding_id", wedding.id)
    .eq("plan", plan)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (recentError) throw recentError;
  if (recent && Date.now() - Date.parse(recent.created_at as string) < REUSE_WINDOW_MS) {
    return json({
      id: recent.id,
      code: recent.code,
      plan: recent.plan,
      amountVnd: recent.amount_vnd,
      bank,
      transferContent: recent.code,
      qrPayload: qr(recent.amount_vnd as number, recent.code as string),
    });
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    const code = newOrderCode();
    const { data, error } = await client
      .from("orders")
      .insert({
        code,
        user_id: user.id,
        wedding_id: wedding.id,
        plan,
        amount_vnd: PLAN_PRICES[plan],
      })
      .select("id, code, plan, amount_vnd")
      .single();
    if (!error && data) {
      return json(
        {
          id: data.id,
          code: data.code,
          plan: data.plan,
          amountVnd: data.amount_vnd,
          bank,
          transferContent: data.code,
          qrPayload: qr(data.amount_vnd as number, data.code as string),
        },
        201,
      );
    }
    if (error && error.code !== "23505") throw error;
  }
  throw new Error("Could not create a unique order code");
});
