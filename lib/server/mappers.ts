import type {
  Gift,
  GiftMethod,
  Guest,
  GuestDiet,
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
  /** Có từ migration_v17; DB cũ hơn sẽ không trả về. */
  groom_name_changes?: number | null;
  bride_name_changes?: number | null;
  names_locked_at?: string | null;
  /** Có từ migration_v15; DB cũ hơn sẽ không trả về hai cột này. */
  designer_template_id?: string | null;
  designer_template_version?: number | null;
  created_at: string;
  updated_at: string;
}

export interface GuestRow {
  id: string;
  wedding_id: string;
  name: string;
  slug: string;
  status: GuestStatus;
  plus_ones?: number | null;
  diet?: GuestDiet | null;
  song_request?: string | null;
  ride_needed?: boolean | null;
  relationship_group?: string | null;
  custom_pronoun_host?: string | null;
  custom_pronoun_guest?: string | null;
  table_number?: string | null;
  dietary_preference?: string | null;
  checked_in_at?: string | null;
  checked_in_count?: number | null;
  responded_at: string | null;
  created_at: string;
}

export interface WishRow {
  id: string;
  wedding_id: string;
  guest_id: string | null;
  author_key?: string | null;
  name: string;
  message: string;
  approved?: boolean | null;
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

export interface GiftRow {
  id: string;
  wedding_id: string;
  guest_id: string | null;
  giver_name: string;
  amount_vnd: number | string;
  method: GiftMethod;
  note: string | null;
  thanked_at: string | null;
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
    designerTemplateId: row.designer_template_id ?? null,
    designerTemplateVersion:
      typeof row.designer_template_version === "number"
        ? row.designer_template_version
        : null,
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
    plusOnes:
      typeof row.plus_ones === "number" && Number.isFinite(row.plus_ones)
        ? Math.max(0, row.plus_ones)
        : 0,
    diet: row.diet === "meat" || row.diet === "veg" ? row.diet : null,
    songRequest:
      typeof row.song_request === "string" && row.song_request.trim()
        ? row.song_request
        : null,
    rideNeeded: row.ride_needed === true,
    relationshipGroup:
      row.relationship_group === "elder" ||
      row.relationship_group === "peer_formal" ||
      row.relationship_group === "close_friend" ||
      row.relationship_group === "family"
        ? row.relationship_group
        : null,
    customPronounHost: row.custom_pronoun_host ?? null,
    customPronounGuest: row.custom_pronoun_guest ?? null,
    tableNumber: row.table_number ?? null,
    dietaryPreference:
      row.dietary_preference === "vegetarian" ||
      row.dietary_preference === "standard"
        ? row.dietary_preference
        : null,
    checkedInAt: row.checked_in_at ?? null,
    checkedInCount:
      typeof row.checked_in_count === "number" && Number.isFinite(row.checked_in_count)
        ? row.checked_in_count
        : null,
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
    approved: row.approved === true,
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

export function toGift(row: GiftRow): Gift {
  return {
    id: row.id,
    giverName: row.giver_name,
    amountVnd: Number(row.amount_vnd) || 0,
    method: row.method,
    note: row.note,
    guestId: row.guest_id,
    thankedAt: row.thanked_at,
    createdAt: row.created_at,
  };
}
