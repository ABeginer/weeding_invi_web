import { db } from "@/lib/server/supabase";
import { toGuest } from "@/lib/server/mappers";
import { adminRoute, fail, json, readBody, text } from "@/lib/server/http";

export const GET = adminRoute(async () => {
  const { data, error } = await db()
    .from("guests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) throw error;
  return json((data ?? []).map(toGuest));
});

export const POST = adminRoute(async (req: Request) => {
  const body = await readBody(req);
  const name = text(body?.name, 100);
  if (!name) return fail("Vui lòng nhập tên khách mời (tối đa 100 ký tự).");

  const { data, error } = await db().from("guests").insert({ name }).select().single();
  if (error) throw error;
  return json(toGuest(data), 201);
});
