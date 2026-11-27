import { getPinnedDesignerTemplate } from "./designer";
import { SLUG_RE } from "./http";
import { db } from "./supabase";
import { normalizeWeddingContent } from "../wedding-data";
import { validateWeddingSlug } from "../wedding-slug";
import { emptyGiftInfo } from "../wedding-types";
import type {
  GuestDiet,
  GuestStatus,
  WeddingContent,
  WeddingEvent,
  WeddingPhoto,
  WeddingPlan,
} from "../types";
import { getGuestVisibleEvents, isWeddingSuspendedRow, listWeddingEvents, listWeddingPhotos } from "./weddings";

interface PublicWeddingRow {
  id: string;
  slug: string;
  template_id: string;
  plan: string | null;
  content: unknown;
  suspended?: boolean | null;
  designer_template_id?: string | null;
  designer_template_version?: number | null;
}

const PUBLIC_WEDDING_SELECTS = [
  "id, slug, template_id, plan, content, suspended, designer_template_id, designer_template_version",
  "id, slug, template_id, plan, content, suspended",
  "id, slug, template_id, plan, content",
] as const;

interface MaybeSingleResult {
  data: unknown;
  error: unknown;
}

/**
 * Đọc thiệp theo thứ tự cột giàu → nghèo để vẫn chạy trên DB chưa có
 * `suspended` (v10) hoặc cột designer (v15).
 */
async function loadWeddingRow(
  query: (columns: string) => PromiseLike<MaybeSingleResult>,
): Promise<PublicWeddingRow | null> {
  let lastError: unknown = null;
  for (const columns of PUBLIC_WEDDING_SELECTS) {
    const { data, error } = await query(columns);
    if (!error) return (data as PublicWeddingRow | null) ?? null;
    lastError = error;
    if (!isMissingOptionalColumn(error)) throw error;
  }
  throw lastError;
}

function isMissingOptionalColumn(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: unknown; message?: unknown };
  const code = typeof err.code === "string" ? err.code : "";
  const message = typeof err.message === "string" ? err.message : "";
  return (
    code === "42703" ||
    code === "PGRST204" ||
    /column .* does not exist|schema cache/i.test(message)
  );
}

const GUEST_BASE_COLUMNS = "id, wedding_id, name";
const GUEST_SALUTATION_COLUMNS =
  `${GUEST_BASE_COLUMNS}, relationship_group, custom_pronoun_host, custom_pronoun_guest`;
const GUEST_FULL_COLUMNS =
  `${GUEST_SALUTATION_COLUMNS}, status, plus_ones, diet, song_request, ride_needed, view_count`;

interface GuestLookupRow {
  id: string;
  wedding_id: string;
  name: string;
  relationship_group?: string | null;
  custom_pronoun_host?: string | null;
  custom_pronoun_guest?: string | null;
  status?: GuestStatus | null;
  plus_ones?: number | null;
  diet?: GuestDiet | null;
  song_request?: string | null;
  ride_needed?: boolean | null;
  view_count?: number | null;
}

const RELATIONSHIP_GROUPS = [
  "elder",
  "peer_formal",
  "close_friend",
  "family",
] as const;

type RelationshipGroup = (typeof RELATIONSHIP_GROUPS)[number];

function toRelationshipGroup(value: unknown): RelationshipGroup | null {
  return RELATIONSHIP_GROUPS.find((group) => group === value) ?? null;
}

async function loadGuestRow(
  query: (columns: string) => PromiseLike<MaybeSingleResult>,
): Promise<GuestLookupRow | null> {
  for (const columns of [
    GUEST_FULL_COLUMNS,
    GUEST_SALUTATION_COLUMNS,
    GUEST_BASE_COLUMNS,
  ]) {
    const { data, error } = await query(columns);
    if (!error) return (data as GuestLookupRow | null) ?? null;
    if (columns === GUEST_BASE_COLUMNS || !isMissingOptionalColumn(error)) {
      throw error;
    }
  }
  return null;
}

/** Layout JSON của đúng version đã ghim (không tự lấy bản mới nhất). */
export interface PublicDesignerTemplateData {
  id: string;
  version: number;
  canvas: Record<string, unknown>;
}

export interface PublicWeddingData {
  slug: string;
  templateId: string;
  plan: WeddingPlan;
  content: WeddingContent;
  events: WeddingEvent[];
  photos: WeddingPhoto[];
  /**
   * Thiệp có mẫu designer đã ghim thì trường này có dữ liệu; `null` để
   * trang thiệp dùng template code như trước.
   */
  designerTemplate: PublicDesignerTemplateData | null;
}

export interface PublicGuestSalutationData {
  relationshipGroup: RelationshipGroup | null;
  customPronounHost: string | null;
  customPronounGuest: string | null;
}

export interface PublicGuestWeddingData extends PublicWeddingData {
  guestId: string;
  guestName: string;
  guestSalutation: PublicGuestSalutationData;
  rsvpStatus: GuestStatus;
  plusOnes: number;
  diet: GuestDiet | null;
  songRequest: string | null;
  rideNeeded: boolean;
  viewCount: number;
}

async function loadDesignerTemplate(
  row: PublicWeddingRow,
): Promise<PublicDesignerTemplateData | null> {
  const pinned = await getPinnedDesignerTemplate({
    designerTemplateId: row.designer_template_id,
    designerTemplateVersion: row.designer_template_version,
  });
  if (!pinned) return null;
  return { id: pinned.id, version: pinned.version, canvas: pinned.canvas };
}

function filterPublicPhotos(
  allPhotos: WeddingPhoto[],
  rawContent: unknown,
  plan: WeddingPlan,
): WeddingPhoto[] {
  const normalized = normalizeWeddingContent(rawContent);
  const isGiftHidden =
    Array.isArray(normalized.hiddenSections) &&
    normalized.hiddenSections.includes("gift");
  const moderation = normalized.photoModeration ?? {};
  const isAutoApprove = normalized.photoApprovalMode === "auto";

  return allPhotos.filter((photo) => {
    if (isGiftHidden && photo.kind === "gift") return false;
    if (photo.kind !== "album") return true;

    // Gói Standard (pro): ảnh album do cô dâu chú rể tự tải lên cho khách xem (chỉ ẩn nếu đánh dấu hidden)
    if (plan === "pro") {
      return moderation[photo.id] !== "hidden";
    }
    // Gói Pro 399k (vip): tôn trọng nghiêm ngặt chế độ duyệt ảnh (manual/auto)
    if (plan === "vip") {
      const status = moderation[photo.id];
      return isAutoApprove ? status !== "hidden" : status === "approved";
    }
    return false;
  });
}

function sanitizePublicContent(rawContent: unknown): WeddingContent {
  const content = normalizeWeddingContent(rawContent);
  const isGiftHidden =
    Array.isArray(content.hiddenSections) &&
    content.hiddenSections.includes("gift");
  if (isGiftHidden) {
    content.gift = emptyGiftInfo();
  }
  const rec = content as Record<string, unknown>;
  delete rec.sharePin;
  delete rec.sharePinEnabled;
  delete rec.sharePinFailCount;
  delete rec.sharePinLockedUntil;
  delete rec.photoModeration;
  delete rec.suspended;
  return content;
}

export async function getPublicWeddingBySlug(
  slug: string,
  options?: { includeDesignerTemplate?: boolean },
): Promise<PublicWeddingData | null> {
  const slugCheck = validateWeddingSlug(slug);
  if (!slugCheck.valid) return null;

  const client = db();
  const row = await loadWeddingRow((columns) =>
    client
      .from("weddings")
      .select(columns)
      .eq("slug", slugCheck.slug)
      .maybeSingle(),
  );

  if (!row) return null;
  // Thiệp bị ops tạm khoá thì coi như không tồn tại với khách.
  if (isWeddingSuspendedRow(row)) return null;

  const includeDesigner = options?.includeDesignerTemplate !== false;

  const [events, photos, designerTemplate] = await Promise.all([
    listWeddingEvents(row.id),
    listWeddingPhotos(row.id),
    includeDesigner ? loadDesignerTemplate(row) : Promise.resolve(null),
  ]);

  const plan = (row.plan as WeddingPlan) ?? "free";
  return {
    slug: row.slug,
    templateId: row.template_id,
    plan,
    content: sanitizePublicContent(row.content),
    events,
    photos: filterPublicPhotos(photos, row.content, plan),
    designerTemplate,
  };
}

export async function getPublicWeddingByGuestSlug(
  guestSlug: string,
): Promise<PublicGuestWeddingData | null> {
  if (!SLUG_RE.test(guestSlug)) return null;

  const client = db();
  const guest = await loadGuestRow((columns) =>
    client
      .from("guests")
      .select(columns)
      .eq("slug", guestSlug)
      .maybeSingle(),
  );

  if (!guest?.wedding_id) return null;

  const wedding = await loadWeddingRow((columns) =>
    client
      .from("weddings")
      .select(columns)
      .eq("id", guest.wedding_id)
      .maybeSingle(),
  );

  if (!wedding) return null;
  if (isWeddingSuspendedRow(wedding)) return null;

  const [events, photos, designerTemplate] = await Promise.all([
    getGuestVisibleEvents(wedding.id, guest.id),
    listWeddingPhotos(wedding.id),
    loadDesignerTemplate(wedding),
  ]);

  const plan = (wedding.plan as WeddingPlan) ?? "free";
  return {
    slug: wedding.slug,
    templateId: wedding.template_id,
    plan,
    content: sanitizePublicContent(wedding.content),
    events,
    photos: filterPublicPhotos(photos, wedding.content, plan),
    designerTemplate,
    guestId: guest.id,
    guestName: guest.name,
    guestSalutation: {
      relationshipGroup: toRelationshipGroup(guest.relationship_group),
      customPronounHost: guest.custom_pronoun_host ?? null,
      customPronounGuest: guest.custom_pronoun_guest ?? null,
    },
    rsvpStatus: (guest.status as GuestStatus) ?? "pending",
    plusOnes: typeof guest.plus_ones === "number" ? Math.max(0, guest.plus_ones) : 0,
    diet: (guest.diet as GuestDiet) ?? null,
    songRequest: guest.song_request ?? null,
    rideNeeded: Boolean(guest.ride_needed),
    viewCount: typeof guest.view_count === "number" ? guest.view_count : 0,
  };
}
