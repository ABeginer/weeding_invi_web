import { z } from "zod";

export type WeddingPlan = "free" | "pro" | "vip";
export type PhotoKind = "banner" | "couple" | "gallery" | "og" | "gift" | "album";
export type PhotoSlot = "hero" | "groom" | "bride" | "og" | "gift-groom" | "gift-bride";
export type TemplateMode = "demo" | "preview" | "live";

export const NAME_MAX_LENGTH = 60;
export const QUOTE_MAX_LENGTH = 200;
export const GIFT_TEXT_MAX_LENGTH = 80;
export const GIFT_ACCOUNT_MAX_LENGTH = 40;
export const EVENT_TITLE_MAX_LENGTH = 120;
export const EVENT_LUNAR_MAX_LENGTH = 60;
export const EVENT_VENUE_MAX_LENGTH = 120;
export const EVENT_ADDRESS_MAX_LENGTH = 300;
export const EVENT_URL_MAX_LENGTH = 2000;

export type WeddingGiftInfo = {
  groomBankName: string;
  groomAccountName: string;
  groomAccountNumber: string;
  brideBankName: string;
  brideAccountName: string;
  brideAccountNumber: string;
};

export type WeddingContent = {
  couple: {
    groomName: string;
    brideName: string;
    groomFullName: string;
    brideFullName: string;
    groomParents: string;
    brideParents: string;
  };
  date: string; // ISO, có +07:00
  quote: string; // lời dẫn ngắn, tối đa 200 ký tự
  heroPhotoId: string | null;
  groomPhotoId: string | null;
  bridePhotoId: string | null;
  gift: WeddingGiftInfo;
};

export type WeddingEvent = {
  id: string;
  title: string;
  startsAt: string; // ISO (+07:00 hoặc timestamptz từ DB)
  lunarDate: string;
  venueName: string;
  venueAddress: string;
  mapEmbedUrl: string | null;
  mapDirectionsUrl: string | null;
  position: number;
};

export type WeddingPhoto = {
  id: string;
  kind: PhotoKind;
  url: string;
  position: number;
};

export type TemplatePhotoItem = {
  id: string;
  url: string;
  alt: string;
  position: number;
};

export type TemplateData = {
  weddingSlug?: string;
  templateId: string;
  plan: WeddingPlan;
  couple: {
    groomName: string;
    brideName: string;
    groomFullName: string;
    brideFullName: string;
    groomParents: string;
    brideParents: string;
    sealLabel: string;
  };
  date: string;
  quote: string;
  photos: {
    heroUrl: string | null;
    heroAlt: string;
    groomUrl: string | null;
    brideUrl: string | null;
    gallery: TemplatePhotoItem[];
  };
  gift: WeddingGiftInfo & {
    groomQrUrl: string | null;
    brideQrUrl: string | null;
  };
  events: WeddingEvent[];
  music: {
    src: string;
    title: string;
  };
  ui: {
    eyebrow: string;
    heroSubtitle: string;
    invitationNote: string;
    invitePrefix: string;
    defaultGuestName: string;
    tapHint: string;
    eventsEyebrow: string;
    eventsTitle: string;
    directionsButtonLabel: string;
    galleryEyebrow: string;
    galleryTitle: string;
    gallerySubtitle: string;
    countdownEyebrow: string;
    countdownTitle: string;
    countdownFinished: string;
    thankYouHeading: string;
    thankYouTitle: string;
    thankYouBody: string;
    signature: string;
    autoScroll: {
      enabled: boolean;
      speedPxPerSec: number;
      startDelayMs: number;
    };
    seoTitle: string;
    seoDescription: string;
  };
};

const ISO_PLUS_07_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?\+07:00$/;

export function isValidIsoPlus07(value: string): boolean {
  return ISO_PLUS_07_RE.test(value) && !Number.isNaN(Date.parse(value));
}

/**
 * Chuyển các chuỗi ngày/giờ đầu vào phổ biến sang định dạng ISO +07:00.
 * Trả về chuỗi rỗng nếu không phân tích được ngày.
 */
export function toIsoPlus07(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  if (isValidIsoPlus07(trimmed)) {
    return trimmed;
  }

  const localMatch = trimmed.match(
    /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2}))?$/,
  );
  if (localMatch) {
    const candidate = `${localMatch[1]}T${localMatch[2]}:${localMatch[3] ?? "00"}+07:00`;
    return !Number.isNaN(Date.parse(candidate)) ? candidate : "";
  }

  const dateOnlyMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (dateOnlyMatch) {
    const candidate = `${dateOnlyMatch[1]}T10:00:00+07:00`;
    return !Number.isNaN(Date.parse(candidate)) ? candidate : "";
  }

  const parsedMs = Date.parse(trimmed);
  if (!Number.isNaN(parsedMs)) {
    const vnMs = parsedMs + 7 * 60 * 60 * 1000;
    const d = new Date(vnMs);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mi = String(d.getUTCMinutes()).padStart(2, "0");
    const ss = String(d.getUTCSeconds()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}+07:00`;
  }

  return "";
}

/**
 * Tách URL src nếu người dùng dán nguyên thẻ `<iframe src="..."></iframe>`.
 */
export function extractMapEmbedSrc(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/<iframe\b/i.test(trimmed)) {
    const match = trimmed.match(/\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)')/i);
    const extracted = (match?.[1] ?? match?.[2] ?? "").trim();
    return extracted.replace(/&amp;/g, "&");
  }
  return trimmed;
}

export function isValidHttpsUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

const uuidOrNullSchema = z
  .union([z.string().uuid("Mã ảnh không hợp lệ."), z.literal(""), z.null(), z.undefined()])
  .transform((val) => (typeof val === "string" && val.length > 0 ? val : null));

const giftTextFieldSchema = (label: string, maxLength = GIFT_TEXT_MAX_LENGTH) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((val) => (typeof val === "string" ? val.trim() : ""))
    .refine(
      (val) => val.length <= maxLength,
      `${label} tối đa ${maxLength} ký tự.`,
    );

export const weddingGiftInputSchema = z.object({
  groomBankName: giftTextFieldSchema("Ngân hàng nhà trai"),
  groomAccountName: giftTextFieldSchema("Tên tài khoản nhà trai"),
  groomAccountNumber: giftTextFieldSchema(
    "Số tài khoản nhà trai",
    GIFT_ACCOUNT_MAX_LENGTH,
  ),
  brideBankName: giftTextFieldSchema("Ngân hàng nhà gái"),
  brideAccountName: giftTextFieldSchema("Tên tài khoản nhà gái"),
  brideAccountNumber: giftTextFieldSchema(
    "Số tài khoản nhà gái",
    GIFT_ACCOUNT_MAX_LENGTH,
  ),
});

export const emptyGiftInfo = (): WeddingGiftInfo => ({
  groomBankName: "",
  groomAccountName: "",
  groomAccountNumber: "",
  brideBankName: "",
  brideAccountName: "",
  brideAccountNumber: "",
});

export const weddingContentInputSchema = z.object({
  couple: z.object({
    groomName: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập tên chú rể.")
      .max(NAME_MAX_LENGTH, `Tên chú rể tối đa ${NAME_MAX_LENGTH} ký tự.`),
    brideName: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập tên cô dâu.")
      .max(NAME_MAX_LENGTH, `Tên cô dâu tối đa ${NAME_MAX_LENGTH} ký tự.`),
    groomFullName: z
      .string()
      .trim()
      .max(NAME_MAX_LENGTH, `Họ tên đầy đủ chú rể tối đa ${NAME_MAX_LENGTH} ký tự.`),
    brideFullName: z
      .string()
      .trim()
      .max(NAME_MAX_LENGTH, `Họ tên đầy đủ cô dâu tối đa ${NAME_MAX_LENGTH} ký tự.`),
    groomParents: z
      .string()
      .trim()
      .max(NAME_MAX_LENGTH, `Tên phụ huynh nhà trai tối đa ${NAME_MAX_LENGTH} ký tự.`),
    brideParents: z
      .string()
      .trim()
      .max(NAME_MAX_LENGTH, `Tên phụ huynh nhà gái tối đa ${NAME_MAX_LENGTH} ký tự.`),
  }),
  date: z
    .string()
    .trim()
    .min(1, "Vui lòng chọn ngày cưới.")
    .refine(
      (val) => isValidIsoPlus07(val),
      "Ngày cưới phải đúng chuẩn ISO kèm múi giờ +07:00 (ví dụ: 2027-03-20T10:00:00+07:00).",
    ),
  quote: z
    .string()
    .trim()
    .max(QUOTE_MAX_LENGTH, `Lời dẫn ngắn tối đa ${QUOTE_MAX_LENGTH} ký tự.`),
  heroPhotoId: uuidOrNullSchema,
  groomPhotoId: uuidOrNullSchema,
  bridePhotoId: uuidOrNullSchema,
  gift: weddingGiftInputSchema.optional().transform((val) => val ?? emptyGiftInfo()),
});

export const weddingContentPatchSchema = z.object({
  templateId: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{2,40}$/, "Mã mẫu thiệp không hợp lệ.")
    .optional(),
  content: weddingContentInputSchema,
});

const optionalHttpsUrlSchema = (label: string) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((val) => {
      if (typeof val !== "string") return null;
      const extracted = extractMapEmbedSrc(val);
      return extracted.length > 0 ? extracted : null;
    })
    .refine(
      (val) => val === null || val.length <= EVENT_URL_MAX_LENGTH,
      `${label} tối đa ${EVENT_URL_MAX_LENGTH} ký tự.`,
    )
    .refine(
      (val) => val === null || isValidHttpsUrl(val),
      `${label} phải là liên kết bắt đầu bằng https://.`,
    );

export const weddingEventInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên lễ (ví dụ: Lễ Thành Hôn).")
    .max(EVENT_TITLE_MAX_LENGTH, `Tên lễ tối đa ${EVENT_TITLE_MAX_LENGTH} ký tự.`),
  startsAt: z
    .string()
    .trim()
    .min(1, "Vui lòng chọn ngày giờ tổ chức lễ.")
    .refine(
      (val) => isValidIsoPlus07(val),
      "Ngày giờ tổ chức phải đúng chuẩn ISO (+07:00).",
    ),
  lunarDate: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((val) => (typeof val === "string" ? val.trim() : ""))
    .refine(
      (val) => val.length <= EVENT_LUNAR_MAX_LENGTH,
      `Ngày âm lịch tối đa ${EVENT_LUNAR_MAX_LENGTH} ký tự.`,
    ),
  venueName: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên địa điểm.")
    .max(EVENT_VENUE_MAX_LENGTH, `Tên địa điểm tối đa ${EVENT_VENUE_MAX_LENGTH} ký tự.`),
  venueAddress: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((val) => (typeof val === "string" ? val.trim() : ""))
    .refine(
      (val) => val.length <= EVENT_ADDRESS_MAX_LENGTH,
      `Địa chỉ tối đa ${EVENT_ADDRESS_MAX_LENGTH} ký tự.`,
    ),
  mapEmbedUrl: optionalHttpsUrlSchema("Link nhúng Google Maps"),
  mapDirectionsUrl: optionalHttpsUrlSchema("Link chỉ đường Google Maps"),
});

export const reorderPositionsSchema = z
  .array(
    z.object({
      id: z.string().uuid("Mã mục không hợp lệ."),
      position: z.number().int().min(0).max(10000),
    }),
  )
  .min(1, "Danh sách sắp xếp trống.")
  .max(200, "Tối đa 200 mục mỗi lần sắp xếp.");

export const guestEventsInputSchema = z.object({
  eventIds: z
    .array(z.string().uuid("Mã lễ không hợp lệ."))
    .max(100, "Số lễ gán vượt quá giới hạn."),
});
