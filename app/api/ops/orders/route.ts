import { json } from "@/lib/server/http";
import { opsRoute } from "@/lib/server/ops";
import { fetchAllRows } from "@/lib/server/pagination";
import { db } from "@/lib/server/supabase";

interface OrderListRow {
  id: string;
  code: string;
  plan: string;
  amount_vnd: number | string | null;
  status: string;
  wedding_id: string;
  user_id: string;
  paid_at: string | null;
  created_at: string;
}

export const GET = opsRoute(async (req: Request) => {
  const url = new URL(req.url);
  const status = url.searchParams.get("status")?.trim() || "";
  const q = url.searchParams.get("q")?.trim().toLowerCase() || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const pageSize = 20;

  const client = db();

  let query = client
    .from("orders")
    .select("id, code, plan, amount_vnd, status, wedding_id, user_id, paid_at, created_at")
    .order("created_at", { ascending: false });

  if (status && (status === "pending" || status === "paid" || status === "cancelled")) {
    query = query.eq("status", status);
  }

  const allOrders = await fetchAllRows<OrderListRow>((from, to) =>
    query.range(from, to),
  );

  // Resolve user emails
  const userIds = Array.from(new Set((allOrders || []).map((o) => o.user_id)));
  const emailMap: Record<string, string> = {};

  if (userIds.length > 0) {
    const { data: usersData } = await client
      .from("users")
      .select("id, email")
      .in("id", userIds);

    for (const u of usersData || []) {
      emailMap[u.id] = u.email || "";
    }
  }

  let mapped = (allOrders || []).map((o) => ({
    id: o.id,
    code: o.code,
    plan: o.plan,
    amountVnd: Number(o.amount_vnd) || 0,
    status: o.status,
    weddingId: o.wedding_id,
    ownerEmail: emailMap[o.user_id] || "",
    createdAt: o.created_at,
    paidAt: o.paid_at,
  }));

  if (q) {
    mapped = mapped.filter(
      (o) =>
        o.code.toLowerCase().includes(q) ||
        o.ownerEmail.toLowerCase().includes(q),
    );
  }

  const totalItems = mapped.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const from = (page - 1) * pageSize;
  const sliced = mapped.slice(from, from + pageSize);

  return json({
    items: sliced,
    page,
    totalPages,
  });
});

