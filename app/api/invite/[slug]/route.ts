import { db } from "@/lib/server/supabase";
import { fail, json, route, SLUG_RE } from "@/lib/server/http";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { getGuestVisibleEvents, isWeddingSuspended } from "@/lib/server/weddings";
import type { GuestDiet, GuestStatus } from "@/lib/types";

const GUEST_BASE_COLUMNS = "id, wedding_id, name, status";
const GUEST_V4_COLUMNS = `${GUEST_BASE_COLUMNS}, plus_ones, diet`;
const GUEST_FULL_COLUMNS = `${GUEST_V4_COLUMNS}, song_request, ride_needed`;

interface GuestInviteRow {
  id: string;
  wedding_id: string;
  name: string;
  status: GuestStatus;
  plus_ones?: number | null;
  diet?: GuestDiet | null;
  song_request?: string | null;
  ride_needed?: boolean | null;
}

function isMissingColumn(error: unknown, columns: string[]): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: unknown; message?: unknown };
  const code = typeof err.code === "string" ? err.code : "";
  const message = typeof err.message === "string" ? err.message : "";
  if (code === "42703" || code === "PGRST204") return true;
  return columns.some((column) => new RegExp(`\\b${column}\\b`, "i").test(message));
}

const OPTIONAL_GUEST_COLUMNS = [
  "plus_ones",
  "diet",
  "song_request",
  "ride_needed",
];

export const GET = route(
  async (req: Request, { params }: { params: Promise<{ slug: string }> }) => {
    const limited = rateLimit(req, "invite", 60, 60_000);
    if (!limited.ok) return tooManyRequests(limited);

    const { slug } = await params;
    if (!SLUG_RE.test(slug)) return fail("Link không hợp lệ.", 404);

    const client = db();
    let row: GuestInviteRow | null = null;

    // Đọc giảm dần để vẫn chạy trên DB chưa có các cột tuỳ chọn.
    for (const columns of [
      GUEST_FULL_COLUMNS,
      GUEST_V4_COLUMNS,
      GUEST_BASE_COLUMNS,
    ]) {
      const res = await client
        .from("guests")
        .select(columns)
        .eq("slug", slug)
        .maybeSingle();

      if (!res.error) {
        row = (res.data as GuestInviteRow | null) ?? null;
        break;
      }
      if (!isMissingColumn(res.error, OPTIONAL_GUEST_COLUMNS)) throw res.error;
      if (columns === GUEST_BASE_COLUMNS) throw res.error;
    }

    if (!row) return fail("Link không hợp lệ.", 404);
    if (await isWeddingSuspended(row.wedding_id)) {
      return fail("Link không hợp lệ.", 404);
    }

    const events = await getGuestVisibleEvents(row.wedding_id, row.id);

    return json({
      name: row.name,
      status: row.status,
      plusOnes: typeof row.plus_ones === "number" ? row.plus_ones : 0,
      diet: row.diet === "meat" || row.diet === "veg" ? row.diet : null,
      songRequest:
        typeof row.song_request === "string" && row.song_request.trim()
          ? row.song_request
          : null,
      rideNeeded: row.ride_needed === true,
      events,
    });
  },
);
