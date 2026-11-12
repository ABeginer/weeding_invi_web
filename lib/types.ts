export type {
  PhotoKind,
  PhotoSlot,
  TemplateData,
  TemplateMode,
  TemplatePhotoItem,
  WeddingContent,
  WeddingEvent,
  WeddingPhoto,
  WeddingPlan,
} from "./wedding-types";

export {
  EVENT_ADDRESS_MAX_LENGTH,
  EVENT_LUNAR_MAX_LENGTH,
  EVENT_TITLE_MAX_LENGTH,
  EVENT_URL_MAX_LENGTH,
  EVENT_VENUE_MAX_LENGTH,
  extractMapEmbedSrc,
  guestEventsInputSchema,
  isValidHttpsUrl,
  isValidIsoPlus07,
  NAME_MAX_LENGTH,
  QUOTE_MAX_LENGTH,
  reorderPositionsSchema,
  toIsoPlus07,
  weddingContentInputSchema,
  weddingContentPatchSchema,
  weddingEventInputSchema,
} from "./wedding-types";

import type {
  WeddingContent,
  WeddingEvent,
  WeddingPhoto,
  WeddingPlan,
} from "./wedding-types";

export type GuestStatus = "pending" | "accepted" | "declined";

export interface UserProfile {
  id: string;
  email: string | null;
  createdAt?: string;
}

export interface Wedding {
  id: string;
  ownerId: string;
  slug: string;
  templateId: string;
  plan: WeddingPlan;
  content: WeddingContent;
  createdAt: string;
  updatedAt: string;
}

export interface WeddingDetail extends Wedding {
  events: WeddingEvent[];
  photos: WeddingPhoto[];
}

export interface Guest {
  id: string;
  weddingId?: string;
  name: string;
  slug: string;
  status: GuestStatus;
  respondedAt: string | null;
  createdAt: string;
  eventIds?: string[];
}

export interface Wish {
  id: string;
  weddingId?: string;
  guestId: string | null;
  name: string;
  message: string;
  createdAt: string;
}

export interface EventGuestCount {
  eventId: string;
  title: string;
  assignedCount: number;
  visibleGuestCount: number;
}

export interface Stats {
  total: number;
  accepted: number;
  declined: number;
  pending: number;
  wishes: number;
  unassignedCount?: number;
  eventCounts?: EventGuestCount[];
}

export interface PublicWeddingPayload {
  slug: string;
  templateId: string;
  content: WeddingContent;
  events: WeddingEvent[];
  photos: WeddingPhoto[];
}

export interface InviteResponse {
  name: string;
  status: GuestStatus;
  events?: WeddingEvent[];
}
