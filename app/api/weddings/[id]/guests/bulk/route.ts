import { getGuestLimitMessage, getPlanLimits } from "@/config/plans";
import { authRoute, fail, json, readBody, text } from "@/lib/server/http";
import { toGuest, type GuestRow } from "@/lib/server/mappers";
import { db } from "@/lib/server/supabase";
import { getOwnedWedding } from "@/lib/server/weddings";

type Ctx = { params: Promise<{ id: string }> };

export const POST = authRoute<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  const body = await readBody(req);
  if (!Array.isArray(body?.names)) return fail("Danh sách tên không hợp lệ.");

  const names = (body.names as unknown[])
    .map((value) => text(value, 100))
    .filter((value): value is string => value !== null);

  if (names.length === 0) return fail("Danh sách tên trống.");
  if (names.length > 500) return fail("Tối đa 500 tên mỗi lần nhập.");

  const client = db();
  const { count, error: countError } = await client
    .from("guests")
    .select("id", { count: "exact", head: true })
    .eq("wedding_id", wedding.id);

  if (countError) throw countError;
  const currentCount = count ?? 0;

  const maxGuests = getPlanLimits(wedding.plan).guests;
  if (maxGuests !== null && currentCount + names.length > maxGuests) {
    const remaining = Math.max(0, maxGuests - currentCount);
    return fail(getGuestLimitMessage(wedding.plan, remaining), 403);
  }

  const { data, error } = await client
    .from("guests")
    .insert(names.map((name) => ({ wedding_id: wedding.id, name })))
    .select("*");

  if (error) throw error;
  return json(((data ?? []) as GuestRow[]).map((row) => toGuest(row, [])), 201);
});
