import { formatWeddingDateParts } from "./utils";
import {
  emptyGiftInfo,
  GIFT_ACCOUNT_MAX_LENGTH,
  GIFT_TEXT_MAX_LENGTH,
  NAME_MAX_LENGTH,
  QUOTE_MAX_LENGTH,
  toIsoPlus07,
  type TemplateData,
  type WeddingContent,
  type WeddingEvent,
  type WeddingGiftInfo,
  type WeddingPhoto,
  type WeddingPlan,
} from "./wedding-types";

const DEFAULT_ISO_DATE = "2027-01-01T10:00:00+07:00";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function clampString(value: unknown, max: number, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  return value.trim().slice(0, max);
}

function nullableUuid(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    trimmed,
  )
    ? trimmed
    : null;
}

function normalizeGiftInfo(rawGift: unknown): WeddingGiftInfo {
  if (!isRecord(rawGift)) return emptyGiftInfo();
  return {
    groomBankName: clampString(rawGift.groomBankName, GIFT_TEXT_MAX_LENGTH),
    groomAccountName: clampString(rawGift.groomAccountName, GIFT_TEXT_MAX_LENGTH),
    groomAccountNumber: clampString(
      rawGift.groomAccountNumber,
      GIFT_ACCOUNT_MAX_LENGTH,
    ),
    brideBankName: clampString(rawGift.brideBankName, GIFT_TEXT_MAX_LENGTH),
    brideAccountName: clampString(rawGift.brideAccountName, GIFT_TEXT_MAX_LENGTH),
    brideAccountNumber: clampString(
      rawGift.brideAccountNumber,
      GIFT_ACCOUNT_MAX_LENGTH,
    ),
  };
}

export function createDefaultWeddingContent(): WeddingContent {
  return {
    couple: {
      groomName: "Chú rể",
      brideName: "Cô dâu",
      groomFullName: "",
      brideFullName: "",
      groomParents: "",
      brideParents: "",
    },
    date: DEFAULT_ISO_DATE,
    quote: "",
    shareGuestName: false,
    heroPhotoId: null,
    groomPhotoId: null,
    bridePhotoId: null,
    gift: emptyGiftInfo(),
  };
}

/**
 * Chuẩn hóa `weddings.content` từ dữ liệu v3/v4 hoặc định dạng cũ trước migration_v3.
 */
export function normalizeWeddingContent(raw: unknown): WeddingContent {
  const defaults = createDefaultWeddingContent();
  if (!isRecord(raw)) return defaults;

  if (isRecord(raw.couple)) {
    const c = raw.couple;
    const normalizedDate =
      typeof raw.date === "string" ? toIsoPlus07(raw.date) : "";
    return {
      couple: {
        groomName: clampString(c.groomName, NAME_MAX_LENGTH) || defaults.couple.groomName,
        brideName: clampString(c.brideName, NAME_MAX_LENGTH) || defaults.couple.brideName,
        groomFullName: clampString(c.groomFullName, NAME_MAX_LENGTH),
        brideFullName: clampString(c.brideFullName, NAME_MAX_LENGTH),
        groomParents: clampString(c.groomParents, NAME_MAX_LENGTH),
        brideParents: clampString(c.brideParents, NAME_MAX_LENGTH),
      },
      date: normalizedDate || defaults.date,
      quote: clampString(raw.quote, QUOTE_MAX_LENGTH),
      shareGuestName: raw.shareGuestName === true,
      heroPhotoId: nullableUuid(raw.heroPhotoId),
      groomPhotoId: nullableUuid(raw.groomPhotoId),
      bridePhotoId: nullableUuid(raw.bridePhotoId),
      gift: normalizeGiftInfo(raw.gift),
    };
  }

  // Hỗ trợ đọc lại bản ghi tạo theo cấu trúc cũ trước v3
  const legacyGroom = isRecord(raw.groom) ? raw.groom : {};
  const legacyBride = isRecord(raw.bride) ? raw.bride : {};
  const legacyFamilies = isRecord(raw.families) ? raw.families : {};
  const legacyFamGroom = isRecord(legacyFamilies.groom) ? legacyFamilies.groom : {};
  const legacyFamBride = isRecord(legacyFamilies.bride) ? legacyFamilies.bride : {};

  const normalizedDate =
    typeof raw.date === "string" ? toIsoPlus07(raw.date) : "";

  return {
    couple: {
      groomName:
        clampString(legacyGroom.shortName, NAME_MAX_LENGTH) ||
        defaults.couple.groomName,
      brideName:
        clampString(legacyBride.shortName, NAME_MAX_LENGTH) ||
        defaults.couple.brideName,
      groomFullName: clampString(legacyGroom.fullName, NAME_MAX_LENGTH),
      brideFullName: clampString(legacyBride.fullName, NAME_MAX_LENGTH),
      groomParents: clampString(
        legacyFamGroom.parents ?? legacyGroom.parents,
        NAME_MAX_LENGTH,
      ),
      brideParents: clampString(
        legacyFamBride.parents ?? legacyBride.parents,
        NAME_MAX_LENGTH,
      ),
    },
    date: normalizedDate || defaults.date,
    quote: clampString(raw.quote, QUOTE_MAX_LENGTH),
    shareGuestName: raw.shareGuestName === true,
    heroPhotoId: nullableUuid(raw.heroPhotoId),
    groomPhotoId: nullableUuid(raw.groomPhotoId),
    bridePhotoId: nullableUuid(raw.bridePhotoId),
    gift: normalizeGiftInfo(raw.gift),
  };
}

function getInitial(name: string, fallback: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const lastWord = words[words.length - 1] ?? "";
  return lastWord ? lastWord.charAt(0).toUpperCase() : fallback;
}

function formatDotDate(isoDate: string): string {
  const parts = formatWeddingDateParts(isoDate);
  return parts.day !== "--" ? parts.dotDate : "";
}

export interface ToTemplateDataInput {
  content: WeddingContent;
  events: WeddingEvent[];
  photos: WeddingPhoto[];
  templateId?: string;
  plan?: WeddingPlan;
  weddingSlug?: string;
  uiOverrides?: Partial<TemplateData["ui"]>;
  musicOverrides?: Partial<TemplateData["music"]>;
}

/**
 * Hàm dựng dữ liệu thống nhất cho mọi template (Demo, Live Preview Dashboard, và /w/[slug], /m/[slug]).
 * Không dùng dữ liệu cưới hardcode; khi thiếu ảnh hoặc sự kiện sẽ trả về null / mảng rỗng để template hiển thị placeholder an toàn.
 */
export function toTemplateData({
  content,
  events,
  photos,
  templateId = "basic-1",
  plan = "free",
  weddingSlug,
  uiOverrides,
  musicOverrides,
}: ToTemplateDataInput): TemplateData {
  const photoById = new Map(photos.map((p) => [p.id, p]));

  const heroPhoto =
    (content.heroPhotoId ? photoById.get(content.heroPhotoId) : undefined) ??
    photos.find((p) => p.kind === "banner") ??
    null;

  const groomPhoto = content.groomPhotoId
    ? photoById.get(content.groomPhotoId) ?? null
    : null;
  const bridePhoto = content.bridePhotoId
    ? photoById.get(content.bridePhotoId) ?? null
    : null;

  const gallery = photos
    .filter((p) => p.kind === "gallery")
    .sort((a, b) => a.position - b.position)
    .map((p, index) => ({
      id: p.id,
      url: p.url,
      alt: `Khoảnh khắc #${index + 1}`,
      position: p.position,
    }));

  const giftPhotos = photos.filter((p) => p.kind === "gift");
  const allowQrPhotos = plan !== "free";
  const groomQrPhoto = allowQrPhotos
    ? giftPhotos.find((p) => p.position === 0) ?? null
    : null;
  const brideQrPhoto = allowQrPhotos
    ? giftPhotos.find((p) => p.position === 1) ?? null
    : null;

  const sortedEvents = [...events].sort((a, b) => a.position - b.position);

  const groomName = content.couple.groomName.trim() || "Chú rể";
  const brideName = content.couple.brideName.trim() || "Cô dâu";
  const groomFullName = content.couple.groomFullName.trim() || groomName;
  const brideFullName = content.couple.brideFullName.trim() || brideName;
  const sealLabel = `${getInitial(groomName, "G")} & ${getInitial(brideName, "B")}`;
  const dotDate = formatDotDate(sortedEvents[0]?.startsAt ?? content.date);

  return {
    weddingSlug,
    templateId,
    plan,
    couple: {
      groomName,
      brideName,
      groomFullName,
      brideFullName,
      groomParents: content.couple.groomParents.trim(),
      brideParents: content.couple.brideParents.trim(),
      sealLabel,
    },
    date: content.date,
    quote: content.quote.trim(),
    photos: {
      heroUrl: heroPhoto?.url ?? null,
      heroAlt: `Ảnh bìa cưới ${groomName} và ${brideName}`,
      groomUrl: groomPhoto?.url ?? null,
      brideUrl: bridePhoto?.url ?? null,
      gallery,
    },
    gift: {
      ...normalizeGiftInfo(content.gift),
      groomQrUrl: groomQrPhoto?.url ?? null,
      brideQrUrl: brideQrPhoto?.url ?? null,
    },
    events: sortedEvents,
    music: {
      src: musicOverrides?.src ?? "/media/wedding.mp3",
      title: musicOverrides?.title ?? "Giai điệu ngày cưới",
    },
    ui: {
      eyebrow: uiOverrides?.eyebrow ?? "Save The Date",
      heroSubtitle:
        uiOverrides?.heroSubtitle ?? "Hân hạnh đón tiếp trong ngày chung đôi",
      invitationNote:
        uiOverrides?.invitationNote ??
        "Trân trọng kính mời bạn cùng gia đình đến tham dự buổi tiệc chung vui và chúc phúc cho chúng mình.",
      invitePrefix: uiOverrides?.invitePrefix ?? "Trân trọng kính mời",
      defaultGuestName: uiOverrides?.defaultGuestName ?? "Quý khách",
      tapHint: uiOverrides?.tapHint ?? "Chạm để mở thiệp",
      eventsEyebrow: uiOverrides?.eventsEyebrow ?? "Thời Gian & Địa Điểm",
      eventsTitle: uiOverrides?.eventsTitle ?? "Sự Kiện Trọng Đại",
      directionsButtonLabel: uiOverrides?.directionsButtonLabel ?? "CHỈ ĐƯỜNG",
      galleryEyebrow: uiOverrides?.galleryEyebrow ?? "Album Ảnh Cưới",
      galleryTitle: uiOverrides?.galleryTitle ?? "Khoảnh Khắc Kỷ Niệm",
      gallerySubtitle:
        uiOverrides?.gallerySubtitle ?? "Chạm vào ảnh để phóng to và xem chi tiết",
      countdownEyebrow: uiOverrides?.countdownEyebrow ?? "Cùng Đếm Ngược",
      countdownTitle: uiOverrides?.countdownTitle ?? "Đến Ngày Chung Đôi",
      countdownFinished:
        uiOverrides?.countdownFinished ?? "Lễ cưới đã diễn ra tốt đẹp",
      thankYouHeading: uiOverrides?.thankYouHeading ?? "Thank You",
      thankYouTitle: uiOverrides?.thankYouTitle ?? "Trân Trọng Cảm Ơn",
      thankYouBody:
        uiOverrides?.thankYouBody ??
        `Cảm ơn sự yêu thương, hiện diện và lời chúc phúc bạn dành cho ${groomName} & ${brideName}.`,
      signature:
        uiOverrides?.signature ??
        `${groomName} ♥ ${brideName}${dotDate ? ` · ${dotDate}` : ""}`,
      autoScroll: uiOverrides?.autoScroll ?? {
        enabled: false,
        speedPxPerSec: 80,
        startDelayMs: 600,
      },
      seoTitle:
        uiOverrides?.seoTitle ??
        `Thiệp Cưới ${groomName} & ${brideName}${dotDate ? ` · ${dotDate}` : ""}`,
      seoDescription:
        uiOverrides?.seoDescription ??
        `Trân trọng kính mời bạn đến chung vui trong ngày trọng đại của ${groomName} & ${brideName}.`,
    },
  };
}
