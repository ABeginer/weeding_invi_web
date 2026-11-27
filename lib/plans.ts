export type PlanTier = "free" | "pro" | "vip";

export type PlanFeature =
  | "customMusicUpload"
  | "vietQrImages"
  | "exportCsv"
  | "boardingPass"
  | "livePhotoWall"
  | "ledMode"
  | "tableQrPoster"
  | "photoWallZip"
  | "familyPinShare"
  | "qrOnlineAlbum";

export interface PlanLimitsData {
  name: string;
  price: string;
  priceNumber: number;
  originalPrice?: string;
  originalPriceNumber?: number;
  maxGuests: number;
  maxPhotos: number;
  storageMonths: number;
  customMusicUpload: boolean;
  vietQrImages: boolean;
  exportCsv: boolean;
  boardingPass: boolean;
  livePhotoWall: boolean;
  ledMode: boolean;
  tableQrPoster: boolean;
  photoWallZip: boolean;
  familyPinShare: boolean;
  qrOnlineAlbum: boolean;
}

export const PLAN_CONFIGS: Record<PlanTier, PlanLimitsData> = {
  free: {
    name: "Gói Miễn phí",
    price: "0đ",
    priceNumber: 0,
    maxGuests: 20,
    maxPhotos: 5,
    storageMonths: 6,
    customMusicUpload: false,
    vietQrImages: false,
    exportCsv: false,
    boardingPass: false,
    livePhotoWall: false,
    ledMode: false,
    tableQrPoster: false,
    photoWallZip: false,
    familyPinShare: false,
    qrOnlineAlbum: false,
  },
  pro: {
    name: "Gói Pro",
    price: "159.000đ",
    priceNumber: 159000,
    originalPrice: "199.000đ",
    originalPriceNumber: 199000,
    maxGuests: Infinity,
    maxPhotos: 30,
    storageMonths: 12,
    customMusicUpload: true,
    vietQrImages: true,
    exportCsv: true,
    boardingPass: false,
    livePhotoWall: false,
    ledMode: false,
    tableQrPoster: false,
    photoWallZip: false,
    familyPinShare: false,
    qrOnlineAlbum: true,
  },
  vip: {
    name: "Gói VIP",
    price: "399.000đ",
    priceNumber: 399000,
    originalPrice: "499.000đ",
    originalPriceNumber: 499000,
    maxGuests: Infinity,
    maxPhotos: 50,
    storageMonths: 24,
    customMusicUpload: true,
    vietQrImages: true,
    exportCsv: true,
    boardingPass: true,
    livePhotoWall: true,
    ledMode: true,
    tableQrPoster: true,
    photoWallZip: true,
    familyPinShare: true,
    qrOnlineAlbum: true,
  },
};

/**
 * Trả về thông tin hạn mức và quyền lợi theo gói thiệp cưới.
 */
export function getPlanLimits(
  plan: PlanTier | string | null | undefined,
): PlanLimitsData {
  if (plan === "vip") return PLAN_CONFIGS.vip;
  if (plan === "pro") return PLAN_CONFIGS.pro;
  return PLAN_CONFIGS.free;
}

/**
 * Kiểm tra xem một gói có được phép sử dụng tính năng cụ thể hay không.
 */
export function canUseFeature(
  plan: PlanTier | string | null | undefined,
  feature: PlanFeature,
): boolean {
  const limits = getPlanLimits(plan);
  return Boolean(limits[feature]);
}
