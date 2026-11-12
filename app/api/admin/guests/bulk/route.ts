import { db } from "@/lib/server/supabase";
import { toGuest } from "@/lib/server/mappers";
import { adminRoute, fail, json, readBody, text } from "@/lib/server/http";

export const POST = adminRoute(async (req: Request) => {
  const body = await readBody(req);
  if (!Array.isArray(body?.names)) return fail("Danh sách tên không hợp lệ.");

  const names = (body.names as unknown[])
    .map((value) => text(value, 100))
    .filter((value): value is string => value !== null);

  if (names.length === 0) return fail("Danh sách tên trống.");
  if (names.length > 500) return fail("Tối đa 500 tên mỗi lần nhập.");

  const { data, error } = await db()
    .from("guests")
    .insert(names.map((name) => ({ name })))
    .select();

  if (error) throw error;
  return json((data ?? []).map(toGuest), 201);
});
