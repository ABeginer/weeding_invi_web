"use client";

import * as React from "react";
import type { TemplateData, TemplateMode } from "@/lib/types";
import { createDefaultWeddingContent, toTemplateData } from "@/lib/wedding-data";

const InvitationOpenedContext = React.createContext(true);
const WeddingContentContext = React.createContext<TemplateData | null>(null);
const InvitationRuntimeContext = React.createContext<{
  contained: boolean;
  viewport: "phone" | "desktop";
  mode: TemplateMode;
}>({
  contained: false,
  viewport: "phone",
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
  viewport = "phone",
  mode = "live",
  children,
}: {
  data: TemplateData;
  contained?: boolean;
  viewport?: "phone" | "desktop";
  mode?: TemplateMode;
  children: React.ReactNode;
}) {
  const runtime = React.useMemo(
    () => ({ contained, viewport, mode }),
    [contained, viewport, mode],
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

export function useInvitationDesktopLayout(): boolean {
  const ctx = React.useContext(InvitationRuntimeContext);
  return !ctx.contained && ctx.viewport === "desktop";
}

export function useInvitationMode(): TemplateMode {
  return React.useContext(InvitationRuntimeContext).mode;
}

export function useInvitationReadOnly(): boolean {
  const mode = React.useContext(InvitationRuntimeContext).mode;
  return mode === "demo" || mode === "preview";
}

export function useInvitationOpened(): boolean {
  return React.useContext(InvitationOpenedContext);
}

export { InvitationOpenedContext };
