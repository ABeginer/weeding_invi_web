import type { Guest, GuestStatus, Wish } from "../types";

export interface GuestRow {
  id: string;
  name: string;
  slug: string;
  status: GuestStatus;
  responded_at: string | null;
  created_at: string;
}

export interface WishRow {
  id: string;
  guest_id: string | null;
  name: string;
  message: string;
  created_at: string;
}

export function toGuest(row: GuestRow): Guest {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    respondedAt: row.responded_at,
    createdAt: row.created_at,
  };
}

export function toWish(row: WishRow): Wish {
  return {
    id: row.id,
    guestId: row.guest_id,
    name: row.name,
    message: row.message,
    createdAt: row.created_at,
  };
}
