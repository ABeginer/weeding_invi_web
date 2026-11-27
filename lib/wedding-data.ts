import { formatWeddingDateParts } from "./utils";
import {
  emptyGiftInfo,
  GIFT_ACCOUNT_MAX_LENGTH,
  GIFT_TEXT_MAX_LENGTH,
  NAME_MAX_LENGTH,
  QUOTE_MAX_LENGTH,
  toIsoPlus07,
  type TemplateData,
  type DesignerElementOverride,
  type WeddingContent,
  type WeddingEvent,
  type WeddingGiftInfo,
  type WeddingPhoto,
  type WeddingPlan,
  type WeddingTimelineItem,
  type WeddingStoryMilestone,
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

function normalizeTimeline(raw: unknown): WeddingTimelineItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : undefined,
      time: clampString(item.time, 5),
      label: clampString(item.label, 80),
    }))
    .filter((item) => item.time || item.label)
    .slice(0, 6);
}

function normalizeStory(raw: unknown): WeddingStoryMilestone[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const items = raw
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : undefined,
      year: clampString(item.year, 30),
      title: clampString(item.title, 120),
      content: clampString(item.content, 1000),
      imageUrl:
        typeof item.imageUrl === "string" && item.imageUrl.trim().length > 0
          ? clampString(item.imageUrl.trim(), 1000)
          : undefined,
    }))
    .filter((item) => item.title || item.content)
    .slice(0, 10);
  return items.length > 0 ? items : undefined;
}

function normalizeCastDossier(raw: unknown): WeddingContent["castDossier"] {
  if (!isRecord(raw)) return undefined;
  const groomRole = clampString(raw.groomRole, 60);
  const groomQuote = clampString(raw.groomQuote, 200);
  const brideRole = clampString(raw.brideRole, 60);
  const brideQuote = clampString(raw.brideQuote, 200);
  if (!groomRole && !groomQuote && !brideRole && !brideQuote) return undefined;
  return {
    groomRole: groomRole || undefined,
    groomQuote: groomQuote || undefined,
    brideRole: brideRole || undefined,
    brideQuote: brideQuote || undefined,
  };
}

function normalizeGiftInfo(rawGift: unknown): WeddingGiftInfo {
  if (!isRecord(rawGift)) return emptyGiftInfo();
  return {
    groomAccountLabel: clampString(rawGift.groomAccountLabel, 40),
    brideAccountLabel: clampString(rawGift.brideAccountLabel, 40),
    brideAccountEnabled:
      rawGift.brideAccountEnabled === true ||
      Boolean(rawGift.brideBankName || rawGift.brideAccountNumber),
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
    showWishesOnCard: false,
    wishApprovalMode: "manual",
    wishDisplayStyle: "box",
    heroPhotoId: null,
    groomPhotoId: null,
    bridePhotoId: null,
    gift: emptyGiftInfo(),
  };
}

function normalizeDesignerFields(raw: unknown): Record<string, string> | undefined {
  if (!isRecord(raw)) return undefined;
  const entries = Object.entries(raw).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string",
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function normalizeDesignerOverrides(
  raw: unknown,
): Record<string, DesignerElementOverride> | undefined {
  if (!isRecord(raw)) return undefined;
  const entries: [string, DesignerElementOverride][] = [];
  for (const [id, value] of Object.entries(raw)) {
    if (!isRecord(value)) continue;
    const next: DesignerElementOverride = {};
    for (const key of ["xPct", "yPct", "wPct", "hPct", "imageScale", "imageX", "imageY", "fontSize", "radius"] as const) {
      if (typeof value[key] === "number" && Number.isFinite(value[key])) {
        next[key] = value[key];
      }
    }
    for (const key of ["text", "imageUrl", "color"] as const) {
      if (typeof value[key] === "string" && value[key].length > 0) {
        next[key] = value[key];
      }
    }
    if (Object.keys(next).length > 0) entries.push([id, next]);
  }
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function normalizeStringArray(raw: unknown, max: number): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const values = raw.filter((value): value is string => typeof value === "string").slice(0, max);
  return values.length > 0 ? values : undefined;
}

function normalizePhotoModeration(
  raw: unknown,
): Record<string, "pending" | "approved" | "hidden"> | undefined {
  if (!isRecord(raw)) return undefined;
  const result: Record<string, "pending" | "approved" | "hidden"> = {};
  for (const [id, val] of Object.entries(raw)) {
    if (val === "approved" || val === "hidden" || val === "pending") {
      result[id] = val;
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
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
        groomTitle: clampString(c.groomTitle, 40),
        brideTitle: clampString(c.brideTitle, 40),
        groomParents: clampString(c.groomParents, NAME_MAX_LENGTH),
        brideParents: clampString(c.brideParents, NAME_MAX_LENGTH),
      },
      date: normalizedDate || defaults.date,
      quote: clampString(raw.quote, QUOTE_MAX_LENGTH),
      shareGuestName: raw.shareGuestName === true,
      showWishesOnCard: raw.showWishesOnCard === true,
      wishApprovalMode: raw.wishApprovalMode === "auto" ? "auto" : "manual",
      wishDisplayStyle: raw.wishDisplayStyle === "overlay" ? "overlay" : "box",
      heroPhotoId: nullableUuid(raw.heroPhotoId),
      groomPhotoId: nullableUuid(raw.groomPhotoId),
      bridePhotoId: nullableUuid(raw.bridePhotoId),
      gift: normalizeGiftInfo(raw.gift),
      designerFields: normalizeDesignerFields(raw.designerFields),
      designerOverrides: normalizeDesignerOverrides(raw.designerOverrides),
      dressCode: normalizeStringArray(raw.dressCode, 3),
      hiddenSections: normalizeStringArray(raw.hiddenSections, 20),
      sectionOrder: normalizeStringArray(raw.sectionOrder, 20),
      hideCouplePhotos: raw.hideCouplePhotos === true,
      hostFirst: raw.hostFirst === "bride" ? "bride" : "groom",
      timeline: normalizeTimeline(raw.timeline),
      story: normalizeStory(raw.story),
      castDossier: normalizeCastDossier(raw.castDossier),
      musicPreset:
        raw.musicPreset === "priority1" ||
          raw.musicPreset === "prio2" ||
          raw.musicPreset === "classic" ||
          raw.musicPreset === "garden" ||
          raw.musicPreset === "cheerful" ||
          raw.musicPreset === "moonlight" ||
          raw.musicPreset === "calm" ||
          raw.musicPreset === "beginning" ||
          raw.musicPreset === "sweet" ||
          raw.musicPreset === "custom"
          ? raw.musicPreset
          : "default",
      musicUrl: clampString(raw.musicUrl, 500),
      musicTitle: clampString(raw.musicTitle, 120),
      mealMode: raw.mealMode === "veg" || raw.mealMode === "both" ? raw.mealMode : "meat",
      photoApprovalMode: raw.photoApprovalMode === "auto" ? "auto" : "manual",
      photoModeration: normalizePhotoModeration(raw.photoModeration),
      sharePinEnabled: raw.sharePinEnabled === true,
      sharePin:
        typeof raw.sharePin === "string" && /^\d{4}$/.test(raw.sharePin.trim())
          ? raw.sharePin.trim()
          : undefined,
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
    showWishesOnCard: raw.showWishesOnCard === true,
    wishApprovalMode: raw.wishApprovalMode === "auto" ? "auto" : "manual",
    wishDisplayStyle: raw.wishDisplayStyle === "overlay" ? "overlay" : "box",
    heroPhotoId: nullableUuid(raw.heroPhotoId),
    groomPhotoId: nullableUuid(raw.groomPhotoId),
    bridePhotoId: nullableUuid(raw.bridePhotoId),
    gift: normalizeGiftInfo(raw.gift),
    designerFields: normalizeDesignerFields(raw.designerFields),
    designerOverrides: normalizeDesignerOverrides(raw.designerOverrides),
    dressCode: normalizeStringArray(raw.dressCode, 3),
    hiddenSections: normalizeStringArray(raw.hiddenSections, 20),
    sectionOrder: normalizeStringArray(raw.sectionOrder, 20),
    hideCouplePhotos: raw.hideCouplePhotos === true,
    hostFirst: raw.hostFirst === "bride" ? "bride" : "groom",
    timeline: normalizeTimeline(raw.timeline),
    story: normalizeStory(raw.story),
    castDossier: normalizeCastDossier(raw.castDossier),
    mealMode: "meat",
    photoApprovalMode: raw.photoApprovalMode === "auto" ? "auto" : "manual",
    photoModeration: normalizePhotoModeration(raw.photoModeration),
    sharePinEnabled: raw.sharePinEnabled === true,
    sharePin:
      typeof raw.sharePin === "string" && /^\d{4}$/.test(raw.sharePin.trim())
        ? raw.sharePin.trim()
        : undefined,
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
  templateId = "vuon-o-liu",
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

  const maxGallery = plan === "free" ? 5 : plan === "pro" ? 30 : 50;
  const gallery = photos
    .filter((p) => p.kind === "gallery")
    .sort((a, b) => a.position - b.position)
    .slice(0, maxGallery)
    .map((p, index) => ({
      id: p.id,
      url: p.url,
      alt: `Khoảnh khắc #${index + 1}`,
      position: p.position,
    }));

  const isGiftHidden = Array.isArray(content.hiddenSections) && content.hiddenSections.includes("gift");
  const giftPhotos = isGiftHidden ? [] : photos.filter((p) => p.kind === "gift");
  const allowQrPhotos = plan !== "free" && !isGiftHidden;
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
      groomTitle: content.couple.groomTitle?.trim() || "Trưởng nam",
      brideTitle: content.couple.brideTitle?.trim() || "Ái nữ",
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
    gift: isGiftHidden
      ? {
        ...emptyGiftInfo(),
        groomQrUrl: null,
        brideQrUrl: null,
      }
      : {
        ...normalizeGiftInfo(content.gift),
        groomQrUrl: groomQrPhoto?.url ?? null,
        brideQrUrl: brideQrPhoto?.url ?? null,
      },
    events: sortedEvents,
    dressCode: content.dressCode,
    hiddenSections: content.hiddenSections,
    showWishesOnCard: content.showWishesOnCard === true,
    wishDisplayStyle: content.wishDisplayStyle === "overlay" ? "overlay" : "box",
    sectionOrder: content.sectionOrder,
    hideCouplePhotos: content.hideCouplePhotos === true,
    hostFirst: content.hostFirst === "bride" ? "bride" : "groom",
    timeline: content.timeline ?? [],
    story: content.story,
    castDossier: content.castDossier,
    mealMode: content.mealMode === "veg" || content.mealMode === "both" ? content.mealMode : "meat",
    music: {
      src:
        plan !== "free" && content.musicPreset === "custom" && content.musicUrl
          ? content.musicUrl
          : content.musicPreset === "priority1"
            ? "/media/priority1.mp3"
            : content.musicPreset === "prio2"
              ? "/media/prio2.mp3"
              : content.musicPreset === "classic"
                ? "/media/co-dien.mp3"
                : content.musicPreset === "garden"
                  ? "/media/san-vuon.mp3"
                  : content.musicPreset === "cheerful"
                    ? "/media/well-be-okay.mp3"
                    : content.musicPreset === "moonlight"
                      ? "/media/moonlight.mp3"
                      : content.musicPreset === "calm"
                        ? "/media/audio-2.mp3"
                        : content.musicPreset === "beginning"
                          ? "/media/audio-3.mp3"
                          : content.musicPreset === "sweet"
                            ? "/media/audio-4.mp3"
                            : content.musicPreset === "default"
                              ? "/media/priority1.mp3"
                              : musicOverrides?.src ?? "/media/priority1.mp3",
      title:
        content.musicTitle?.trim() ||
        (content.musicPreset === "priority1"
          ? "Giai điệu tình yêu"
          : content.musicPreset === "prio2"
            ? "Khúc ca ngọt ngào"
            : content.musicPreset === "classic"
              ? "Giai điệu cổ điển trang trọng"
              : content.musicPreset === "garden"
                ? "Acoustic sân vườn tự nhiên"
                : content.musicPreset === "cheerful"
                  ? "Ngày mới bình yên (We'll Be Okay)"
                  : content.musicPreset === "moonlight"
                    ? "Dạ khúc ánh trăng lãng mạn"
                    : content.musicPreset === "calm"
                      ? "Bình yên bên nhau"
                      : content.musicPreset === "beginning"
                        ? "Khởi đầu dịu dàng"
                        : content.musicPreset === "sweet"
                          ? "Ngày chung đôi"
                          : musicOverrides?.title ?? "Giai điệu ngày cưới"),
    },
    ui: {
      eyebrow: uiOverrides?.eyebrow ?? "Thiệp mời tham dự lễ cưới",
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
      thankYouHeading: uiOverrides?.thankYouHeading ?? "Trân Trọng Cảm Ơn",
      thankYouTitle: uiOverrides?.thankYouTitle ?? "Trân Trọng Cảm Ơn",
      thankYouBody:
        uiOverrides?.thankYouBody ??
        `Cảm ơn sự yêu thương, hiện diện và lời chúc phúc bạn dành cho ${groomName} & ${brideName}.`,
      signature:
        uiOverrides?.signature ??
        `${groomName} ♥ ${brideName}${dotDate ? ` · ${dotDate}` : ""}`,
      autoScroll: uiOverrides?.autoScroll ?? {
        enabled: templateId === "vuon-o-liu" || templateId === "basic-1",
        speedPxPerSec: 100,
        startDelayMs: 1200,
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

export {
  getVisibleEventsForGuest,
  getVisibleEvents,
  getNearestUpcomingEvent,
  getEventDirectionsUrl,
  createFallbackEvent,
} from "./events";

