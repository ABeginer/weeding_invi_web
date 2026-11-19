import type { WeddingPlan } from "@/lib/types";

/**
 * Thành phần mà một template thực sự render.
 *
 * Dashboard dùng danh sách này để chỉ hiện những nút điều khiển có tác dụng:
 * hiện/ẩn phần, kéo thả thứ tự, ảnh cô dâu chú rể, thứ tự hai họ.
 * Template nào không có phần đó thì không hiện nút, tránh khách bật/tắt mà
 * thiệp không đổi gì (xem card_exp.md §21).
 */
export interface TemplateSections {
  /** Key khớp `hiddenSections` / `sectionOrder`. */
  sections: readonly string[];
  /** Có khối ảnh cô dâu/chú rể riêng trong phần gia đình. */
  couplePhotos: boolean;
  /** Có hai cột hai họ để chọn nhà nào đứng trước. */
  hostFirst: boolean;
}

/** Bộ đầy đủ: dùng cho mọi template chưa có khai báo riêng. */
export const ALL_SECTION_KEYS = [
  "family",
  "calendar",
  "map",
  "dresscode",
  "album",
  "albumQr",
  "gift",
  "rsvp",
  "music",
] as const;

export const DEFAULT_TEMPLATE_SECTIONS: TemplateSections = {
  sections: ALL_SECTION_KEYS,
  couplePhotos: true,
  hostFirst: true,
};

/**
 * Ngoại lệ theo template. Chỉ khai báo cái KHÁC mặc định.
 * - `do-truyen-thong`: phần gia đình chỉ có tên + hai họ, không có ảnh cặp đôi
 *   riêng → ẩn nút "Hiện ảnh cô dâu & chú rể".
 */
const TEMPLATE_OVERRIDES: Record<string, Partial<TemplateSections>> = {
  "do-truyen-thong": {
    couplePhotos: false,
  },
  "long-phung": {
    couplePhotos: false,
  },
  "do-ruou-vang": {
    couplePhotos: false,
  },
  "minimal-red": {
    couplePhotos: false,
  },
  "minimal-brown": {
    couplePhotos: false,
  },
  "flowery-white": {
    couplePhotos: false,
  },
};

/**
 * Phần chỉ có ở gói trả phí. Dashboard phải ẩn khi gói chưa đủ, nếu không
 * khách Free thấy nút "QR album khách" nhưng bật cũng không có gì xảy ra
 * (template đã gate theo gói).
 */
const PLAN_GATED_SECTIONS: Record<string, (plan: WeddingPlan) => boolean> = {
  albumQr: (plan) => plan !== "free",
};

export function getTemplateSections(
  templateId: string | null | undefined,
  plan: WeddingPlan,
): TemplateSections {
  const override = templateId ? TEMPLATE_OVERRIDES[templateId] : undefined;
  const base: TemplateSections = { ...DEFAULT_TEMPLATE_SECTIONS, ...override };
  const sections = base.sections.filter((key) => {
    const gate = PLAN_GATED_SECTIONS[key];
    return gate ? gate(plan) : true;
  });
  return { ...base, sections };
}

/** Nhãn hiển thị trong dashboard, dùng chung cho cả toggle và danh sách kéo thả. */
export const SECTION_LABELS: Record<string, string> = {
  family: "Thông tin gia đình",
  calendar: "Lịch cưới & đếm ngược",
  map: "Sự kiện và chỉ đường",
  dresscode: "Dress code & lịch trình",
  album: "Album ảnh",
  albumQr: "QR album khách",
  gift: "Hộp quà mừng",
  rsvp: "Xác nhận & lời chúc",
  music: "Nhạc nền",
};

export function getSectionLabel(key: string): string {
  return SECTION_LABELS[key] ?? key;
}

/** Template này có phần đó không (đã tính cả gói)? */
export function hasSection(
  templateId: string | null | undefined,
  plan: WeddingPlan,
  key: string,
): boolean {
  return getTemplateSections(templateId, plan).sections.includes(key);
}

/** Template có những ô ảnh nào trong tab "Ảnh cưới" của dashboard. */
export type TemplatePhotoSlots = {
  /** Ảnh bìa chính / hero đầu thiệp. */
  hero: boolean;
  /** Ảnh chân dung cô dâu và chú rể riêng. */
  couple: boolean;
  /** Album ảnh cưới. */
  gallery: boolean;
};

const DEFAULT_PHOTO_SLOTS: TemplatePhotoSlots = { hero: true, couple: true, gallery: true };

/**
 * Mẫu tối giản (minimal) không dùng ảnh hero cũng không có ảnh chân dung riêng,
 * chỉ có album. Dashboard phải ẩn các ô upload tương ứng để không bắt khách
 * tải ảnh mà thiệp không hiển thị (card_exp.md §27).
 */
const PHOTO_OVERRIDES: Record<string, Partial<TemplatePhotoSlots>> = {
  "minimal-red": { hero: false, couple: false, gallery: true },
  // Minimal Brown: KHÔNG có ảnh chung ở hero, nhưng có 2 ảnh chân dung riêng
  "minimal-brown": { hero: false, couple: true, gallery: true },
  // Flowery White: không ảnh hero, không ảnh chân dung — chỉ album
  "flowery-white": { hero: false, couple: false, gallery: true },
};

export function getTemplatePhotos(templateId?: string | null): TemplatePhotoSlots {
  const override = templateId ? PHOTO_OVERRIDES[templateId] : undefined;
  return { ...DEFAULT_PHOTO_SLOTS, ...override };
}
