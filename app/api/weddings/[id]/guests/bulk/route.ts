import { getGuestLimitMessage, getPlanLimits } from "@/config/plans";
import { authRoute, fail, json, readBody, text, UUID_RE } from "@/lib/server/http";
import { toGuest, type GuestRow } from "@/lib/server/mappers";
import { db } from "@/lib/server/supabase";
import { getOwnedWedding } from "@/lib/server/weddings";

type Ctx = { params: Promise<{ id: string }> };

export const POST = authRoute<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  const body = await readBody(req);

  type ParsedInputItem = {
    name: string;
    relationshipGroup: string | null;
    tableNumber: string | null;
  };

  let items: ParsedInputItem[] = [];

  if (Array.isArray(body?.items)) {
    const parsedList: ParsedInputItem[] = [];
    for (const raw of body.items as unknown[]) {
      if (!raw || typeof raw !== "object") continue;
      const item = raw as Record<string, unknown>;
      const name = text(item.name, 100);
      if (!name) continue;
      const relationshipGroup =
        typeof item.relationshipGroup === "string"
          ? text(item.relationshipGroup, 50)
          : null;
      const tableNumber =
        typeof item.tableNumber === "string"
          ? text(item.tableNumber, 50)
          : null;
      parsedList.push({ name, relationshipGroup, tableNumber });
    }
    items = parsedList;
  } else if (Array.isArray(body?.names)) {
    items = (body.names as unknown[])
      .map((value) => text(value, 100))
      .filter((value): value is string => value !== null)
      .map((name) => ({ name, relationshipGroup: null, tableNumber: null }));
  } else {
    return fail("Danh sách khách không hợp lệ.");
  }

  if (items.length === 0) return fail("Danh sách khách trống.");
  if (items.length > 500) return fail("Tối đa 500 khách mỗi lần nhập.");

  const client = db();
  const { count, error: countError } = await client
    .from("guests")
    .select("id", { count: "exact", head: true })
    .eq("wedding_id", wedding.id);

  if (countError) throw countError;
  const currentCount = count ?? 0;

  const maxGuests = getPlanLimits(wedding.plan).guests;
  if (maxGuests !== null && currentCount + items.length > maxGuests) {
    const remaining = Math.max(0, maxGuests - currentCount);
    return fail(getGuestLimitMessage(wedding.plan, remaining), 403);
  }

  const rowsToInsert = items.map((item) => ({
    wedding_id: wedding.id,
    name: item.name,
    ...(item.relationshipGroup ? { relationship_group: item.relationshipGroup } : {}),
    ...(wedding.plan === "vip" && item.tableNumber ? { table_number: item.tableNumber } : {}),
  }));

  const { data, error } = await client
    .from("guests")
    .insert(rowsToInsert)
    .select("*");

  if (error) throw error;
  const createdRows = (data ?? []) as GuestRow[];

  // Gán events nếu có — xác minh eventIds thuộc đúng thiệp hiện tại (chống IDOR xuyên tenant)
  const requestedEventIds = Array.isArray(body?.eventIds)
    ? Array.from(
        new Set(
          (body.eventIds as unknown[])
            .map((e) => (typeof e === "string" ? e.trim() : ""))
            .filter((e) => UUID_RE.test(e)),
        ),
      )
    : [];

  let validEventIds: string[] = [];
  if (requestedEventIds.length > 0 && createdRows.length > 0) {
    const { data: ownedEvents, error: eventsError } = await client
      .from("events")
      .select("id")
      .eq("wedding_id", wedding.id)
      .in("id", requestedEventIds);
    if (eventsError) throw eventsError;

    validEventIds = (ownedEvents ?? []).map((row) => String(row.id));
    if (validEventIds.length > 0) {
      const eventRows = createdRows.flatMap((g) =>
        validEventIds.map((eId) => ({ guest_id: g.id, event_id: eId })),
      );
      await client.from("guest_events").insert(eventRows);
    }
  }

  return json(createdRows.map((row) => toGuest(row, validEventIds)), 201);
});

/** Xóa nhiều khách trong một lần — dùng cho thanh thao tác hàng loạt. */
export const DELETE = authRoute<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  const body = await readBody(req);
  if (!Array.isArray(body?.ids)) return fail("Danh sách khách không hợp lệ.");

  const ids = Array.from(
    new Set(
      (body.ids as unknown[])
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => UUID_RE.test(value)),
    ),
  );

  if (ids.length === 0) return fail("Danh sách khách không hợp lệ.");
  if (ids.length > 500) return fail("Tối đa 500 khách mỗi lần xóa.");

  const { error } = await db()
    .from("guests")
    .delete()
    .eq("wedding_id", wedding.id)
    .in("id", ids);

  if (error) throw error;
  return json({ deleted: ids.length });
});

/** Cập nhật hàng loạt (ví dụ: gán số bàn) — dùng cho thanh thao tác hàng loạt. */
export const PATCH = authRoute<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  const body = await readBody(req);
  if (!Array.isArray(body?.ids)) return fail("Danh sách khách không hợp lệ.");

  const ids = Array.from(
    new Set(
      (body.ids as unknown[])
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => UUID_RE.test(value)),
    ),
  );

  if (ids.length === 0) return fail("Danh sách khách không hợp lệ.");
  if (ids.length > 500) return fail("Tối đa 500 khách mỗi lần cập nhật.");

  const patch: Record<string, unknown> = {};
  if (body?.tableNumber !== undefined) {
    const rawTable =
      typeof body.tableNumber === "string" && body.tableNumber.trim()
        ? text(body.tableNumber, 50)
        : null;
    if (rawTable !== null && wedding.plan !== "vip") {
      return fail("Tính năng xếp bàn và thẻ check-in chỉ khả dụng trên gói VIP.", 403);
    }
    patch.table_number = rawTable;
  }

  if (Object.keys(patch).length === 0) {
    return fail("Không có dữ liệu cần cập nhật.");
  }

  const { error } = await db()
    .from("guests")
    .update(patch)
    .eq("wedding_id", wedding.id)
    .in("id", ids);

  if (error) throw error;
  return json({ updated: ids.length, tableNumber: patch.table_number ?? null });
});
