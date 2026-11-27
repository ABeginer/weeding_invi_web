import type { TemplateId, WeddingTemplateMeta } from "./types";
import { THEME_VARIANT_PALETTES } from "./themed/theme-variants.ts";

export const VARIANT_SUFFIXES = ["v2", "v3", "v4"] as const;

export function buildTemplateVariants(
  baseTemplates: WeddingTemplateMeta[],
): WeddingTemplateMeta[] {
  return baseTemplates.flatMap((base) =>
    VARIANT_SUFFIXES.map((suffix, index) => {
      const palette = THEME_VARIANT_PALETTES[index];
      return {
        ...base,
        id: `${base.id}-${suffix}` as TemplateId,
        name: `${base.name} · ${palette.label}`,
        subtitle: `${base.subtitle} · ${palette.label}`,
        accentSwatch: palette.accent,
        coverImage: base.coverImage,
        defaultMusic: base.defaultMusic,
        isPlaceholder: base.isPlaceholder ?? false,
      };
    }),
  );
}
