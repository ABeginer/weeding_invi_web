import { getGuestLimitMessage, getPlanLimits } from "@/config/plans";
import { authRoute, fail, json, readBody, text } from "@/lib/server/http";
import { toGuest, type GuestRow } from "@/lib/server/mappers";
import { db } from "@/lib/server/supabase";
import { getOwnedWedding } from "@/lib/server/weddings";

type Ctx = { params: Promise<{ id: string }> };

export const GET = authRoute<Ctx>(async (_req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  const client = db();
  const { data, error } = await client
    .from("guests")
    .select("*")
    .eq("wedding_id", wedding.id)
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) throw error;
  const rows = (data ?? []) as GuestRow[];
  const eventMap = new Map<string, string[]>();

  if (rows.length > 0) {
    const guestIds = rows.map((row) => row.id);
    const { data: links, error: linkError } = await client
      .from("guest_events")
      .select("guest_id, event_id")
      .in("guest_id", guestIds);

    if (linkError) throw linkError;
    for (const row of links ?? []) {
      const gId = String(row.guest_id);
      const eId = String(row.event_id);
      const current = eventMap.get(gId) ?? [];
      current.push(eId);
      eventMap.set(gId, current);
    }
  }

  return json(rows.map((row) => toGuest(row, eventMap.get(row.id) ?? [])));
});

export const POST = authRoute<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  const body = await readBody(req);
  const name = text(body?.name, 100);
  if (!name) return fail("Vui lòng nhập tên khách mời (tối đa 100 ký tự).");

  const client = db();
  const { count, error: countError } = await client
    .from("guests")
    .select("id", { count: "exact", head: true })
    .eq("wedding_id", wedding.id);

  if (countError) throw countError;
  const currentCount = count ?? 0;

  const maxGuests = getPlanLimits(wedding.plan).guests;
  if (maxGuests !== null && currentCount >= maxGuests) {
    return fail(getGuestLimitMessage(wedding.plan), 403);
  }

  const { data, error } = await client
    .from("guests")
    .insert({ wedding_id: wedding.id, name })
    .select("*")
    .single();

  if (error) throw error;
  return json(toGuest(data as GuestRow, []), 201);
});
