import { db } from "@/lib/server/supabase";
import { toWish } from "@/lib/server/mappers";
import { adminRoute, json } from "@/lib/server/http";

export const GET = adminRoute(async () => {
  const { data, error } = await db()
    .from("wishes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) throw error;
  return json((data ?? []).map(toWish));
});
