import type { GuestStatus, WeddingContent, WeddingPlan } from "@/lib/types";

export type TemplateId = "basic-1" | "basic-2" | "basic-3" | "pro-1" | "vip-1";

export type TemplateRenderMode = "demo" | "live";

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
}

export interface WeddingTemplateProps {
  content: WeddingContent;
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
}

