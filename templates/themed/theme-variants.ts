import type { ThemeConfig } from "./theme-configs";

export const THEME_VARIANT_PALETTES = [
  {
    id: "rose",
    label: "Hồng",
    accent: "#B85C6A",
    primary: "#8F3F4D",
    secondary: "#C97D86",
    text: "#2D1E20",
    subtext: "#774E54",
    paper: "#FFF7F5",
    paper2: "#F7E8E5",
    card: "rgba(255, 255, 255, 0.9)",
    panel: "rgba(255, 244, 242, 0.8)",
    dark: false,
  },
  {
    id: "sage",
    label: "Xanh",
    accent: "#738A6B",
    primary: "#53664E",
    secondary: "#8FA486",
    text: "#243026",
    subtext: "#5D6F58",
    paper: "#F8FBF6",
    paper2: "#EAF0E6",
    card: "rgba(255, 255, 255, 0.9)",
    panel: "rgba(241, 247, 238, 0.82)",
    dark: false,
  },
  {
    id: "gold",
    label: "Vàng",
    accent: "#B58A4D",
    primary: "#8A6434",
    secondary: "#D1B47A",
    text: "#2E261B",
    subtext: "#746048",
    paper: "#FFFBF3",
    paper2: "#F4E9D6",
    card: "rgba(255, 255, 255, 0.9)",
    panel: "rgba(255, 249, 238, 0.82)",
    dark: false,
  },
  {
    id: "noir",
    label: "Đêm",
    accent: "#C8A96A",
    primary: "#171514",
    secondary: "#38312C",
    text: "#F8F2E7",
    subtext: "#D9CCB7",
    paper: "#171514",
    paper2: "#241F1B",
    card: "rgba(35, 30, 26, 0.76)",
    panel: "rgba(255, 255, 255, 0.07)",
    dark: true,
  },
] as const;

export type ThemeVariantPalette = (typeof THEME_VARIANT_PALETTES)[number];

export function applyThemeVariant(
  base: ThemeConfig,
  variantIndex: number,
): ThemeConfig {
  const palette =
    THEME_VARIANT_PALETTES[
      ((variantIndex % THEME_VARIANT_PALETTES.length) + THEME_VARIANT_PALETTES.length) %
        THEME_VARIANT_PALETTES.length
    ];
  const dark = palette.dark;
  const border = dark ? "rgba(255, 255, 255, 0.2)" : `${palette.accent}33`;
  return {
    ...base,
    accentSwatch: palette.accent,
    primaryColor: palette.primary,
    secondaryColor: palette.secondary,
    accentColor: palette.accent,
    textColor: palette.text,
    subtextColor: palette.subtext,
    accentTextColor: dark ? palette.accent : palette.primary,
    borderColor: border,
    cardBg: palette.card,
    cardPanelBg: palette.panel,
    bgGradient: `linear-gradient(180deg, ${palette.paper} 0%, ${palette.paper2} 100%)`,
    coverGradient: `linear-gradient(135deg, ${palette.paper} 0%, ${palette.paper2} 55%, ${palette.primary} 100%)`,
    badgeBg: dark ? "rgba(255,255,255,0.1)" : `${palette.accent}22`,
    badgeTextColor: dark ? palette.text : palette.primary,
    buttonBg: palette.primary,
    buttonTextColor: "#FFFFFF",
    openBtnBg: palette.primary,
    openBtnTextColor: "#FFFFFF",
    waxSealGradient: `radial-gradient(circle at 30% 30%, ${palette.secondary}, ${palette.primary})`,
    waxSealIconColor: "#FFFFFF",
    tone: dark ? "dark" : "neutral",
    templateTone: base.templateTone,
    giftTone: base.giftTone,
  };
}
