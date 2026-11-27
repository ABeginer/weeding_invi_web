"use client";

import type { GuestDiet, GuestStatus } from "@/lib/types";
import { Couple } from "./Couple";
import "@/styles/invitation-templates.css";
import { Countdown } from "./Countdown";
import { EventDetails } from "./EventDetails";
import { Families } from "./Families";
import { Footer } from "./Footer";
import { Gallery } from "./Gallery";
import { GiftQR } from "./GiftQR";
import { Hero } from "./Hero";
import { InvitationIntro } from "./InvitationIntro";
import { Petals } from "./Petals";
import { PhotoTriptych } from "./PhotoTriptych";
import { RsvpWishBlock } from "./RsvpWishBlock";
import { useInvitationContained } from "./WeddingContentProvider";

interface WeddingInvitationContentProps {
  slug?: string;
  weddingSlug?: string;
  mode?: "personal" | "public";
  guestName?: string;
  initialStatus?: GuestStatus;
  initialPlusOnes?: number;
  initialDiet?: GuestDiet | null;
  initialSongRequest?: string | null;
  initialRideNeeded?: boolean;
  onOpenGift?: () => void;
}

export function WeddingInvitationContent({
  slug,
  weddingSlug,
  mode = "personal",
  guestName,
  initialStatus = "pending",
  initialPlusOnes = 0,
  initialDiet = null,
  initialSongRequest = null,
  initialRideNeeded = false,
  onOpenGift,
}: WeddingInvitationContentProps) {
  const isContained = useInvitationContained();
  const MainTag = isContained ? "div" : "main";

  return (
    <>
      <Petals />
      <MainTag className="relative z-10">
        {/* #1 Hero */}
        <Hero guestName={guestName} />
        <InvitationIntro guestName={guestName} />
        {/* #2 Gia đình hai bên & Cô dâu chú rể */}
        <Families />
        <Couple />
        {/* #3 Lễ & Sự kiện */}
        <EventDetails />
        {/* #6 Lịch cưới & Đếm ngược */}
        <Countdown />
        {/* #7 Hộp quà mừng */}
        <GiftQR onOpenGift={onOpenGift} />
        {/* #8 Xác nhận tham dự */}
        <RsvpWishBlock
          slug={slug}
          weddingSlug={weddingSlug}
          mode={mode}
          guestName={guestName}
          initialStatus={initialStatus}
          initialPlusOnes={initialPlusOnes}
          initialDiet={initialDiet}
          initialSongRequest={initialSongRequest}
          initialRideNeeded={initialRideNeeded}
        />
        {/* #9 Album ảnh */}
        <PhotoTriptych />
        <Gallery />
      </MainTag>
      {/* #12 Lời cảm ơn */}
      <Footer />
    </>
  );
}
