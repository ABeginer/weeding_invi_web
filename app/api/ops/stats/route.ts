import { json } from "@/lib/server/http";
import { opsRoute } from "@/lib/server/ops";
import { fetchAllRows } from "@/lib/server/pagination";
import { db } from "@/lib/server/supabase";

export const GET = opsRoute(async () => {
  const client = db();

  const [usersRes, freeRes, proRes, vipRes, suspendedRes, pendingRes] =
    await Promise.all([
      client.from("users").select("id", { count: "exact", head: true }),
      client.from("weddings").select("id", { count: "exact", head: true }).eq("plan", "free"),
      client.from("weddings").select("id", { count: "exact", head: true }).eq("plan", "pro"),
      client.from("weddings").select("id", { count: "exact", head: true }).eq("plan", "vip"),
      client.from("weddings").select("id", { count: "exact", head: true }).eq("suspended", true),
      client.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);

  for (const res of [usersRes, freeRes, proRes, vipRes, suspendedRes, pendingRes]) {
    if (res.error) throw res.error;
  }

  // Doanh thu chỉ cần các đơn đã trả trong tháng hiện tại (UTC).
  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();
  const monthEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  ).toISOString();

  const paidRows = await fetchAllRows<{ amount_vnd: number | string | null }>(
    (from, to) =>
      client
        .from("orders")
        .select("amount_vnd")
        .eq("status", "paid")
        .gte("paid_at", monthStart)
        .lt("paid_at", monthEnd)
        .range(from, to),
  );

  const revenueThisMonthVnd = paidRows.reduce(
    (sum, row) => sum + (Number(row.amount_vnd) || 0),
    0,
  );

  return json({
    users: usersRes.count || 0,
    weddingsByPlan: {
      free: freeRes.count || 0,
      pro: proRes.count || 0,
      vip: vipRes.count || 0,
    },
    suspendedWeddings: suspendedRes.count || 0,
    ordersPending: pendingRes.count || 0,
    ordersPaidThisMonth: paidRows.length,
    revenueThisMonthVnd,
    generatedAt: new Date().toISOString(),
  });
});
