import { getEventLimitMessage, getPlanLimits } from "@/config/plans";
import { authRoute, fail, json, readBody } from "@/lib/server/http";
import { toEvent, type EventRow } from "@/lib/server/mappers";
import { db } from "@/lib/server/supabase";
import { getOwnedWedding, listWeddingEvents } from "@/lib/server/weddings";
import {
  reorderPositionsSchema,
  weddingEventInputSchema,
} from "@/lib/wedding-types";

type Ctx = { params: Promise<{ id: string }> };

export const GET = authRoute<Ctx>(async (_req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  const events = await listWeddingEvents(wedding.id);
  return json(events);
});

export const POST = authRoute<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  const client = db();
  const maxEvents = getPlanLimits(wedding.plan).events;
  const { data: existingRows, error: listError } = await client
    .from("events")
    .select("id, position")
    .eq("wedding_id", wedding.id);

  if (listError) throw listError;
  const currentRows = existingRows ?? [];

  if (currentRows.length >= maxEvents) {
    return fail(getEventLimitMessage(wedding.plan), 403);
  }

  const body = await readBody(req);
  if (!body) return fail("Dữ liệu lễ cưới không hợp lệ.");

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

  const nextPosition =
    currentRows.reduce(
      (max, row) => Math.max(max, Number(row.position ?? 0)),
      -1,
    ) + 1;

  const { data, error } = await client
    .from("events")
    .insert({
      wedding_id: wedding.id,
      title: parsed.data.title,
      starts_at: parsed.data.startsAt,
      lunar_date: parsed.data.lunarDate || null,
      venue_name: parsed.data.venueName,
      venue_address: parsed.data.venueAddress,
      map_embed_url: parsed.data.mapEmbedUrl,
      map_directions_url: parsed.data.mapDirectionsUrl,
      position: nextPosition,
    })
    .select("*")
    .single();

  if (error) throw error;
  return json(toEvent(data as EventRow), 201);
});

export const PATCH = authRoute<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  let rawJson: unknown = null;
  try {
    rawJson = await req.json();
  } catch {
    return fail("Dữ liệu sắp xếp không hợp lệ.");
  }

  const candidate = Array.isArray(rawJson)
    ? rawJson
    : rawJson && typeof rawJson === "object" && "items" in rawJson
      ? (rawJson as { items: unknown }).items
      : null;

  const parsed = reorderPositionsSchema.safeParse(candidate);
  if (!parsed.success) {
    return fail(
      parsed.error.issues[0]?.message ?? "Danh sách sắp xếp không hợp lệ.",
    );
  }

  const items = parsed.data;
  const client = db();
  const { data: ownedRows, error: checkError } = await client
    .from("events")
    .select("id")
    .eq("wedding_id", wedding.id);

  if (checkError) throw checkError;
  const ownedIds = new Set((ownedRows ?? []).map((row) => String(row.id)));
  if (items.some((item) => !ownedIds.has(item.id))) {
    return fail("Có lễ không thuộc thiệp cưới này.", 404);
  }

  await Promise.all(
    items.map(async (item) => {
      const { error } = await client
        .from("events")
        .update({ position: item.position })
        .eq("id", item.id)
        .eq("wedding_id", wedding.id);
      if (error) throw error;
    }),
  );

  const updated = await listWeddingEvents(wedding.id);
  return json(updated);
});

