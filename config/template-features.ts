import type { WeddingPlan } from "@/lib/types";

/**
 * Nguồn duy nhất cho danh sách tính năng hiển thị trong popup mẫu thiệp.
 * Giá trị khớp `config/pricing.ts`; tính năng chưa chạy được đánh dấu
 * `comingSoon` để popup hiện nhãn "Sắp có" thay vì hứa hẹn sai.
 */
export interface TemplateFeature {
  id: string;
  label: string;
  comingSoon?: boolean;
}

export const BASE_FEATURES: TemplateFeature[] = [
  { id: "guest-link", label: "Link thiệp riêng cho từng khách" },
  { id: "rsvp", label: "Xác nhận tham dự (RSVP)" },
  { id: "wishes", label: "Sổ lưu bút lời chúc" },
  { id: "schedule", label: "Lịch trình ngày cưới" },
  { id: "map", label: "Bản đồ Google Maps và chỉ đường" },
  { id: "music", label: "Nhạc nền" },
  { id: "gallery", label: "Thư viện ảnh" },
];

const PRO_FEATURES: TemplateFeature[] = [
  { id: "photos-hd", label: "30 ảnh HD trên thiệp" },
  { id: "album-30", label: "Album QR cho khách (30 ảnh)" },
  { id: "music-upload", label: "Tải nhạc MP3 riêng" },
  { id: "excel", label: "Xuất danh sách khách ra Excel", comingSoon: true },
  { id: "gift-qr", label: "Mừng cưới VietQR tự động" },
  { id: "no-logo", label: "Không hiển thị logo" },
  { id: "retention-1y", label: "Lưu trữ 1 năm" },
];

const VIP_FEATURES: TemplateFeature[] = PRO_FEATURES.map((feature) => {
  if (feature.id === "album-30") {
    return { ...feature, id: "album-300", label: "Album QR cho khách (300 ảnh)" };
  }
  if (feature.id === "retention-1y") {
    return { ...feature, id: "retention-2y", label: "Lưu trữ 2 năm" };
  }
  return feature;
});

const EXTRA_FEATURES: Record<string, TemplateFeature> = {
  "ritual-an-hoi": { id: "ritual-an-hoi", label: "Bố cục riêng cho Lễ Ăn Hỏi" },
  "ritual-gia-tien": { id: "ritual-gia-tien", label: "Bố cục riêng cho Lễ Gia Tiên" },
  "signature-sfx": { id: "signature-sfx", label: "Âm thanh mở thiệp riêng theo chủ đề" },
  "sfx-harp-fan": {
    id: "sfx-harp-fan",
    label: "Mở quạt xếp 60fps & âm thanh đàn hạc độc bản",
  },
  "sfx-lotus-envelope": {
    id: "sfx-lotus-envelope",
    label: "Bìa phong bì xanh rêu dấu sáp vàng & âm thanh đàn tranh ngũ cung",
  },
  "sfx-vintage-envelope": {
    id: "sfx-vintage-envelope",
    label: "Bìa phong thư 3D tháo dây gai, bẻ dấu sáp & âm thanh cổ điển độc bản",
  },
  "amber-envelope-glide": {
    id: "amber-envelope-glide",
    label: "Bìa mật thư nâu Espresso mở 3D lướt lên Hero & trượt ảnh uyên ương 60fps",
  },
  "sfx-amber-letter": {
    id: "sfx-amber-letter",
    label: "Âm thanh Châu Âu cổ điển tách sáp đồng, Felt Piano & Cello trầm ấm",
  },
  "amber-parcel-gift": {
    id: "amber-parcel-gift",
    label: "Bưu kiện sáp đồng 3 trạng thái & hòa âm cổ điển Amaj7",
  },
  "diary-tape-fall-cover": {
    id: "diary-tape-fall-cover",
    label: "Mở bìa bung băng keo, tờ giấy rơi xoay 3D trong gió cuộn lộ mặt sau Hero",
  },
  "washi-tape-reveal": {
    id: "washi-tape-reveal",
    label: "Hiệu ứng dán băng keo Washi cuộn ép lên mép từng khung ảnh khi cuộn trang",
  },
  "story-paper-pull": {
    id: "story-paper-pull",
    label: "Chồng giấy \"Chuyện Chúng Mình\" kéo lật từng trang kèm nút kéo lại từ đầu",
  },
  "sfx-diary-scrapbook": {
    id: "sfx-diary-scrapbook",
    label: "Âm thanh ASMR tách băng dính, tiếng \"pực\", gió cuộn giấy rơi & lật trang",
  },
  "tear-calendar": {
    id: "tear-calendar",
    label: "Xé tờ lịch giấy tương tác & đóng dấu mộc bưu điện tiết lộ ngày cưới",
  },
  "polaroid-flip-3d": {
    id: "polaroid-flip-3d",
    label: "Lật ảnh Polaroid chân dung 3D viết tay cô dâu & chú rể",
  },
  "sfx-cinema-clapper": {
    id: "sfx-cinema-clapper",
    label: "Bìa bảng clapperboard 35mm & âm thanh màn trập rạp phim",
  },
  "sfx-kowloon-doors": {
    id: "sfx-kowloon-doors",
    label: "Mở cửa đôi VIP Cửu Long & quân mạt chược Song Hỷ 3D",
  },
  "sfx-cinema-ticket": {
    id: "sfx-cinema-ticket",
    label: "Nghi thức xé vé vào rạp & kéo màn chiếu điện ảnh",
  },
  "sfx-artdeco-doors": {
    id: "sfx-artdeco-doors",
    label: "Mở cửa đôi Art Deco & âm thanh chào mừng điện ảnh",
  },
  "sfx-neon-vhs": {
    id: "sfx-neon-vhs",
    label: "Bìa máy phát VHS cổ điển & hiệu ứng CRT neon",
  },
  "scratch-moonlight": {
    id: "scratch-moonlight",
    label: "Thẻ cào ánh trăng tương tác tiết lộ ngày cưới",
  },
  "scratch-gold-24k": {
    id: "scratch-gold-24k",
    label: "Thẻ cào nhũ vàng 24K tiết lộ ngày cưới",
  },
  "scratch-date": { id: "scratch-date", label: "Thẻ cào nhũ tương tác tiết lộ ngày cưới" },
  "flip-cards-3d": { id: "flip-cards-3d", label: "Lật thẻ chân dung 3D cô dâu & chú rể" },
  "flip-cards-3d-poker": {
    id: "flip-cards-3d-poker",
    label: "Lật thẻ bài 3D hồ sơ K♥ & Q♥",
  },
  "flip-cards-3d-hk": {
    id: "flip-cards-3d-hk",
    label: "Lật thẻ nhân vật 3D phong cách điện ảnh",
  },
  "story-film-35mm": { id: "story-film-35mm", label: "Chuyện chúng mình kiểu cuộn phim 35mm" },
  "story-lotus": {
    id: "story-lotus",
    label: "Chuyện chúng mình kể lại hành trình yêu thương",
  },
  "story-journal": {
    id: "story-journal",
    label: "Chuyện chúng mình dạng nhật ký lưu bút cổ điển",
  },
  "cinema-timeline": { id: "cinema-timeline", label: "Kịch bản đêm tiệc theo mốc giờ điện ảnh" },
  "polaroid-scrapbook": {
    id: "polaroid-scrapbook",
    label: "Khung ảnh Polaroid, giấy xé thủ công & hộp quà giấy kraft",
  },
  "gift-enamel-casket": {
    id: "gift-enamel-casket",
    label: "Rương sính lễ lưu ly mở nắp 3 trạng thái",
  },
  "gift-lotus-box": {
    id: "gift-lotus-box",
    label: "Hộp mừng cưới hoa sen Song Hỷ tương tác 3 trạng thái",
  },
  "gift-briefcase": {
    id: "gift-briefcase",
    label: "Vali đen khóa vàng mở 3 trạng thái",
  },
};

export interface TemplateFeatureGroups {
  base: TemplateFeature[];
  advanced: TemplateFeature[];
  extras: TemplateFeature[];
}

export function getTemplateFeatures(
  plan: WeddingPlan,
  extraFeatureIds?: string[],
): TemplateFeatureGroups {
  const advanced =
    plan === "vip" ? VIP_FEATURES : plan === "pro" ? PRO_FEATURES : [];
  const extras = (extraFeatureIds ?? [])
    .map((id) => EXTRA_FEATURES[id])
    .filter((feature): feature is TemplateFeature => Boolean(feature));

  return { base: BASE_FEATURES, advanced, extras };
}

export const PLAN_LABELS: Record<WeddingPlan, string> = {
  free: "Miễn phí",
  pro: "Standard",
  vip: "Pro",
};
