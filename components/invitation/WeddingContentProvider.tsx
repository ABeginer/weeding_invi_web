"use client";

import * as React from "react";
import type { WeddingContent } from "@/lib/types";
import { createDefaultWeddingContent } from "@/lib/wedding-content";

const WeddingContentContext = React.createContext<WeddingContent | null>(null);

export function WeddingContentProvider({
  content,
  children,
}: {
  content: WeddingContent;
  children: React.ReactNode;
}) {
  return (
    <WeddingContentContext.Provider value={content}>
      {children}
    </WeddingContentContext.Provider>
  );
}

export function useWeddingContent(): WeddingContent {
  const ctx = React.useContext(WeddingContentContext);
  return ctx ?? createDefaultWeddingContent();
}

