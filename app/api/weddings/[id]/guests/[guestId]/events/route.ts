import { authRoute, fail, json, readBody, UUID_RE } from "@/lib/server/http";
import { db } from "@/lib/server/supabase";
import { getOwnedWedding } from "@/lib/server/weddings";
import { guestEventsInputSchema } from "@/lib/wedding-types";

type Ctx = { params: Promise<{ id: string; guestId: string }> };

export const POST = authRoute<Ctx>(async (req, user, { params }) => {
  const { id, guestId } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);
  if (!UUID_RE.test(guestId)) return fail("Không tìm thấy khách mời.", 404);

  const client = db();
  const { data: guest, error: guestError } = await client
    .from("guests")
    .select("id")
    .eq("id", guestId)
    .eq("wedding_id", wedding.id)
    .maybeSingle();

  if (guestError) throw guestError;
  if (!guest) return fail("Không tìm thấy khách mời.", 404);

  const body = await readBody(req);
  if (!body) return fail("Dữ liệu gán lễ không hợp lệ.");

  const parsed = guestEventsInputSchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      parsed.error.issues[0]?.message ?? "Danh sách lễ không hợp lệ.",
    );
  }

  const uniqueEventIds = Array.from(new Set(parsed.data.eventIds));

  if (uniqueEventIds.length > 0) {
    const { data: ownedEvents, error: eventsError } = await client
      .from("events")
      .select("id")
      .eq("wedding_id", wedding.id)
      .in("id", uniqueEventIds);

    if (eventsError) throw eventsError;
    const validIds = new Set((ownedEvents ?? []).map((row) => String(row.id)));
    if (uniqueEventIds.some((eventId) => !validIds.has(eventId))) {
      return fail("Có lễ không thuộc thiệp cưới này.", 404);
    }
  }

  const { error: deleteError } = await client
    .from("guest_events")
    .delete()
    .eq("guest_id", guest.id);

  if (deleteError) throw deleteError;

  if (uniqueEventIds.length > 0) {
    const { error: insertError } = await client
      .from("guest_events")
      .insert(
        uniqueEventIds.map((eventId) => ({
          guest_id: guest.id,
          event_id: eventId,
        })),
      );
    if (insertError) throw insertError;
  }

  return json({ guestId: guest.id, eventIds: uniqueEventIds });
});

