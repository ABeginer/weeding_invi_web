"use client";

import * as React from "react";
import { ThemedTemplate } from "../themed/ThemedTemplate";
import { THEME_CONFIGS } from "../themed/theme-configs";
import type { WeddingTemplateProps } from "../types";

export default function MaiLanXanhTemplate(props: WeddingTemplateProps) {
  const theme = THEME_CONFIGS["mai-lan-xanh"];
  return <ThemedTemplate theme={theme} {...props} />;
}
