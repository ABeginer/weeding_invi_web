import { authRoute, fail, json } from "@/lib/server/http";
import { db } from "@/lib/server/supabase";
import { getOwnedWedding, listWeddingEvents } from "@/lib/server/weddings";

type Ctx = { params: Promise<{ id: string }> };

export const GET = authRoute<Ctx>(async (_req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  const client = db();
  const [guests, wishes, events] = await Promise.all([
    client.from("guests").select("id, status").eq("wedding_id", wedding.id),
    client
      .from("wishes")
      .select("id", { count: "exact", head: true })
      .eq("wedding_id", wedding.id),
    listWeddingEvents(wedding.id),
  ]);

  if (guests.error) throw guests.error;
  if (wishes.error) throw wishes.error;

  const rows = guests.data ?? [];
  const count = (status: string) => rows.filter((row) => row.status === status).length;

  const guestIds = rows.map((row) => String(row.id));
  const assignedGuestIds = new Set<string>();
  const assignedPerEvent = new Map<string, number>();

  if (guestIds.length > 0 && events.length > 0) {
    const { data: links, error: linkError } = await client
      .from("guest_events")
      .select("guest_id, event_id")
      .in("guest_id", guestIds);

    if (linkError) throw linkError;

    for (const row of links ?? []) {
      const gId = String(row.guest_id);
      const eId = String(row.event_id);
      assignedGuestIds.add(gId);
      assignedPerEvent.set(eId, (assignedPerEvent.get(eId) ?? 0) + 1);
    }
  }

  const unassignedCount = rows.length - assignedGuestIds.size;
  const eventCounts = events.map((evt) => {
    const assignedCount = assignedPerEvent.get(evt.id) ?? 0;
    return {
      eventId: evt.id,
      title: evt.title,
      assignedCount,
      visibleGuestCount: assignedCount + unassignedCount,
    };
  });

  return json({
    total: rows.length,
    accepted: count("accepted"),
    declined: count("declined"),
    pending: count("pending"),
    wishes: wishes.count ?? 0,
    unassignedCount,
    eventCounts,
  });
});
