"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { MotionProvider } from "@/components/theme/MotionProvider";
import { playOpenCardSound } from "@/lib/sound-effects";
import type { GuestDiet, GuestStatus, TemplateData } from "@/lib/types";
import { TemplatePreviewRenderer } from "./TemplatePreviewRenderer";

const DynamicBasic1 = dynamic(() => import("./basic-1"), {
  loading: () => (
    <div className="flex h-full min-h-[320px] w-full items-center justify-center bg-[#FAF8F5]/90 text-[#5C554E] backdrop-blur-xs">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#B89B72] border-t-transparent" />
        <p className="font-serif text-sm tracking-wide">Đang tải giao diện thiệp...</p>
      </div>
    </div>
  ),
});

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
  React.useEffect(() => {
    const handleEnvelopeOpen = () => {
      playOpenCardSound();
    };
    window.addEventListener("inviwedd:open-envelope", handleEnvelopeOpen);
    return () => {
      window.removeEventListener("inviwedd:open-envelope", handleEnvelopeOpen);
    };
  }, []);

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
