import type { GiftTone } from "@/components/invitation/GiftModal";
import type { TemplateTone } from "../shared/TemplateOverlays";
import type { MotifType } from "./ThemeMotif";

export type HeroLayoutType =
  | "tilted-polaroid"
  | "arch-gold"
  | "editorial-noir"
  | "botanical-arch"
  | "porcelain-ornate"
  | "playful-chibi"
  | "classic-romance";

export interface DressCodeColor {
  name: string;
  color: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  motif: MotifType;
  accentSwatch: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  subtextColor: string;
  accentTextColor: string;
  borderColor: string;
  cardBg: string;
  cardPanelBg?: string;
  bgGradient: string;
  coverGradient: string;
  tone: "bright" | "neutral" | "dark";
  templateTone: TemplateTone;
  giftTone: GiftTone;
  fontCoupleClass?: string;
  coupleFontFamily: string;
  headingFontFamily?: string;
  ambientParticle?: string;
  waxSealGradient?: string;
  waxSealShadow?: string;
  waxSealIconColor?: string;
  heroLayout?: HeroLayoutType;
  dressCode?: DressCodeColor[];
  badgeBg?: string;
  badgeTextColor?: string;
  buttonBg?: string;
  buttonTextColor?: string;
  openBtnBg?: string;
  openBtnTextColor?: string;
}

export const THEME_CONFIGS: Record<string, ThemeConfig> = {
  "song-hy-v2-do": {
    id: "song-hy-v2-do",
    name: "Song Hỷ Đỏ",
    subtitle: "May mắn · Song Hỷ",
    description:
      "Chữ Song Hỷ đỏ son truyền thống phối sắc vàng kim rạng ngời, cầu chúc trăm năm tình nghĩa mặn nồng.",
    motif: "double-happiness",
    accentSwatch: "#FFE8A4",
    primaryColor: "#920002",
    secondaryColor: "#2F0000",
    accentColor: "#FFE8A4",
    textColor: "#FFFFFF",
    subtextColor: "#FFE8A4",
    accentTextColor: "#FFE8A4",
    borderColor: "rgba(255, 232, 164, 0.35)",
    cardBg: "rgba(47, 0, 0, 0.8)",
    cardPanelBg: "rgba(255, 232, 164, 0.12)",
    bgGradient: "linear-gradient(180deg, #920002 0%, #680001 50%, #380000 100%)",
    coverGradient: "linear-gradient(180deg, #920002 0%, #680001 50%, #2A0000 100%)",
    waxSealGradient: "radial-gradient(circle at 30% 30%, #FFE8A4, #D4AF37)",
    waxSealShadow: "0 4px 20px rgba(255, 232, 164, 0.5), inset 0 2px 4px rgba(255,255,255,0.3)",
    waxSealIconColor: "#2F0000",
    coupleFontFamily: "var(--font-viaoda), serif",
    headingFontFamily: "var(--font-playfair), serif",
    ambientParticle: "囍",
    heroLayout: "playful-chibi",
    tone: "dark",
    templateTone: "obsidian",
    giftTone: "obsidian",
    badgeBg: "rgba(255, 232, 164, 0.15)",
    badgeTextColor: "#FFE8A4",
    buttonBg: "#FFE8A4",
    buttonTextColor: "#2F0000",
    openBtnBg: "#FFE8A4",
    openBtnTextColor: "#2F0000",
    dressCode: [
      { name: "Đỏ May Mắn", color: "#920002" },
      { name: "Vàng Hoàng Gia", color: "#FFE8A4" },
      { name: "Đỏ Thẫm Quý Tộc", color: "#2F0000" },
    ],
  },

  "vuonkinh-xanh": {
    id: "vuonkinh-xanh",
    name: "Vườn Kính Xanh",
    subtitle: "Lãng mạn · Dạ yến nhà kính",
    description:
      "Không gian dạ tiệc nhà kính ngập tràn cây lá nhiệt đới, sắc xanh rêu đậm sâu lắng và huyền ảo.",
    motif: "forest",
    accentSwatch: "#A9C5A0",
    primaryColor: "#47613E",
    secondaryColor: "#2C3E26",
    accentColor: "#A9C5A0",
    textColor: "#FFFFFF",
    subtextColor: "#D8EAD3",
    accentTextColor: "#CDE2C6",
    borderColor: "rgba(169, 197, 160, 0.35)",
    cardBg: "rgba(44, 62, 38, 0.8)",
    cardPanelBg: "rgba(169, 197, 160, 0.12)",
    bgGradient: "linear-gradient(180deg, #47613E 0%, #31442A 50%, #1A2616 100%)",
    coverGradient: "linear-gradient(180deg, #47613E 0%, #31442A 50%, #151F11 100%)",
    waxSealGradient: "radial-gradient(circle at 30% 30%, #A9C5A0, #47613E)",
    waxSealShadow: "0 4px 20px rgba(169, 197, 160, 0.5), inset 0 2px 4px rgba(255,255,255,0.3)",
    waxSealIconColor: "#1A2616",
    coupleFontFamily: "var(--font-viaoda), serif",
    headingFontFamily: "var(--font-cormorant), serif",
    ambientParticle: "🌿",
    heroLayout: "botanical-arch",
    tone: "dark",
    templateTone: "obsidian",
    giftTone: "olive",
    badgeBg: "rgba(169, 197, 160, 0.16)",
    badgeTextColor: "#CDE2C6",
    buttonBg: "#A9C5A0",
    buttonTextColor: "#1A2616",
    openBtnBg: "#A9C5A0",
    openBtnTextColor: "#1A2616",
    dressCode: [
      { name: "Xanh Rêu Đậm", color: "#47613E" },
      { name: "Bạc Hà Pastel", color: "#A9C5A0" },
      { name: "Trắng Sương", color: "#D8EAD3" },
    ],
  },
};
