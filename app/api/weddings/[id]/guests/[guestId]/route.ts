import { authRoute, fail, json, readBody, text, UUID_RE } from "@/lib/server/http";
import { toGuest, type GuestRow } from "@/lib/server/mappers";
import { db } from "@/lib/server/supabase";
import { getOwnedWedding } from "@/lib/server/weddings";

type Ctx = { params: Promise<{ id: string; guestId: string }> };

export const PATCH = authRoute<Ctx>(async (req, user, { params }) => {
  const { id, guestId } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);
  if (!UUID_RE.test(guestId)) return fail("Không tìm thấy khách mời.", 404);

  const body = await readBody(req);
  const name = text(body?.name, 100);
  if (!name) return fail("Tên không hợp lệ (tối đa 100 ký tự).");

  const { data, error } = await db()
    .from("guests")
    .update({ name })
    .eq("id", guestId)
    .eq("wedding_id", wedding.id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) return fail("Không tìm thấy khách mời.", 404);
  return json(toGuest(data as GuestRow));
});

export const DELETE = authRoute<Ctx>(async (_req, user, { params }) => {
  const { id, guestId } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);
  if (!UUID_RE.test(guestId)) return fail("Không tìm thấy khách mời.", 404);

  const { data, error } = await db()
    .from("guests")
    .delete()
    .eq("id", guestId)
    .eq("wedding_id", wedding.id)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) return fail("Không tìm thấy khách mời.", 404);
  return json({ ok: true });
});

