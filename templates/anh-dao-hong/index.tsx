"use client";

import * as React from "react";
import { ThemedTemplate } from "../themed/ThemedTemplate";
import { THEME_CONFIGS } from "../themed/theme-configs";
import type { WeddingTemplateProps } from "../types";

export default function AnhDaoHongTemplate(props: WeddingTemplateProps) {
  const theme = THEME_CONFIGS["anh-dao-hong"];
  return <ThemedTemplate theme={theme} {...props} />;
}
