"use client";

import * as React from "react";
import type { GuestDiet, GuestStatus, TemplateData } from "@/lib/types";
import Basic1Template from "./basic-1";
import { TemplatePreviewRenderer } from "./TemplatePreviewRenderer";

interface LiveTemplateRendererProps {
  templateId?: string;
  data: TemplateData;
  inviteSlug?: string;
  weddingSlug?: string;
  invitationMode: "personal" | "public";
  guestName?: string | null;
  initialStatus?: GuestStatus;
  initialPlusOnes?: number;
  initialDiet?: GuestDiet | null;
}

export function LiveTemplateRenderer({
  templateId = "basic-1",
  data,
  inviteSlug,
  weddingSlug,
  invitationMode,
  guestName,
  initialStatus = "pending",
  initialPlusOnes = 0,
  initialDiet = null,
}: LiveTemplateRendererProps) {
  if (templateId !== "basic-1" && templateId !== "ritual-an-hoi") {
    return (
      <TemplatePreviewRenderer
        templateId={templateId}
        data={data}
        mode="live"
        contained={false}
        viewport="desktop"
        externalMusicControl={false}
        inviteSlug={inviteSlug}
        weddingSlug={weddingSlug}
        invitationMode={invitationMode}
        guestName={guestName}
        initialStatus={initialStatus}
        initialPlusOnes={initialPlusOnes}
        initialDiet={initialDiet}
      />
    );
  }

  return (
    <Basic1Template
      data={data}
      mode="live"
      contained={false}
      viewport="desktop"
      externalMusicControl={false}
      inviteSlug={inviteSlug}
      weddingSlug={weddingSlug}
      invitationMode={invitationMode}
      guestName={guestName}
      initialStatus={initialStatus}
      initialPlusOnes={initialPlusOnes}
      initialDiet={initialDiet}
    />
  );
}
