export type BrandThemeMode = "light" | "dark";

export const BRAND_THEME_COOKIE_NAME = "theme";
export const BRAND_THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 năm
export const DEFAULT_BRAND_THEME: BrandThemeMode = "light";

export interface BrandThemeTokens {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  accentText: string;
  accentFg: string;
  accentSoft: string;
  rose: string;
  sage: string;
  focusRing: string;
  vipBadgeBg: string;
  vipBadgeFg: string;
  vipBadgeBorder: string;
  soonBadgeBg: string;
  soonBadgeFg: string;
  soonBadgeBorder: string;
  successBg: string;
  successFg: string;
  successBorder: string;
  dangerBg: string;
  dangerFg: string;
  dangerBorder: string;
  dangerBtnBg: string;
  dangerBtnFg: string;
  neutralBg: string;
  neutralFg: string;
  neutralBorder: string;
  phoneChassis: string;
  phoneBezel: string;
  phoneHighlight: string;
  phoneNotch: string;
}

export const brandLightTheme: BrandThemeTokens = {
  bg: "#FAF7F2",
  surface: "#FFFFFF",
  surfaceAlt: "#F3EEE6",
  border: "#E4DCCD",
  text: "#2C2A29",
  textMuted: "#5C5752",
  accent: "#C5A059",
  accentHover: "#B58F46",
  accentText: "#8A6D2F",
  accentFg: "#2C2A29",
  accentSoft: "#F1E7D0",
  rose: "#C88A7D",
  sage: "#6B7B6E",
  focusRing: "#8A6D2F",
  vipBadgeBg: "#2C2A29",
  vipBadgeFg: "#C5A059",
  vipBadgeBorder: "#2C2A29",
  soonBadgeBg: "#F3EEE6",
  soonBadgeFg: "#5C5752",
  soonBadgeBorder: "#E4DCCD",
  successBg: "#EBF5EE",
  successFg: "#1B5E38",
  successBorder: "#B5DBBF",
  dangerBg: "#FCEEEE",
  dangerFg: "#991B1B",
  dangerBorder: "#F2B8B5",
  dangerBtnBg: "#B91C1C",
  dangerBtnFg: "#FFFFFF",
  neutralBg: "#EFECE6",
  neutralFg: "#4E4944",
  neutralBorder: "#D8D1C5",
  phoneChassis: "#161618",
  phoneBezel: "#2E2E32",
  phoneHighlight: "#3D3A32",
  phoneNotch: "#080808",
};

export const brandDarkTheme: BrandThemeTokens = {
  bg: "#0B0B0B",
  surface: "#151515",
  surfaceAlt: "#1B1B1B",
  border: "#2A2A2A",
  text: "#E8DFC8",
  textMuted: "#A89F86",
  accent: "#D4AF37",
  accentHover: "#E3C35A",
  accentText: "#D4AF37",
  accentFg: "#0B0B0B",
  accentSoft: "#2A2412",
  rose: "#C88A7D",
  sage: "#7F9184",
  focusRing: "#D4AF37",
  vipBadgeBg: "#0B0B0B",
  vipBadgeFg: "#D4AF37",
  vipBadgeBorder: "#D4AF37",
  soonBadgeBg: "#1B1B1B",
  soonBadgeFg: "#A89F86",
  soonBadgeBorder: "#2A2A2A",
  successBg: "#12261C",
  successFg: "#7FE3A8",
  successBorder: "#285940",
  dangerBg: "#2B1414",
  dangerFg: "#FCA5A5",
  dangerBorder: "#6E2929",
  dangerBtnBg: "#B91C1C",
  dangerBtnFg: "#FFFFFF",
  neutralBg: "#201E1B",
  neutralFg: "#C9BFA8",
  neutralBorder: "#38342E",
  phoneChassis: "#161618",
  phoneBezel: "#2E2E32",
  phoneHighlight: "#3D3A32",
  phoneNotch: "#080808",
};

export const BRAND_THEMES: Record<BrandThemeMode, BrandThemeTokens> = {
  light: brandLightTheme,
  dark: brandDarkTheme,
};

export function parseBrandTheme(value: unknown): BrandThemeMode {
  return value === "dark" ? "dark" : "light";
}

function toCssDeclarations(
  tokens: BrandThemeTokens,
  mode: BrandThemeMode,
): string {
  const shadowSoft =
    mode === "light"
      ? "0 12px 32px -12px rgba(44, 42, 41, 0.1)"
      : "0 14px 36px -12px rgba(0, 0, 0, 0.75)";
  const shadowCard =
    mode === "light"
      ? "0 4px 20px -4px rgba(44, 42, 41, 0.06)"
      : "0 8px 24px -8px rgba(0, 0, 0, 0.65)";

  return [
    `color-scheme: ${mode};`,
    `--color-bg: ${tokens.bg};`,
    `--color-surface: ${tokens.surface};`,
    `--color-surface-alt: ${tokens.surfaceAlt};`,
    `--color-border: ${tokens.border};`,
    `--color-text: ${tokens.text};`,
    `--color-text-muted: ${tokens.textMuted};`,
    `--color-accent: ${tokens.accent};`,
    `--color-accent-hover: ${tokens.accentHover};`,
    `--color-accent-text: ${tokens.accentText};`,
    `--color-accent-fg: ${tokens.accentFg};`,
    `--color-accent-soft: ${tokens.accentSoft};`,
    `--color-rose: ${tokens.rose};`,
    `--color-sage: ${tokens.sage};`,
    `--color-focus-ring: ${tokens.focusRing};`,
    `--brand-bg: ${tokens.bg};`,
    `--brand-surface: ${tokens.surface};`,
    `--brand-surface-alt: ${tokens.surfaceAlt};`,
    `--brand-border: ${tokens.border};`,
    `--brand-text: ${tokens.text};`,
    `--brand-text-muted: ${tokens.textMuted};`,
    `--brand-accent: ${tokens.accent};`,
    `--brand-accent-hover: ${tokens.accentHover};`,
    `--brand-accent-text: ${tokens.accentText};`,
    `--brand-accent-fg: ${tokens.accentFg};`,
    `--brand-accent-soft: ${tokens.accentSoft};`,
    `--brand-rose: ${tokens.rose};`,
    `--brand-sage: ${tokens.sage};`,
    `--brand-focus-ring: ${tokens.focusRing};`,
    `--brand-vip-bg: ${tokens.vipBadgeBg};`,
    `--brand-vip-fg: ${tokens.vipBadgeFg};`,
    `--brand-vip-border: ${tokens.vipBadgeBorder};`,
    `--brand-soon-bg: ${tokens.soonBadgeBg};`,
    `--brand-soon-fg: ${tokens.soonBadgeFg};`,
    `--brand-soon-border: ${tokens.soonBadgeBorder};`,
    `--brand-success-bg: ${tokens.successBg};`,
    `--brand-success-fg: ${tokens.successFg};`,
    `--brand-success-border: ${tokens.successBorder};`,
    `--brand-danger-bg: ${tokens.dangerBg};`,
    `--brand-danger-fg: ${tokens.dangerFg};`,
    `--brand-danger-border: ${tokens.dangerBorder};`,
    `--brand-danger-btn-bg: ${tokens.dangerBtnBg};`,
    `--brand-danger-btn-fg: ${tokens.dangerBtnFg};`,
    `--brand-neutral-bg: ${tokens.neutralBg};`,
    `--brand-neutral-fg: ${tokens.neutralFg};`,
    `--brand-neutral-border: ${tokens.neutralBorder};`,
    `--brand-phone-chassis: ${tokens.phoneChassis};`,
    `--brand-phone-bezel: ${tokens.phoneBezel};`,
    `--brand-phone-highlight: ${tokens.phoneHighlight};`,
    `--brand-phone-notch: ${tokens.phoneNotch};`,
    `--shadow-soft: ${shadowSoft};`,
    `--shadow-card: ${shadowCard};`,
  ].join("\n  ");
}

export function generateBrandThemeCss(): string {
  return [
    `:root {\n  ${toCssDeclarations(brandLightTheme, "light")}\n}`,
    `:root[data-theme="dark"] {\n  ${toCssDeclarations(brandDarkTheme, "dark")}\n}`,
  ].join("\n\n");
}
