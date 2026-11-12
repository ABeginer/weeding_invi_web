"use client";

import * as React from "react";
import type { WeddingContent } from "@/lib/types";
import { createDefaultWeddingContent } from "@/lib/wedding-content";

const WeddingContentContext = React.createContext<WeddingContent | null>(null);
const InvitationRuntimeContext = React.createContext<{
  contained: boolean;
  isDemo: boolean;
}>({
  contained: false,
  isDemo: false,
});

export function WeddingContentProvider({
  content,
  contained = false,
  isDemo = false,
  children,
}: {
  content: WeddingContent;
  contained?: boolean;
  isDemo?: boolean;
  children: React.ReactNode;
}) {
  const runtime = React.useMemo(
    () => ({ contained, isDemo }),
    [contained, isDemo]
  );

  return (
    <InvitationRuntimeContext.Provider value={runtime}>
      <WeddingContentContext.Provider value={content}>
        {children}
      </WeddingContentContext.Provider>
    </InvitationRuntimeContext.Provider>
  );
}

export function useWeddingContent(): WeddingContent {
  const ctx = React.useContext(WeddingContentContext);
  return ctx ?? createDefaultWeddingContent();
}

export function useInvitationContained(): boolean {
  return React.useContext(InvitationRuntimeContext).contained;
}

export function useInvitationDemoMode(): boolean {
  return React.useContext(InvitationRuntimeContext).isDemo;
}
