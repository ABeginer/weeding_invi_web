"use client";

import * as React from "react";
import { InvitationShell } from "@/components/invitation/InvitationShell";
import { WeddingContentProvider } from "@/components/invitation/WeddingContentProvider";
import { WeddingInvitationContent } from "@/components/invitation/WeddingInvitationContent";
import type { GuestStatus, WeddingContent } from "@/lib/types";
import { TemplatePreviewRenderer } from "./TemplatePreviewRenderer";

interface LiveTemplateRendererProps {
  templateId?: string;
  content: WeddingContent;
  inviteSlug?: string;
  weddingSlug?: string;
  invitationMode: "personal" | "public";
  guestName?: string | null;
  initialStatus?: GuestStatus;
}

export function LiveTemplateRenderer({
  templateId = "basic-1",
  content,
  inviteSlug,
  weddingSlug,
  invitationMode,
  guestName,
  initialStatus = "pending",
}: LiveTemplateRendererProps) {
  if (
    templateId === "basic-2" ||
    templateId === "basic-3" ||
    templateId === "pro-1"
  ) {
    return (
      <TemplatePreviewRenderer
        templateId={templateId}
        content={content}
        mode="live"
        contained={false}
        viewport="desktop"
        externalMusicControl={false}
        inviteSlug={inviteSlug}
        weddingSlug={weddingSlug}
        invitationMode={invitationMode}
        guestName={guestName}
        initialStatus={initialStatus}
      />
    );
  }

  return (
    <WeddingContentProvider content={content}>
      <InvitationShell guestName={guestName}>
        <WeddingInvitationContent
          slug={inviteSlug}
          weddingSlug={weddingSlug}
          mode={invitationMode}
          guestName={guestName ?? undefined}
          initialStatus={initialStatus}
        />
      </InvitationShell>
    </WeddingContentProvider>
  );
}

