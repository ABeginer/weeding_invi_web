import { json } from "@/lib/server/http";
import { opsRoute } from "@/lib/server/ops";
import { db } from "@/lib/server/supabase";

export const GET = opsRoute(async (req: Request) => {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const client = db();

  const { data: list, count, error } = await client
    .from("bank_transactions")
    .select("id, ref, amount_vnd, description, received_at", { count: "exact" })
    .is("matched_order_id", null)
    .order("received_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  const items = (list || []).map((t) => ({
    id: t.id,
    ref: t.ref,
    amountVnd: Number(t.amount_vnd) || 0,
    description: t.description,
    receivedAt: t.received_at,
  }));

  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize));

  return json({
    items,
    page,
    totalPages,
  });
});

