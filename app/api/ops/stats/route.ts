import { json } from "@/lib/server/http";
import { opsRoute } from "@/lib/server/ops";
import { db } from "@/lib/server/supabase";

export const GET = opsRoute(async () => {
  const client = db();

  // Users count
  const { count: usersCount, error: usersErr } = await client
    .from("users")
    .select("id", { count: "exact", head: true });
  if (usersErr) throw usersErr;

  // Weddings
  const { data: weddings, error: weddingsErr } = await client
    .from("weddings")
    .select("id, plan, content");
  if (weddingsErr) throw weddingsErr;

  let freeCount = 0;
  let proCount = 0;
  let vipCount = 0;
  let suspendedWeddings = 0;

  for (const w of weddings || []) {
    if (w.plan === "vip") vipCount += 1;
    else if (w.plan === "pro") proCount += 1;
    else freeCount += 1;

    const isSuspended =
      Boolean((w as { suspended?: boolean }).suspended) ||
      Boolean((w.content as { suspended?: boolean })?.suspended);
    if (isSuspended) suspendedWeddings += 1;
  }

  // Orders
  const { data: orders, error: ordersErr } = await client
    .from("orders")
    .select("id, status, amount_vnd, paid_at");
  if (ordersErr) throw ordersErr;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let ordersPending = 0;
  let ordersPaidThisMonth = 0;
  let revenueThisMonthVnd = 0;

  for (const o of orders || []) {
    if (o.status === "pending") {
      ordersPending += 1;
    } else if (o.status === "paid" && o.paid_at) {
      const d = new Date(o.paid_at);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        ordersPaidThisMonth += 1;
        revenueThisMonthVnd += Number(o.amount_vnd) || 0;
      }
    }
  }

  return json({
    users: usersCount || 0,
    weddingsByPlan: {
      free: freeCount,
      pro: proCount,
      vip: vipCount,
    },
    suspendedWeddings,
    ordersPending,
    ordersPaidThisMonth,
    revenueThisMonthVnd,
    generatedAt: new Date().toISOString(),
  });
});

