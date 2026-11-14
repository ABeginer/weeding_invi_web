import type {
  GuestDiet,
  GuestStatus,
  TemplateData,
  TemplateMode,
  WeddingPlan,
} from "@/lib/types";

export type TemplateId =
  | "basic-1"
  | "basic-2"
  | "basic-3"
  | "pro-1"
  | "vip-1"
  | "ritual-an-hoi"
  | "ritual-gia-tien"
  | "ritual-vu-quy"
  | "anh-dao-hong"
  | "bach-su-do"
  | "bach-su-nau"
  | "chibi-red"
  | "hoa-moc-nau"
  | "hoang-kim-do"
  | "long-phung-v2-do"
  | "mai-lan-xanh"
  | "ren-theu-trang"
  | "song-hy-v2-do"
  | "song-phung-xanh"
  | "to-duyen-do-dam"
  | "to-duyen-hong"
  | "vuon-xuan-do"
  | "vuon-xuan-xanh"
  | "vuonkinh-xanh-nhat"
  | "vuonkinh-xanh";

export type TemplateRenderMode = TemplateMode;

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
  ritualKey?: "an-hoi" | "gia-tien" | "vu-quy";
  ritualLabel?: string;
  styleTags?: string[];
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
