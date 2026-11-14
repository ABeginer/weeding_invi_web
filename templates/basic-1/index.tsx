"use client";

import * as React from "react";
import { GiftModal } from "@/components/invitation/GiftModal";
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
  initialPlusOnes = 0,
  initialDiet = null,
  initialSongRequest = null,
  initialRideNeeded = false,
}: WeddingTemplateProps) {
  const isReadOnlyPreview = mode === "demo" || mode === "preview";
  const resolvedExternalMusic = externalMusicControl ?? isReadOnlyPreview;
  const [giftOpen, setGiftOpen] = React.useState(false);

  const handleOpenedChange = (next: boolean) => {
    onOpenedChange?.(next);
  };

  const resolvedGuestName =
    guestName !== undefined
      ? guestName
      : mode === "demo"
        ? data.ui.defaultGuestName
        : null;

  return (
    <WeddingContentProvider
      data={data}
      contained={contained}
      viewport={viewport}
      mode={mode}
    >
      <div
        className={
          viewport === "desktop" && !contained
            ? "w-full"
            : "h-full w-full"
        }
      >
        <InvitationShell
          guestName={resolvedGuestName}
          contained={contained}
          externalMusicControl={resolvedExternalMusic}
          initialOpened={isOpened}
          onOpenedChange={handleOpenedChange}
        >
          <WeddingInvitationContent
            slug={inviteSlug}
            weddingSlug={weddingSlug ?? data.weddingSlug}
            mode={isReadOnlyPreview ? "personal" : invitationMode}
            guestName={resolvedGuestName ?? undefined}
            initialStatus={initialStatus}
            initialPlusOnes={initialPlusOnes}
            initialDiet={initialDiet}
            initialSongRequest={initialSongRequest}
            initialRideNeeded={initialRideNeeded}
            onOpenGift={() => setGiftOpen(true)}
          />
        </InvitationShell>

        <GiftModal
          open={giftOpen}
          onClose={() => setGiftOpen(false)}
          gift={data.gift}
          plan={data.plan}
          tone="olive"
          wishAnchorId="rsvp-wishes"
        />
      </div>
    </WeddingContentProvider>
  );
}
