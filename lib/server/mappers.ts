import type {
  Guest,
  GuestStatus,
  PhotoKind,
  Wedding,
  WeddingEvent,
  WeddingPhoto,
  WeddingPlan,
  Wish,
} from "../types";
import { normalizeWeddingContent } from "../wedding-data";
import { toIsoPlus07 } from "../wedding-types";
import { buildMediaUrl } from "./storage";

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

export interface EventRow {
  id: string;
  wedding_id: string;
  title: string;
  starts_at: string;
  lunar_date: string | null;
  venue_name: string;
  venue_address: string;
  map_embed_url: string | null;
  map_directions_url: string | null;
  position: number;
  created_at: string;
}

export interface PhotoRow {
  id: string;
  wedding_id: string;
  kind: PhotoKind;
  storage_key: string;
  position: number;
  created_at: string;
}

export function toWedding(row: WeddingRow): Wedding {
  return {
    id: row.id,
    ownerId: row.owner_id,
    slug: row.slug,
    templateId: row.template_id,
    plan: row.plan,
    content: normalizeWeddingContent(row.content),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toGuest(row: GuestRow, eventIds?: string[]): Guest {
  return {
    id: row.id,
    weddingId: row.wedding_id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    respondedAt: row.responded_at,
    createdAt: row.created_at,
    ...(eventIds !== undefined ? { eventIds } : {}),
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

export function toEvent(row: EventRow): WeddingEvent {
  return {
    id: row.id,
    title: row.title,
    startsAt: toIsoPlus07(row.starts_at) || row.starts_at,
    lunarDate: row.lunar_date ?? "",
    venueName: row.venue_name,
    venueAddress: row.venue_address,
    mapEmbedUrl: row.map_embed_url ?? null,
    mapDirectionsUrl: row.map_directions_url ?? null,
    position: row.position,
  };
}

export function toPhoto(row: PhotoRow): WeddingPhoto {
  return {
    id: row.id,
    kind: row.kind,
    url: buildMediaUrl(row.storage_key),
    position: row.position,
  };
}
