import type {
  GuestDiet,
  GuestStatus,
  TemplateData,
  TemplateMode,
  WeddingPlan,
} from "@/lib/types";

export type BaseTemplateId =
  | "basic-1"
  | "vuon-o-liu"
  | "bach-lan-lua-nga"
  | "rang-hong-hoang-hon"
  | "vip-1"
  | "ritual-an-hoi"
  | "ritual-gia-tien"
  | "phuong-loan-gam-do"
  | "thanh-mai-ngoc-lan"
  | "song-hy-v2-do"
  | "song-phung-bich-dao"
  | "to-hong-lua-tham"
  | "vuonkinh-xanh"
  | "anh-dao-phan-tuyet"
  | "yen-chi-mau-don"
  | "nau-toi-gian"
  | "do-truyen-thong"
  | "long-phung"
  | "chu-sa-long-phung"
  | "bich-ngoc-hoang-trieu"
  | "long-phung-ep4"
  | "bach-nguyet"
  | "lam-hoa-vien"
  | "bach-tra-suong-mai"
  | "song-hac-kim-van"
  | "hac-vu-luu-ly"
  | "diem-phan-kim-to"
  | "phi-thuy-dong-duong"
  | "ho-phach-mat-thu"
  | "lam-tu-ngoc-suong"
  | "tu-dang-da-khuc"
  | "huyen-kim-long-phung"
  | "hac-kim-nhat-thuc"
  | "da-yen-pha-le"
  | "mac-lam-kim-tuyen"
  | "do-ruou-vang"
  | "minimal-red"
  | "moc-huong-nang-thu"
  | "flowery-white"
  | "ban-sac-huong-cang"
  | "cuu-long-hy-yen"
  | "da-anh-huong-cang"
  | "hao-quang-huong-cang"
  | "huong-cang-dem-neon"
  | "nhat-ky-mua-yeu"
  | "mot-thoi-de-nho";

export type TemplateId =
  | BaseTemplateId
  | `${BaseTemplateId}-v2`
  | `${BaseTemplateId}-v3`
  | `${BaseTemplateId}-v4`;

export type TemplateRenderMode = TemplateMode;

export type TemplateCategory = "traditional" | "romantic" | "minimal" | "hongkong";
export type TemplateColorGroup =
  | "red"
  | "pink"
  | "green"
  | "blue-purple"
  | "neutral"
  | "black-gold";

export interface WeddingTemplateMeta {
  id: TemplateId;
  name: string;
  subtitle: string;
  description: string;
  plan: WeddingPlan;
  coverImage: string;
  defaultMusic: {
    src: string;
    title: string;
  };
  hasAdvancedEffects: boolean;
  isPlaceholder?: boolean;
  accentSwatch: string;
  tone: "bright" | "neutral" | "dark";
  category?: TemplateCategory;
  color?: TemplateColorGroup;
  ritualKey?: "an-hoi" | "gia-tien" | "vu-quy";
  ritualLabel?: string;
  styleTags?: string[];
  /** Ảnh xem trước tỉ lệ 9:16 (tùy chọn, mặc định /templates/<id>/preview.webp). */
  previewImage?: string;
  /** Ảnh snapshot dài để cuộn trong popup (mặc định /templates/<id>/snapshot.webp). */
  snapshotImage?: string;
  /** Trang xem thử; mặc định /mau/<id> cho mẫu đã triển khai. */
  demoUrl?: string;
  /** Mã tính năng bổ sung, tra trong config/template-features.ts. */
  extraFeatureIds?: string[];
}

export interface WeddingTemplateProps {
  data: TemplateData;
  mode: TemplateRenderMode;
  contained?: boolean;
  viewport?: "phone" | "desktop";
  isOpened?: boolean;
  onOpenedChange?: (opened: boolean) => void;
  externalMusicControl?: boolean;
  isMusicPlaying?: boolean;
  onToggleMusic?: () => void;
  inviteSlug?: string;
  weddingSlug?: string;
  invitationMode?: "personal" | "public";
  guestName?: string | null;
  initialStatus?: GuestStatus;
  initialPlusOnes?: number;
  initialDiet?: GuestDiet | null;
  initialSongRequest?: string | null;
  initialRideNeeded?: boolean;
}
