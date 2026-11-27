"use client";

import * as React from "react";
import type { GuestDiet, GuestStatus, TemplateData } from "@/lib/types";
import { TemplatePreviewRenderer } from "./TemplatePreviewRenderer";
import "@/styles/invitation-templates.css";

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
  initialSongRequest?: string | null;
  initialRideNeeded?: boolean;
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
  initialSongRequest = null,
  initialRideNeeded = false,
}: LiveTemplateRendererProps) {
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
      initialSongRequest={initialSongRequest}
      initialRideNeeded={initialRideNeeded}
    />
  );
}
