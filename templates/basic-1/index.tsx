"use client";

import * as React from "react";
import { InvitationShell } from "@/components/invitation/InvitationShell";
import { WeddingContentProvider } from "@/components/invitation/WeddingContentProvider";
import { WeddingInvitationContent } from "@/components/invitation/WeddingInvitationContent";
import type { WeddingTemplateProps } from "../types";

export default function Basic1Template({
  data,
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
  const isReadOnlyPreview = mode === "demo" || mode === "preview";
  const resolvedExternalMusic = externalMusicControl ?? isReadOnlyPreview;
  const resolvedGuestName =
    guestName !== undefined
      ? guestName
      : mode === "demo"
        ? data.ui.defaultGuestName
        : null;

  return (
    <WeddingContentProvider data={data} contained={contained} mode={mode}>
      <div
        className={
          viewport === "desktop" && !contained
            ? "mx-auto w-full max-w-[1280px]"
            : "h-full w-full"
        }
      >
        <InvitationShell
          guestName={resolvedGuestName}
          contained={contained}
          externalMusicControl={resolvedExternalMusic}
          initialOpened={isOpened}
          onOpenedChange={onOpenedChange}
        >
          <WeddingInvitationContent
            slug={inviteSlug}
            weddingSlug={weddingSlug ?? data.weddingSlug}
            mode={isReadOnlyPreview ? "personal" : invitationMode}
            guestName={resolvedGuestName ?? undefined}
            initialStatus={initialStatus}
          />
        </InvitationShell>
      </div>
    </WeddingContentProvider>
  );
}
