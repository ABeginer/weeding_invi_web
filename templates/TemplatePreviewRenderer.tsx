"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { WeddingTemplateProps } from "./types";

function TemplateLoadingFallback() {
  return (
    <div
      aria-hidden="true"
      className="flex min-h-[540px] w-full flex-col items-center justify-center gap-4 bg-surface px-6 py-16 text-center animate-pulse motion-reduce:animate-none"
    >
      <div className="h-16 w-16 rounded-full border border-border bg-surface-alt" />
      <div className="h-4 w-32 rounded-full bg-border" />
      <div className="h-3 w-48 rounded-full bg-border/60" />
      <div className="mt-4 h-24 w-full max-w-[220px] rounded-xl border border-border bg-surface-alt/70" />
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
    case "ritual-gia-tien":
      return <DynamicBasic2 {...props} />;
    case "basic-3":
    case "ritual-vu-quy":
      return <DynamicBasic3 {...props} />;
    case "pro-1":
      return <DynamicPro1 {...props} />;
    case "basic-1":
    case "ritual-an-hoi":
    default:
      return <DynamicBasic1 {...props} />;
  }
}
