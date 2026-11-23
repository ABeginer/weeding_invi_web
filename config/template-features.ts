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
  { id: "album-30", label: "Album QR cho khách (30 ảnh)", comingSoon: true },
  { id: "music-upload", label: "Tải nhạc MP3", comingSoon: true },
  { id: "excel", label: "Xuất danh sách khách ra Excel", comingSoon: true },
  { id: "gift-qr", label: "Mừng cưới QR" },
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
