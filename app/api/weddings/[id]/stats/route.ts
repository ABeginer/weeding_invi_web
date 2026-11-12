import { authRoute, fail, json } from "@/lib/server/http";
import { db } from "@/lib/server/supabase";
import { getOwnedWedding, listWeddingEvents } from "@/lib/server/weddings";

type Ctx = { params: Promise<{ id: string }> };

interface GuestStatRow {
  id: string;
  status: string;
  plus_ones?: number | null;
  diet?: string | null;
}

function isMissingV4GuestColumns(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: unknown; message?: unknown };
  const code = typeof err.code === "string" ? err.code : "";
  const message = typeof err.message === "string" ? err.message : "";
  return (
    code === "42703" ||
    code === "PGRST204" ||
    /\b(plus_ones|diet)\b/i.test(message)
  );
}

export const GET = authRoute<Ctx>(async (_req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  const client = db();
  const [guestsRes, wishes, events] = await Promise.all([
    client
      .from("guests")
      .select("id, status, plus_ones, diet")
      .eq("wedding_id", wedding.id),
    client
      .from("wishes")
      .select("id", { count: "exact", head: true })
      .eq("wedding_id", wedding.id),
    listWeddingEvents(wedding.id),
  ]);

  let guestRows: GuestStatRow[] = [];
  if (guestsRes.error) {
    if (!isMissingV4GuestColumns(guestsRes.error)) {
      throw guestsRes.error;
    }
    const fallback = await client
      .from("guests")
      .select("id, status")
      .eq("wedding_id", wedding.id);
    if (fallback.error) throw fallback.error;
    guestRows = (fallback.data ?? []) as GuestStatRow[];
  } else {
    guestRows = (guestsRes.data ?? []) as GuestStatRow[];
  }

  if (wishes.error) throw wishes.error;

  const count = (status: string) =>
    guestRows.filter((row) => row.status === status).length;

  const headcountOf = (row: GuestStatRow) =>
    1 + (typeof row.plus_ones === "number" && row.plus_ones > 0 ? row.plus_ones : 0);

  const acceptedRows = guestRows.filter((row) => row.status === "accepted");
  const acceptedHeadcount = acceptedRows.reduce(
    (sum, row) => sum + headcountOf(row),
    0,
  );
  const meatCount = acceptedRows
    .filter((row) => row.diet === "meat")
    .reduce((sum, row) => sum + headcountOf(row), 0);
  const vegCount = acceptedRows
    .filter((row) => row.diet === "veg")
    .reduce((sum, row) => sum + headcountOf(row), 0);

  const guestIds = guestRows.map((row) => String(row.id));
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

  const unassignedCount = guestRows.length - assignedGuestIds.size;
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
    total: guestRows.length,
    accepted: count("accepted"),
    declined: count("declined"),
    pending: count("pending"),
    acceptedHeadcount,
    meatCount,
    vegCount,
    wishes: wishes.count ?? 0,
    unassignedCount,
    eventCounts,
  });
});
