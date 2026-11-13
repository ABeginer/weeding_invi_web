import { readBody, route, json, fail } from "@/lib/server/http";
import { db, env } from "@/lib/server/supabase";
import { findOrderCode, safeEqual } from "@/lib/server/payments";

export const POST = route(async (req: Request) => {
  const expected = env("BANK_WEBHOOK_SECRET");
  const given = req.headers.get("x-webhook-secret") ?? "";
  if (!safeEqual(given, expected)) return fail("Unauthorized", 401);

  const body = await readBody(req);
  const ref = typeof body?.ref === "string" ? body.ref.trim() : "";
  const amount = body?.amountVnd;
  const description = typeof body?.description === "string" ? body.description.slice(0, 500) : "";
  const receivedAt =
    typeof body?.receivedAt === "string" && !Number.isNaN(Date.parse(body.receivedAt))
      ? new Date(body.receivedAt).toISOString()
      : null;

  if (!ref || ref.length > 200) return fail("Invalid ref", 400);
  if (typeof amount !== "number" || !Number.isSafeInteger(amount) || amount < 0) {
    return fail("Invalid amount", 400);
  }
  if (!receivedAt) return fail("Invalid receivedAt", 400);

  const client = db();

  const { data: existing, error: existingError } = await client
    .from("bank_transactions")
    .select("id")
    .eq("ref", ref)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return json({ ok: true, duplicate: true });

  let matchedOrderId: string | null = null;
  const code = findOrderCode(description);

  if (code) {
    const { data: order, error: orderError } = await client
      .from("orders")
      .select("id, wedding_id, plan, amount_vnd, status")
      .eq("code", code)
      .maybeSingle();
    if (orderError) throw orderError;

    if (order && order.status === "pending" && amount >= (order.amount_vnd as number)) {
      const { error: planError } = await client
        .from("weddings")
        .update({ plan: order.plan })
        .eq("id", order.wedding_id);
      if (planError) throw planError;

      const { data: marked, error: markError } = await client
        .from("orders")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", order.id)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();
      if (markError) throw markError;
      if (marked) matchedOrderId = order.id as string;
    }
  }

  const { error: insertError } = await client.from("bank_transactions").insert({
    ref,
    amount_vnd: amount,
    description,
    received_at: receivedAt,
    matched_order_id: matchedOrderId,
  });
  if (insertError) throw insertError;

  return json({ ok: true, matched: matchedOrderId !== null });
});
