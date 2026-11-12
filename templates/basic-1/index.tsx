"use client";

import * as React from "react";
import { InvitationShell } from "@/components/invitation/InvitationShell";
import { WeddingContentProvider } from "@/components/invitation/WeddingContentProvider";
import { WeddingInvitationContent } from "@/components/invitation/WeddingInvitationContent";
import type { WeddingTemplateProps } from "../types";

export default function Basic1Template({
  content,
  mode,
  contained = false,
  viewport = "phone",
  isOpened = false,
  onOpenedChange,
  externalMusicControl,
  inviteSlug,
  weddingSlug,
  invitationMode = "personal",
  guestName,
  initialStatus = "pending",
}: WeddingTemplateProps) {
  const isDemo = mode === "demo";
  const resolvedExternalMusic = externalMusicControl ?? isDemo;
  const resolvedGuestName =
    guestName !== undefined
      ? guestName
      : isDemo
        ? content.envelope.defaultGuestName
        : null;

  return (
    <WeddingContentProvider content={content} contained={contained} isDemo={isDemo}>
      <div className={viewport === "desktop" && !contained ? "mx-auto w-full max-w-[1280px]" : "h-full w-full"}>
        <InvitationShell
          guestName={resolvedGuestName}
          contained={contained}
          externalMusicControl={resolvedExternalMusic}
          initialOpened={isOpened}
          onOpenedChange={onOpenedChange}
        >
          <WeddingInvitationContent
            slug={inviteSlug}
            weddingSlug={weddingSlug}
            mode={isDemo ? "personal" : invitationMode}
            guestName={resolvedGuestName ?? undefined}
            initialStatus={initialStatus}
          />
        </InvitationShell>
      </div>
    </WeddingContentProvider>
  );
}

