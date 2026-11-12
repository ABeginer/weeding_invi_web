import { authRoute, json } from "@/lib/server/http";
import { db } from "@/lib/server/supabase";

export const POST = authRoute(async (_req, user) => {
  const { data, error } = await db()
    .from("users")
    .upsert({ id: user.id, email: user.email }, { onConflict: "id" })
    .select("id, email, created_at")
    .single();

  if (error) throw error;

  return json({
    id: data.id,
    email: data.email,
    createdAt: data.created_at,
  });
});

