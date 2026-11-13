import { json } from "@/lib/server/http";
import { opsRoute } from "@/lib/server/ops";
import { db } from "@/lib/server/supabase";

export const GET = opsRoute(async (req: Request) => {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const client = db();

  let query = client
    .from("users")
    .select("id, email, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) {
    query = query.ilike("email", `%${q}%`);
  }

  const { data: users, count, error } = await query;
  if (error) throw error;

  const userIds = (users || []).map((u) => u.id);
  const weddingCountMap: Record<string, number> = {};

  if (userIds.length > 0) {
    const { data: weddingsData } = await client
      .from("weddings")
      .select("id, owner_id")
      .in("owner_id", userIds);

    for (const w of weddingsData || []) {
      weddingCountMap[w.owner_id] = (weddingCountMap[w.owner_id] || 0) + 1;
    }
  }

  const items = (users || []).map((u) => ({
    id: u.id,
    email: u.email || "",
    createdAt: u.created_at,
    weddingCount: weddingCountMap[u.id] || 0,
  }));

  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize));

  return json({
    items,
    page,
    totalPages,
  });
});

