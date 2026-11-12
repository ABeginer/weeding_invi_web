import { db } from "@/lib/server/supabase";
import { toGuest } from "@/lib/server/mappers";
import { adminRoute, fail, json, readBody, text, UUID_RE } from "@/lib/server/http";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = adminRoute(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  if (!UUID_RE.test(id)) return fail("Không tìm thấy khách mời.", 404);

  const body = await readBody(req);
  const name = text(body?.name, 100);
  if (!name) return fail("Tên không hợp lệ (tối đa 100 ký tự).");

  const { data, error } = await db()
    .from("guests")
    .update({ name })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) return fail("Không tìm thấy khách mời.", 404);
  return json(toGuest(data));
});

export const DELETE = adminRoute(async (_req: Request, { params }: Ctx) => {
  const { id } = await params;
  if (!UUID_RE.test(id)) return fail("Không tìm thấy khách mời.", 404);

  const { error } = await db().from("guests").delete().eq("id", id);
  if (error) throw error;
  return json({ ok: true });
});
