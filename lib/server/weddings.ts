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
