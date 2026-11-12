"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { LANDING_COPY } from "@/config/landing";
import type { WeddingTemplateProps } from "./types";

function TemplateLoadingFallback() {
  return (
    <div className="flex min-h-[540px] w-full flex-col items-center justify-center gap-3 bg-surface px-6 py-16 text-center text-text">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-border border-t-accent motion-reduce:animate-none" />
      <p className="text-xs tracking-[0.14em] text-text-muted uppercase">
        {LANDING_COPY.hero.phoneLoadingLabel}
      </p>
    </div>
  );
}

const DynamicBasic1 = dynamic(() => import("./basic-1"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicBasic2 = dynamic(() => import("./basic-2"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicBasic3 = dynamic(() => import("./basic-3"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicPro1 = dynamic(() => import("./pro-1"), {
  loading: () => <TemplateLoadingFallback />,
});

export interface TemplatePreviewRendererProps extends WeddingTemplateProps {
  templateId: string;
}

export function TemplatePreviewRenderer({
  templateId,
  ...props
}: TemplatePreviewRendererProps) {
  switch (templateId) {
    case "basic-2":
      return <DynamicBasic2 {...props} />;
    case "basic-3":
      return <DynamicBasic3 {...props} />;
    case "pro-1":
      return <DynamicPro1 {...props} />;
    case "basic-1":
    default:
      return <DynamicBasic1 {...props} />;
  }
}
