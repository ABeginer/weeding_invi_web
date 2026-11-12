"use client";

import * as React from "react";
import type { TemplateData, TemplateMode } from "@/lib/types";
import { createDefaultWeddingContent, toTemplateData } from "@/lib/wedding-data";

const WeddingContentContext = React.createContext<TemplateData | null>(null);
const InvitationRuntimeContext = React.createContext<{
  contained: boolean;
  mode: TemplateMode;
}>({
  contained: false,
  mode: "live",
});

const FALLBACK_TEMPLATE_DATA: TemplateData = toTemplateData({
  content: createDefaultWeddingContent(),
  events: [],
  photos: [],
});

export function WeddingContentProvider({
  data,
  contained = false,
  mode = "live",
  children,
}: {
  data: TemplateData;
  contained?: boolean;
  mode?: TemplateMode;
  children: React.ReactNode;
}) {
  const runtime = React.useMemo(
    () => ({ contained, mode }),
    [contained, mode],
  );

  return (
    <InvitationRuntimeContext.Provider value={runtime}>
      <WeddingContentContext.Provider value={data}>
        {children}
      </WeddingContentContext.Provider>
    </InvitationRuntimeContext.Provider>
  );
}

export function useWeddingContent(): TemplateData {
  const ctx = React.useContext(WeddingContentContext);
  return ctx ?? FALLBACK_TEMPLATE_DATA;
}

export function useInvitationContained(): boolean {
  return React.useContext(InvitationRuntimeContext).contained;
}

export function useInvitationMode(): TemplateMode {
  return React.useContext(InvitationRuntimeContext).mode;
}

export function useInvitationReadOnly(): boolean {
  const mode = React.useContext(InvitationRuntimeContext).mode;
  return mode === "demo" || mode === "preview";
}
