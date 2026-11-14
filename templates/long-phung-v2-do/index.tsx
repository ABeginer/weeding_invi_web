"use client";

import * as React from "react";
import { ThemedTemplate } from "../themed/ThemedTemplate";
import { THEME_CONFIGS } from "../themed/theme-configs";
import type { WeddingTemplateProps } from "../types";

export default function LongPhungV2DoTemplate(props: WeddingTemplateProps) {
  const theme = THEME_CONFIGS["long-phung-v2-do"];
  return <ThemedTemplate theme={theme} {...props} />;
}
