"use client";

import * as React from "react";
import { TemplatePreviewRenderer } from "@/templates/TemplatePreviewRenderer";
import type { TemplateData } from "@/lib/types";

interface PreviewFrameProps {
  templateId: string;
  data: TemplateData;
  initialOpened: boolean;
}

/** Bọc renderer trong iframe để media query tính theo đúng bề rộng điện thoại. */
export function PreviewFrame({ templateId, data, initialOpened }: PreviewFrameProps) {
  const [opened, setOpened] = React.useState(initialOpened);

  return (
    <TemplatePreviewRenderer
      templateId={templateId}
      data={data}
      mode="preview"
      contained
      viewport="phone"
      isOpened={opened}
      onOpenedChange={setOpened}
      externalMusicControl={false}
    />
  );
}
