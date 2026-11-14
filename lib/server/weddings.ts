import type { AuthUser } from "./auth";
import { UUID_RE } from "./http";
import {
  toEvent,
  toPhoto,
  type EventRow,
  type PhotoRow,
  type WeddingRow,
} from "./mappers";
import { db } from "./supabase";
import type { WeddingEvent, WeddingPhoto } from "../types";

export async function ensureUserRecord(user: AuthUser): Promise<void> {
  const { error } = await db()
    .from("users")
    .upsert({ id: user.id, email: user.email }, { onConflict: "id" });

  if (error) throw error;
}

export async function getOwnedWedding(
  weddingId: string,
  ownerId: string,
): Promise<WeddingRow | null> {
  if (!UUID_RE.test(weddingId)) return null;

  const { data, error } = await db()
    .from("weddings")
    .select("*")
    .eq("id", weddingId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) throw error;
  return (data as WeddingRow | null) ?? null;
}

export async function listWeddingEvents(
  weddingId: string,
): Promise<WeddingEvent[]> {
  const { data, error } = await db()
    .from("events")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as EventRow[]).map(toEvent);
}

export async function listWeddingPhotos(
  weddingId: string,
): Promise<WeddingPhoto[]> {
  const { data, error } = await db()
    .from("photos")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as PhotoRow[]).map(toPhoto);
}

/**
 * Quy tắc hiển thị lễ cho khách:
 * - Nếu khách không có dòng nào trong `guest_events` => thấy TẤT CẢ lễ của thiệp.
 * - Nếu có >= 1 dòng => chỉ thấy các lễ được gán.
 */
export async function getGuestVisibleEvents(
  weddingId: string,
  guestId: string,
): Promise<WeddingEvent[]> {
  const client = db();
  const [allEvents, assignmentsRes] = await Promise.all([
    listWeddingEvents(weddingId),
    client
      .from("guest_events")
      .select("event_id")
      .eq("guest_id", guestId),
  ]);

  if (assignmentsRes.error) throw assignmentsRes.error;
  const assignedIds = new Set(
    (assignmentsRes.data ?? []).map((row) => String(row.event_id)),
  );

  if (assignedIds.size === 0) {
    return allEvents;
  }

  return allEvents.filter((evt) => assignedIds.has(evt.id));
}

interface SuspensionRow {
  suspended?: boolean | null;
  content?: unknown;
}

/**
 * `weddings.suspended` được thêm ở migration_v10; nếu DB chưa chạy migration
 * thì cờ được đọc từ `content.suspended` (ops ghi cả hai nơi).
 */
export function isMissingSuspendedColumn(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: unknown; message?: unknown };
  const code = typeof err.code === "string" ? err.code : "";
  const message = typeof err.message === "string" ? err.message : "";
  return code === "42703" || code === "PGRST204" || /\bsuspended\b/i.test(message);
}

export function isWeddingSuspendedRow(
  row: SuspensionRow | null | undefined,
): boolean {
  if (!row) return false;
  if (row.suspended === true) return true;
  const content = row.content;
  return Boolean(
    content &&
      typeof content === "object" &&
      (content as { suspended?: unknown }).suspended === true,
  );
}

export async function isWeddingSuspended(weddingId: string): Promise<boolean> {
  const client = db();
  const { data, error } = await client
    .from("weddings")
    .select("suspended, content")
    .eq("id", weddingId)
    .maybeSingle();

  if (error) {
    if (!isMissingSuspendedColumn(error)) throw error;
    const fallback = await client
      .from("weddings")
      .select("content")
      .eq("id", weddingId)
      .maybeSingle();
    if (fallback.error) throw fallback.error;
    return isWeddingSuspendedRow(fallback.data as SuspensionRow | null);
  }

  return isWeddingSuspendedRow(data as SuspensionRow | null);
}
