import type { PhotoKind, WeddingPlan } from "@/lib/wedding-types";

export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export const UPLOAD_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedUploadMimeType = (typeof UPLOAD_ALLOWED_MIME_TYPES)[number];

export interface PlanLimits {
  label: string;
  weddings: number | null; // null = không giới hạn
  guests: number | null; // null = không giới hạn
  events: number;
  photos: Record<PhotoKind, number>;
  allowedTemplatePlans: readonly WeddingPlan[];
}

export const PLAN_LIMITS: Record<WeddingPlan, PlanLimits> = {
  free: {
    label: "Miễn phí",
    weddings: 1,
    guests: 20,
    events: 2,
    photos: {
      banner: 1,
      couple: 2,
      gallery: 5,
      album: 0,
      og: 1,
      gift: 0,
    },
    allowedTemplatePlans: ["free"],
  },
  pro: {
    label: "Pro",
    weddings: null,
    guests: null,
    events: 10,
    photos: {
      banner: 1,
      couple: 2,
      gallery: 30,
      album: 30,
      og: 1,
      gift: 2,
    },
    allowedTemplatePlans: ["free", "pro"],
  },
  vip: {
    label: "VIP",
    weddings: null,
    guests: null,
    events: 20,
    photos: {
      banner: 1,
      couple: 2,
      gallery: 30,
      album: 300,
      og: 1,
      gift: 2,
    },
    allowedTemplatePlans: ["free", "pro", "vip"],
  },
};

export function getPlanLimits(plan: WeddingPlan): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}

export function getPlanLabel(plan: WeddingPlan): string {
  return getPlanLimits(plan).label;
}

export function isTemplateAllowedForPlan(
  userPlan: WeddingPlan,
  templatePlan: WeddingPlan,
): boolean {
  return getPlanLimits(userPlan).allowedTemplatePlans.includes(templatePlan);
}

const PHOTO_KIND_LABEL: Record<PhotoKind, string> = {
  banner: "ảnh bìa",
  couple: "ảnh cặp đôi",
  gallery: "ảnh trên thiệp",
  album: "ảnh trong Album cho khách",
  og: "ảnh chia sẻ mạng xã hội",
  gift: "ảnh QR quà mừng",
};

export function getPhotoLimitMessage(plan: WeddingPlan, kind: PhotoKind): string {
  const limits = getPlanLimits(plan);
  const max = limits.photos[kind];
  if (kind === "album") {
    if (plan === "free") {
      return "Gói Miễn phí chưa hỗ trợ Album cho khách. Vui lòng nâng cấp gói Pro hoặc VIP.";
    }
    if (plan === "pro") {
      return "Nâng cấp VIP để thêm ảnh";
    }
    return "Đã đạt giới hạn 300 ảnh";
  }
  if (kind === "gift" && max === 0) {
    return `Gói ${limits.label} chỉ hỗ trợ thông tin chuyển khoản dạng chữ. Nâng cấp lên Pro để tải ảnh QR quà mừng.`;
  }
  if (kind === "gallery") {
    return `Gói ${limits.label} tối đa ${max} ảnh trên thiệp. Nâng cấp để thêm ảnh.`;
  }
  return `Gói ${limits.label} tối đa ${max} ${PHOTO_KIND_LABEL[kind]}. Hãy xóa bớt ảnh cũ trước khi tải lên.`;
}

export function getEventLimitMessage(plan: WeddingPlan): string {
  const limits = getPlanLimits(plan);
  return `Gói ${limits.label} tối đa ${limits.events} lễ. Nâng cấp để thêm lễ.`;
}

export function getGuestLimitMessage(plan: WeddingPlan, remaining?: number): string {
  const limits = getPlanLimits(plan);
  const max = limits.guests ?? 0;
  if (typeof remaining === "number") {
    return `Gói ${limits.label} chỉ được tối đa ${max} khách mời (còn có thể thêm tối đa ${remaining} khách).`;
  }
  return `Gói ${limits.label} chỉ được tối đa ${max} khách mời. Vui lòng xóa bớt khách hoặc nâng cấp gói.`;
}

export function getWeddingLimitMessage(plan: WeddingPlan): string {
  const limits = getPlanLimits(plan);
  return `Gói ${limits.label} chỉ được tạo tối đa ${limits.weddings ?? 1} thiệp cưới.`;
}

export function getTemplateLockedMessage(
  userPlan: WeddingPlan,
  requiredPlan: WeddingPlan,
): string {
  return `Mẫu này yêu cầu gói ${getPlanLabel(requiredPlan)}. Thiệp hiện đang ở gói ${getPlanLabel(userPlan)}.`;
}
