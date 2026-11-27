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
  /** Mẫu thiết kế (designer) được gán; `templateId` vẫn là fallback. */
  designerTemplateId: string | null;
  /** Version đã ghim lúc gán — không tự đổi khi designer publish bản mới. */
  designerTemplateVersion: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface WeddingDetail extends Wedding {
  events: WeddingEvent[];
  photos: WeddingPhoto[];
  designerTemplate?: WeddingDesignerTemplateInfo | null;
  /** Canvas mới nhất để dashboard biết field ảnh khách cần điền. */
  designerCanvas?: Record<string, unknown> | null;
  ledToken?: string;
}

export type DesignerTemplateStatus = "draft" | "review" | "published" | "archived";

/** Một mẫu designer đã publish, dùng cho danh sách trong dashboard. */
export interface DesignerTemplateOption {
  id: string;
  name: string;
  /** Tên khách hàng thấy khi chọn mẫu; null thì dùng `name`. */
  displayTitle: string | null;
  plan: WeddingPlan;
  ritual: string | null;
  version: number;
  coverUrl: string | null;
}

/** Thông tin mẫu designer đang gán cho một thiệp. */
export interface WeddingDesignerTemplateInfo {
  id: string;
  name: string;
  displayTitle: string | null;
  /** Version đang ghim; `null` khi dữ liệu cũ chưa có version. */
  pinnedVersion: number | null;
  latestVersion: number;
  status: DesignerTemplateStatus;
}

export interface DesignerTemplateAssignmentResult {
  wedding: Wedding;
  designerTemplate: WeddingDesignerTemplateInfo | null;
}

export type RelationshipGroup = "elder" | "peer_formal" | "close_friend" | "family";
export type DietaryPreference = "standard" | "vegetarian";

export interface Guest {
  id: string;
  weddingId?: string;
  name: string;
  slug: string;
  status: GuestStatus;
  plusOnes?: number;
  diet?: GuestDiet | null;
  songRequest?: string | null;
  rideNeeded?: boolean;
  relationshipGroup?: RelationshipGroup | null;
  customPronounHost?: string | null;
  customPronounGuest?: string | null;
  tableNumber?: string | null;
  dietaryPreference?: DietaryPreference | null;
  checkedInAt?: string | null;
  checkedInCount?: number | null;
  respondedAt: string | null;
  createdAt: string;
  eventIds?: string[];
}

export type GiftMethod = "cash" | "bank" | "other";

export interface Gift {
  id: string;
  giverName: string;
  amountVnd: number;
  method: GiftMethod;
  note: string | null;
  guestId: string | null;
  thankedAt: string | null;
  createdAt: string;
}

export interface GiftTotals {
  totalVnd: number;
  count: number;
  unthankedCount: number;
}

export interface Wish {
  id: string;
  weddingId?: string;
  guestId: string | null;
  name: string;
  message: string;
  createdAt: string;
  /** Đã được chủ thiệp duyệt để hiện lên thiệp chưa. */
  approved?: boolean;
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
  songRequest?: string | null;
  rideNeeded?: boolean;
  tableNumber?: string | null;
  relationshipGroup?: RelationshipGroup | null;
  customPronounHost?: string | null;
  customPronounGuest?: string | null;
  dietaryPreference?: DietaryPreference | null;
  events?: WeddingEvent[];
}

export type PaidPlan = "pro" | "vip";

export interface CreateOrderInput {
  weddingId: string;
  plan: PaidPlan;
}

export interface OrderBankInfo {
  name: string;
  accountNo: string;
  accountName: string;
}

export interface CreatedOrder {
  id: string;
  code: string;
  plan: PaidPlan;
  amountVnd: number;
  bank: OrderBankInfo;
  transferContent: string;
  qrPayload: string;
}

export type OrderStatus = "pending" | "paid" | "cancelled";

export interface OrderStatusResponse {
  id: string;
  code: string;
  plan: PaidPlan;
  status: OrderStatus;
  paidAt: string | null;
}

export interface CreatePayosOrderInput {
  weddingId: string;
  plan: PaidPlan;
}

export interface PayosOrderResponse {
  orderId: string;
  orderCode: number;
  amount: number;
  checkoutUrl: string;
  qrCode: string;
  accountName: string;
  accountNumber: string;
  bin: string;
  description: string;
}

