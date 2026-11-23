import { getGuestLimitMessage, getPlanLimits } from "@/config/plans";
import { authRoute, fail, json, readBody, text } from "@/lib/server/http";
import { chunkIds, fetchAllRows } from "@/lib/server/pagination";
import { toGuest, type GuestRow } from "@/lib/server/mappers";
import { db } from "@/lib/server/supabase";
import { getOwnedWedding } from "@/lib/server/weddings";

type Ctx = { params: Promise<{ id: string }> };

async function loadEventMap(
  client: ReturnType<typeof db>,
  rows: GuestRow[],
): Promise<Map<string, string[]>> {
  const eventMap = new Map<string, string[]>();
  if (rows.length === 0) return eventMap;

  for (const chunk of chunkIds(rows.map((row) => row.id), 200)) {
    const { data: links, error: linkError } = await client
      .from("guest_events")
      .select("guest_id, event_id")
      .in("guest_id", chunk);

    if (linkError) throw linkError;
    for (const row of links ?? []) {
      const gId = String(row.guest_id);
      const eId = String(row.event_id);
      const current = eventMap.get(gId) ?? [];
      current.push(eId);
      eventMap.set(gId, current);
    }
  }

  return eventMap;
}

export const GET = authRoute<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  const client = db();
  const url = new URL(req.url);
  const pageParam = url.searchParams.get("page");

  // Không có `page` => giữ hành vi cũ (trả toàn bộ), dùng cho màn hình khác.
  if (!pageParam) {
    const rows = await fetchAllRows<GuestRow>((from, to) =>
      client
        .from("guests")
        .select("*")
        .eq("wedding_id", wedding.id)
        .order("created_at", { ascending: false })
        .range(from, to),
    );
    const eventMap = await loadEventMap(client, rows);
    return json(rows.map((row) => toGuest(row, eventMap.get(row.id) ?? [])));
  }

  const page = Math.max(1, parseInt(pageParam, 10) || 1);
  const pageSize = Math.min(
    200,
    Math.max(10, parseInt(url.searchParams.get("pageSize") || "50", 10) || 50),
  );
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
  const statusRaw = url.searchParams.get("status") ?? "";
  const status = ["pending", "accepted", "declined"].includes(statusRaw)
    ? statusRaw
    : "";

  let query = client
    .from("guests")
    .select("*", { count: "exact" })
    .eq("wedding_id", wedding.id)
    .order("created_at", { ascending: false });

  if (q) query = query.ilike("name", `%${q}%`);
  if (status) query = query.eq("status", status);

  const from = (page - 1) * pageSize;
  const { data, count, error } = await query.range(from, from + pageSize - 1);
  if (error) throw error;

  const rows = (data ?? []) as GuestRow[];
  const eventMap = await loadEventMap(client, rows);
  const total = count ?? 0;

  return json({
    items: rows.map((row) => toGuest(row, eventMap.get(row.id) ?? [])),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
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

  const insertData: Record<string, unknown> = {
    wedding_id: wedding.id,
    name,
  };

  if (body?.relationshipGroup !== undefined) {
    const value = body.relationshipGroup;
    if (
      value !== null &&
      value !== "elder" &&
      value !== "peer_formal" &&
      value !== "close_friend" &&
      value !== "family"
    ) {
      return fail("Nhóm vai vế không hợp lệ.");
    }
    insertData.relationship_group = value;
  }

  if (body?.customPronounHost !== undefined) {
    insertData.custom_pronoun_host = text(body.customPronounHost, 60);
  }
  if (body?.customPronounGuest !== undefined) {
    insertData.custom_pronoun_guest = text(body.customPronounGuest, 60);
  }
  if (body?.tableNumber !== undefined) {
    const rawTable = text(body.tableNumber, 40);
    if (rawTable !== null && wedding.plan !== "vip") {
      return fail("Tính năng xếp bàn và thẻ check-in chỉ khả dụng trên gói VIP.", 403);
    }
    insertData.table_number = rawTable;
  }
  if (body?.dietaryPreference !== undefined) {
    const value = body.dietaryPreference;
    if (value !== null && value !== "standard" && value !== "vegetarian") {
      return fail("Chế độ ăn không hợp lệ.");
    }
    insertData.dietary_preference = value;
    insertData.diet = value === "vegetarian" ? "veg" : value === "standard" ? "meat" : null;
  }

  const { data, error } = await client
    .from("guests")
    .insert(insertData)
    .select("*")
    .single();

  if (error) {
    const code = (error as { code?: string }).code ?? "";
    if (code === "42703" || code === "PGRST204") {
      const fallbackInsert: Record<string, unknown> = {
        wedding_id: wedding.id,
        name,
      };
      if (insertData.diet !== undefined) fallbackInsert.diet = insertData.diet;
      const { data: fallbackData, error: fallbackError } = await client
        .from("guests")
        .insert(fallbackInsert)
        .select("*")
        .single();
      if (fallbackError) throw fallbackError;
      return json(toGuest(fallbackData as GuestRow, []), 201);
    }
    throw error;
  }
  return json(toGuest(data as GuestRow, []), 201);
});
