"use client";

import * as React from "react";
import type { WeddingTemplateProps } from "../types";
import { THEME_CONFIGS } from "./theme-configs";
import { applyThemeVariant } from "./theme-variants";
import { ThemedTemplate } from "./ThemedTemplate";

interface VariantTemplateProps extends WeddingTemplateProps {
  baseId: string;
  variantIndex: number;
}

export function VariantTemplate({
  baseId,
  variantIndex,
  ...props
}: VariantTemplateProps) {
  const base = THEME_CONFIGS[baseId];
  if (!base) return null;
  const theme = applyThemeVariant(base, variantIndex);
  return <ThemedTemplate theme={theme} {...props} />;
}
