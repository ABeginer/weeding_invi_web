import type { Guest, GuestStatus, Wedding, WeddingPlan, Wish } from "../types";
import { mergeWeddingContent } from "../wedding-content";

export interface WeddingRow {
  id: string;
  owner_id: string;
  slug: string;
  template_id: string;
  plan: WeddingPlan;
  content: unknown;
  created_at: string;
  updated_at: string;
}

export interface GuestRow {
  id: string;
  wedding_id: string;
  name: string;
  slug: string;
  status: GuestStatus;
  responded_at: string | null;
  created_at: string;
}

export interface WishRow {
  id: string;
  wedding_id: string;
  guest_id: string | null;
  name: string;
  message: string;
  created_at: string;
}

export function toWedding(row: WeddingRow): Wedding {
  return {
    id: row.id,
    ownerId: row.owner_id,
    slug: row.slug,
    templateId: row.template_id,
    plan: row.plan,
    content: mergeWeddingContent(row.content),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toGuest(row: GuestRow): Guest {
  return {
    id: row.id,
    weddingId: row.wedding_id,
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
    weddingId: row.wedding_id,
    guestId: row.guest_id,
    name: row.name,
    message: row.message,
    createdAt: row.created_at,
  };
}
