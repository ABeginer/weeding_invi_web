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
  /** Có công tắc ẩn/hiện ảnh cô dâu/chú rể riêng (`data.hideCouplePhotos`). */
  couplePhotos: boolean;
  /** Có hai cột hai họ để chọn nhà nào đứng trước (`data.hostFirst`). */
  hostFirst: boolean;
  /** Có hỗ trợ kéo-thả sắp xếp thứ tự section (`data.sectionOrder`). */
  reorderable: boolean;
  /** Có đọc và áp dụng 3 màu trang phục tùy chỉnh (`data.dressCode`). */
  dressCodeEditor: boolean;
  /** Có hiển thị lịch trình ngày cưới (`data.timeline`). */
  timelineEditor: boolean;
  /** Có hiển thị khối Chuyện chúng mình (`data.story`). */
  storySupported: boolean;
}

/** Thứ tự chuẩn duy nhất cho mọi mẫu thiệp và demo (sau Hero cố định). */
export const CANONICAL_SECTION_ORDER: readonly string[] = [
  "family",
  "map",
  "story",
  "dresscode",
  "calendar",
  "gift",
  "rsvp",
  "album",
  "albumQr",
];

/** Bộ đầy đủ: dùng cho template mới chưa có khai báo riêng. */
export const ALL_SECTION_KEYS = [
  ...CANONICAL_SECTION_ORDER,
  "music",
] as const;

const SECTIONS_NO_STORY = [
  "family",
  "map",
  "dresscode",
  "calendar",
  "gift",
  "rsvp",
  "album",
  "albumQr",
  "music",
] as const;

export const DEFAULT_TEMPLATE_SECTIONS: TemplateSections = {
  sections: ALL_SECTION_KEYS,
  couplePhotos: true,
  hostFirst: true,
  reorderable: true,
  dressCodeEditor: true,
  timelineEditor: true,
  storySupported: true,
};

/**
 * Khai báo chính xác các block/công tắc mà từng mẫu thiệp thực sự đọc và hiển thị.
 * Đảm bảo mọi nút hiện trên Dashboard đều có tác dụng thật trên thiệp.
 */
const NO_STORY_NO_COUPLE: Partial<TemplateSections> = {
  sections: SECTIONS_NO_STORY,
  couplePhotos: false,
  hostFirst: false,
  storySupported: false,
};

const TEMPLATE_OVERRIDES: Record<string, Partial<TemplateSections>> = {
  // 2 mẫu cơ bản không đọc hiddenSections & sectionOrder
  "vuon-o-liu": {
    sections: [],
    couplePhotos: false,
    hostFirst: false,
    reorderable: false,
    dressCodeEditor: false,
    timelineEditor: false,
    storySupported: false,
  },
  "basic-1": {
    sections: [],
    couplePhotos: false,
    hostFirst: false,
    reorderable: false,
    dressCodeEditor: false,
    timelineEditor: false,
    storySupported: false,
  },
  "bach-nguyet": NO_STORY_NO_COUPLE,
  "lam-hoa-vien": NO_STORY_NO_COUPLE,
  "long-phung-ep4": { ...NO_STORY_NO_COUPLE, dressCodeEditor: false },

  // Mẫu Standard hỗ trợ đầy đủ 10 section theo thứ tự chuẩn (bao gồm ảnh Polaroid lật 3D cặp đôi)
  "mot-thoi-de-nho": DEFAULT_TEMPLATE_SECTIONS,

  // 2 mẫu đọc data.hideCouplePhotos
  "bach-lan-lua-nga": {
    sections: SECTIONS_NO_STORY,
    couplePhotos: true,
    hostFirst: true,
    dressCodeEditor: false,
    storySupported: false,
  },
  "song-hy-v2-do": {
    sections: SECTIONS_NO_STORY,
    couplePhotos: true,
    hostFirst: true,
    dressCodeEditor: false,
    timelineEditor: false,
    storySupported: false,
  },

  // Các mẫu đọc data.hostFirst (không đọc hideCouplePhotos)
  "anh-dao-phan-tuyet": {
    ...NO_STORY_NO_COUPLE,
    hostFirst: true,
    dressCodeEditor: false,
  },
  "do-ruou-vang": { ...NO_STORY_NO_COUPLE, hostFirst: true },
  "do-truyen-thong": { ...NO_STORY_NO_COUPLE, hostFirst: true },
  "flowery-white": { ...NO_STORY_NO_COUPLE, hostFirst: true },
  "long-phung": { ...NO_STORY_NO_COUPLE, hostFirst: true },
  "minimal-red": { ...NO_STORY_NO_COUPLE, hostFirst: true },
  "nau-toi-gian": { ...NO_STORY_NO_COUPLE, hostFirst: true },
  "yen-chi-mau-don": { ...NO_STORY_NO_COUPLE, hostFirst: true },

  // Toàn bộ Bộ sưu tập Hồng Kông (5/5 mẫu chuẩn Standard: đủ 10 section, story, timeline, couplePhotos, hostFirst)
  "ban-sac-huong-cang": DEFAULT_TEMPLATE_SECTIONS,
  "cuu-long-hy-yen": DEFAULT_TEMPLATE_SECTIONS,
  "da-anh-huong-cang": DEFAULT_TEMPLATE_SECTIONS,
  "sen-ngoc-tram-nam": DEFAULT_TEMPLATE_SECTIONS,
  "hao-quang-huong-cang": DEFAULT_TEMPLATE_SECTIONS,
  "huong-cang-dem-neon": DEFAULT_TEMPLATE_SECTIONS,
  "nhat-ky-mua-yeu": {
    ...DEFAULT_TEMPLATE_SECTIONS,
    timelineEditor: false,
  },

  // 4 mẫu hoàng gia vẽ màu dress code cố định & không vẽ timeline
  "phuong-loan-gam-do": { ...NO_STORY_NO_COUPLE, dressCodeEditor: false, timelineEditor: false },
  "song-phung-bich-dao": { ...NO_STORY_NO_COUPLE, dressCodeEditor: false, timelineEditor: false },
  "thanh-mai-ngoc-lan": { ...NO_STORY_NO_COUPLE, dressCodeEditor: false, timelineEditor: false },
  "to-hong-lua-tham": { ...NO_STORY_NO_COUPLE, dressCodeEditor: false, timelineEditor: false },

  // Các mẫu vẽ màu dress code cố định
  "bich-ngoc-hoang-trieu": { ...NO_STORY_NO_COUPLE, dressCodeEditor: false },
  "moc-huong-nang-thu": { ...NO_STORY_NO_COUPLE, dressCodeEditor: false },
  "rang-hong-hoang-hon": { ...NO_STORY_NO_COUPLE, dressCodeEditor: false },

  // Các mẫu chuẩn còn lại (đủ 9 section trừ story, có dressCode, timeline & kéo-thả)
  "chu-sa-long-phung": NO_STORY_NO_COUPLE,
  "da-yen-pha-le": NO_STORY_NO_COUPLE,
  "hac-kim-nhat-thuc": NO_STORY_NO_COUPLE,
  "vuonkinh-xanh": NO_STORY_NO_COUPLE,

  // Các mẫu chuẩn còn lại (đủ 9 section trừ story, có dressCode & timeline)
  "bach-tra-suong-mai": NO_STORY_NO_COUPLE,
  "diem-phan-kim-to": NO_STORY_NO_COUPLE,
  "hac-vu-luu-ly": DEFAULT_TEMPLATE_SECTIONS,
  "ho-phach-mat-thu": {
    ...DEFAULT_TEMPLATE_SECTIONS,
    couplePhotos: false,
  },
  "huyen-kim-long-phung": NO_STORY_NO_COUPLE,
  "lam-tu-ngoc-suong": NO_STORY_NO_COUPLE,
  "mac-lam-kim-tuyen": NO_STORY_NO_COUPLE,
  "phi-thuy-dong-duong": NO_STORY_NO_COUPLE,
  "song-hac-kim-van": NO_STORY_NO_COUPLE,
  "tu-dang-da-khuc": NO_STORY_NO_COUPLE,
};

/**
 * Phần chỉ có ở gói trả phí. Dashboard phải ẩn khi gói chưa đủ, nếu không
 * khách Free thấy nút "QR album khách" nhưng bật cũng không có gì xảy ra
 * (template đã gate theo gói).
 */
const PLAN_GATED_SECTIONS: Record<string, (plan: WeddingPlan) => boolean> = {
  albumQr: (plan) => plan !== "free",
  story: (plan) => plan !== "free",
};

export function getTemplateSections(
  templateId: string | null | undefined,
  plan: WeddingPlan,
): TemplateSections {
  const normalized = templateId ? templateId.replace(/_/g, "-") : null;
  const override = normalized ? TEMPLATE_OVERRIDES[normalized] : undefined;
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
  story: "Chuyện chúng mình",
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
  // Mộc Hương Nắng Thu: có ảnh bìa hero, 2 ảnh Polaroid couple và album
  "moc-huong-nang-thu": { hero: true, couple: true, gallery: true },
  // Flowery White: không ảnh hero, không ảnh chân dung — chỉ album
  "flowery-white": { hero: false, couple: false, gallery: true },
  // Long Phụng Ep4: có ảnh bìa vòm Hero, không có 2 ảnh chân dung riêng gia đình, có album
  "long-phung-ep4": { hero: true, couple: false, gallery: true },
  // Bạch Nguyệt: có ảnh bìa vòm Hero, không có 2 ảnh chân dung riêng gia đình, có album
  "bach-nguyet": { hero: true, couple: false, gallery: true },
  // Lam Hoa Viên: có ảnh bìa vòm Hero, không có 2 ảnh chân dung riêng gia đình, có album
  "lam-hoa-vien": { hero: true, couple: false, gallery: true },
  // Bạch Trà Sương Mai: có ảnh bìa vòm Hero, không có 2 ảnh chân dung riêng gia đình, có album
  "bach-tra-suong-mai": { hero: true, couple: false, gallery: true },
  // Song Hạc Kim Vân: dùng biểu tượng tranh sơn mài hero-cranes.webp làm trung tâm nghệ thuật, ẩn ô upload ảnh bìa và chân dung thừa
  "song-hac-kim-van": { hero: false, couple: false, gallery: true },
  // Hạc Vũ Lưu Ly (Standard): Nguyệt Môn Hero, thẻ lật 3D chân dung cô dâu chú rể, thước phim 35mm, album
  "hac-vu-luu-ly": { hero: true, couple: true, gallery: true },
  // Diễm Phấn Kim Tơ: có ảnh bìa Oval Cameo Hero, không có 2 ảnh chân dung riêng gia đình, có album
  "diem-phan-kim-to": { hero: true, couple: false, gallery: true },
  // Phỉ Thúy Đông Dương: có ảnh bìa Vòm Kiến Trúc Đông Dương Hero, không có 2 ảnh chân dung riêng gia đình, có album
  "phi-thuy-dong-duong": { hero: true, couple: false, gallery: true },
  // Lam Tú Ngọc Sương: có ảnh cưới Khung Vòm Pha Lê Tú Cầu ở Hero, không có 2 ảnh chân dung riêng gia đình, có album
  "lam-tu-ngoc-suong": { hero: true, couple: false, gallery: true },
  // Tử Đằng Dạ Khúc: Hero là khung nghệ thuật nhung tím đêm – rèm hoa tử đằng – hoa diên vĩ & tên cặp đôi nổi bật, ẩn ô upload ảnh bìa thừa và chân dung riêng, có album
  "tu-dang-da-khuc": { hero: false, couple: false, gallery: true },
  // Huyền Kim Long Phụng: Hero sử dụng nghệ thuật Long Phụng khắc vàng 24K & tên cặp đôi làm điểm nhấn thị giác chính, ẩn ô upload ảnh bìa thừa và chân dung riêng, có album
  "huyen-kim-long-phung": { hero: false, couple: false, gallery: true },
  // Hắc Kim Nhật Thực: Hero lồng ảnh cặp đôi tròn bên trong Vòng Nhật Thực (fallback tên 3 dòng + rings-crest), ẩn 2 ảnh chân dung riêng, có album
  "hac-kim-nhat-thuc": { hero: true, couple: false, gallery: true },
  // Dạ Yến Pha Lê: Hero lồng ảnh cặp đôi trong Khung Vòm Gương Pha Lê (fallback tên 3 dòng + crystal-crest), ẩn 2 ảnh chân dung riêng, có album
  "da-yen-pha-le": { hero: true, couple: false, gallery: true },
  // Mặc Lam Kim Tuyến: thiết kế tối giản fine-line typography & botanical crown, không dùng ảnh hero, không ảnh chân dung riêng gia đình, có album
  "mac-lam-kim-tuyen": { hero: false, couple: false, gallery: true },
  // Chu Sa Long Phụng: Hero là khung cung đình đỏ chu sa với Kim Ấn Bát Giác Song Hỷ & đôi linh vật Long–Phụng, ẩn ô upload ảnh bìa và chân dung thừa, có album
  "chu-sa-long-phung": { hero: false, couple: false, gallery: true },
  // Anh Đào Phấn Tuyết: có ảnh cưới Khung Vòm Cành Anh Đào sakura-arch ở Hero, không có 2 ảnh chân dung riêng gia đình, có album
  "anh-dao-phan-tuyet": { hero: true, couple: false, gallery: true },
  // Bạch Lan Lụa Ngà: có ảnh bìa vòm Hero, có 2 ảnh chân dung riêng cô dâu chú rể, có album
  "bach-lan-lua-nga": { hero: true, couple: true, gallery: true },
  // Bích Ngọc Hoàng Triều: Hero có Khung Vòm Đài Sen Vàng lotus-arch ôm ảnh cặp đôi, ẩn 2 ảnh chân dung riêng, có album
  "bich-ngoc-hoang-trieu": { hero: true, couple: false, gallery: true },
  // Ráng Hồng Hoàng Hôn: Hero có Khung Vòm Hoa Hoàng Hôn sunset-arch ôm ảnh cặp đôi, có 2 ảnh chân dung riêng trong Khung Chân Dung portrait-frame, có album
  "rang-hong-hoang-hon": { hero: true, couple: true, gallery: true },
  // Yên Chi Mẫu Đơn: có ảnh Hero lồng túi phong bì nhung đỏ, ẩn 2 ảnh chân dung riêng gia đình, có album
  "yen-chi-mau-don": { hero: true, couple: false, gallery: true },
  // Phượng Loan Gấm Đỏ: có ảnh cưới vòm Long Phụng ở Hero, 2 ảnh chân dung riêng chú rể & cô dâu, có album
  "phuong-loan-gam-do": { hero: true, couple: true, gallery: true },
  // Song Phụng Bích Đào: có ảnh cưới vòm Song Phụng ở Hero, 2 ảnh chân dung riêng chú rể & cô dâu, có album
  "song-phung-bich-dao": { hero: true, couple: true, gallery: true },
  // Thanh Mai Ngọc Lan: có ảnh cưới vòm Mai Lan ở Hero, 2 ảnh chân dung riêng chú rể & cô dâu, có album
  "thanh-mai-ngoc-lan": { hero: true, couple: true, gallery: true },
  // Tơ Hồng Lụa Thắm: có ảnh cưới vòng lụa bay ở Hero, 2 ảnh chân dung riêng chú rể & cô dâu, có album
  "to-hong-lua-tham": { hero: true, couple: true, gallery: true },
  // Bản Sắc Hương Cảng: có ảnh hero poster phim, 2 ảnh hồ sơ chân dung nhân vật chính, có album thước phim
  "ban-sac-huong-cang": { hero: true, couple: true, gallery: true },
  // Cửu Long Hỷ Yến: có ảnh hero đại yến, 2 ảnh chân dung Bang Chủ & Phu Nhân, có album
  "cuu-long-hy-yen": { hero: true, couple: true, gallery: true },
  // Dạ Ảnh Hương Cảng: có ảnh cưới khung phim 35mm ở Hero, 2 ảnh Polaroid couple đối đầu, có album contact sheet 35mm
  "da-anh-huong-cang": { hero: true, couple: true, gallery: true },
  // Hào Quang Hương Cảng: có ảnh cưới khung phim 35mm warm ở Hero, 2 ảnh chân dung Art Deco, có album 35mm
  "hao-quang-huong-cang": { hero: true, couple: true, gallery: true },
  // Hương Cảng Đêm Neon: có ảnh cưới khung phim 35mm ở Hero, 2 ảnh chân dung Opening Cast, có album 35mm
  "huong-cang-dem-neon": { hero: true, couple: true, gallery: true },
  // Nhật Ký Mùa Yêu: có ảnh cưới khung Polaroid ở Hero, 2 ảnh chân dung đời thường, có album
  "nhat-ky-mua-yeu": { hero: true, couple: true, gallery: true },
  // Sen Ngọc Trăm Năm: có ảnh cưới lồng phong bì xanh rêu ở Hero, 2 ảnh chân dung lật 3D khung cổ điển, có album
  "sen-ngoc-tram-nam": { hero: true, couple: true, gallery: true },
};

export function getTemplatePhotos(templateId?: string | null): TemplatePhotoSlots {
  const override = templateId ? PHOTO_OVERRIDES[templateId] : undefined;
  return { ...DEFAULT_PHOTO_SLOTS, ...override };
}
