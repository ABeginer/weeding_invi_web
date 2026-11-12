import { authRoute, fail, json, readBody, UUID_RE } from "@/lib/server/http";
import { toEvent, type EventRow } from "@/lib/server/mappers";
import { db } from "@/lib/server/supabase";
import { getOwnedWedding } from "@/lib/server/weddings";
import { weddingEventInputSchema } from "@/lib/wedding-types";

type Ctx = { params: Promise<{ id: string; eventId: string }> };

export const PATCH = authRoute<Ctx>(async (req, user, { params }) => {
  const { id, eventId } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);
  if (!UUID_RE.test(eventId)) return fail("Không tìm thấy lễ.", 404);

  const body = await readBody(req);
  if (!body) return fail("Dữ liệu cập nhật lễ không hợp lệ.");

  const parsed = weddingEventInputSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return json(
      {
        error: issue?.message ?? "Thông tin lễ không hợp lệ.",
        field: issue?.path?.join(".") || undefined,
      },
      400,
    );
  }

  const { data, error } = await db()
    .from("events")
    .update({
      title: parsed.data.title,
      starts_at: parsed.data.startsAt,
      lunar_date: parsed.data.lunarDate || null,
      venue_name: parsed.data.venueName,
      venue_address: parsed.data.venueAddress,
      map_embed_url: parsed.data.mapEmbedUrl,
      map_directions_url: parsed.data.mapDirectionsUrl,
    })
    .eq("id", eventId)
    .eq("wedding_id", wedding.id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) return fail("Không tìm thấy lễ.", 404);

  return json(toEvent(data as EventRow));
});

export const DELETE = authRoute<Ctx>(async (_req, user, { params }) => {
  const { id, eventId } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);
  if (!UUID_RE.test(eventId)) return fail("Không tìm thấy lễ.", 404);

  const { data, error } = await db()
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("wedding_id", wedding.id)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) return fail("Không tìm thấy lễ.", 404);

  return json({ ok: true });
});

