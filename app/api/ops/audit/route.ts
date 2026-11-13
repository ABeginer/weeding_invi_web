import { json } from "@/lib/server/http";
import { opsRoute } from "@/lib/server/ops";
import { db } from "@/lib/server/supabase";

export const GET = opsRoute(async (req: Request) => {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const pageSize = 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const client = db();

  const { data: logs, count, error } = await client
    .from("audit_logs")
    .select("id, admin_email, action, target_type, target_id, reason, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  // If audit_logs table does not exist or error, return empty items gracefully
  if (error) {
    return json({
      items: [],
      page: 1,
      totalPages: 1,
    });
  }

  const items = (logs || []).map((l) => ({
    id: l.id,
    adminEmail: l.admin_email,
    action: l.action,
    targetType: l.target_type,
    targetId: l.target_id,
    reason: l.reason,
    createdAt: l.created_at,
  }));

  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize));

  return json({
    items,
    page,
    totalPages,
  });
});

