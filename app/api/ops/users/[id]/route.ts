import { json } from "@/lib/server/http";
import { opsRoute } from "@/lib/server/ops";
import { coded } from "@/lib/server/owner";
import { db } from "@/lib/server/supabase";

export const GET = opsRoute(async (req, admin, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const client = db();

  const { data: user, error: userErr } = await client
    .from("users")
    .select("id, email, created_at")
    .eq("id", id)
    .maybeSingle();

  if (userErr) throw userErr;
  if (!user) {
    return coded("Không tìm thấy người dùng.", "NOT_FOUND", 404);
  }

  const { data: weddings, error: weddingsErr } = await client
    .from("weddings")
    .select("id, slug, plan, content, created_at")
    .eq("owner_id", id)
    .order("created_at", { ascending: false });

  if (weddingsErr) throw weddingsErr;

  const weddingItems = (weddings || []).map((w) => {
    const isSuspended =
      Boolean((w as { suspended?: boolean }).suspended) ||
      Boolean((w.content as { suspended?: boolean })?.suspended);

    return {
      id: w.id,
      slug: w.slug,
      plan: w.plan,
      suspended: isSuspended,
      createdAt: w.created_at,
    };
  });

  return json({
    id: user.id,
    email: user.email || "",
    createdAt: user.created_at,
    weddings: weddingItems,
  });
});

