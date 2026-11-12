export type {
  PhotoKind,
  PhotoSlot,
  TemplateData,
  TemplateMode,
  TemplatePhotoItem,
  WeddingContent,
  WeddingEvent,
  WeddingGiftInfo,
  WeddingPhoto,
  WeddingPlan,
} from "./wedding-types";

export {
  emptyGiftInfo,
  EVENT_ADDRESS_MAX_LENGTH,
  EVENT_LUNAR_MAX_LENGTH,
  EVENT_TITLE_MAX_LENGTH,
  EVENT_URL_MAX_LENGTH,
  EVENT_VENUE_MAX_LENGTH,
  extractMapEmbedSrc,
  GIFT_ACCOUNT_MAX_LENGTH,
  GIFT_TEXT_MAX_LENGTH,
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
  weddingGiftInputSchema,
} from "./wedding-types";

import type { BrandThemeMode } from "./brand-theme";
import type {
  WeddingContent,
  WeddingEvent,
  WeddingPhoto,
  WeddingPlan,
} from "./wedding-types";

export type GuestStatus = "pending" | "accepted" | "declined";
export type GuestDiet = "meat" | "veg";

export interface UserProfile {
  id: string;
  email: string | null;
  theme?: BrandThemeMode;
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
  plusOnes?: number;
  diet?: GuestDiet | null;
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
  acceptedHeadcount?: number;
  meatCount?: number;
  vegCount?: number;
  unassignedCount?: number;
  eventCounts?: EventGuestCount[];
}

export interface PublicWeddingPayload {
  slug: string;
  templateId: string;
  plan?: WeddingPlan;
  content: WeddingContent;
  events: WeddingEvent[];
  photos: WeddingPhoto[];
}

export interface InviteResponse {
  name: string;
  status: GuestStatus;
  plusOnes?: number;
  diet?: GuestDiet | null;
  events?: WeddingEvent[];
}
