"use client";

import type { GuestDiet, GuestStatus } from "@/lib/types";
import { Couple } from "./Couple";
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

interface WeddingInvitationContentProps {
  slug?: string;
  weddingSlug?: string;
  mode?: "personal" | "public";
  guestName?: string;
  initialStatus?: GuestStatus;
  initialPlusOnes?: number;
  initialDiet?: GuestDiet | null;
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
  onOpenGift,
}: WeddingInvitationContentProps) {
  return (
    <>
      <Petals />
      <main className="relative z-10">
        {/* #1 Hero */}
        <Hero guestName={guestName} />
        {/* #3 Gia đình hai bên */}
        <Families />
        {/* #4 Cô dâu chú rể */}
        <Couple />
        {/* #5 Lời mời */}
        <InvitationIntro guestName={guestName} />
        {/* #6 Dải ba ảnh cưới */}
        <PhotoTriptych />
        {/* #7 Sự kiện */}
        <EventDetails />
        {/* #8 Đếm ngược */}
        <Countdown />
        {/* #9 Thư viện ảnh */}
        <Gallery />
        {/* #10 Xác nhận tham dự & Gửi lời chúc */}
        <RsvpWishBlock
          slug={slug}
          weddingSlug={weddingSlug}
          mode={mode}
          guestName={guestName}
          initialStatus={initialStatus}
          initialPlusOnes={initialPlusOnes}
          initialDiet={initialDiet}
        />
        {/* #11 Mừng cưới (sau khi xác nhận) */}
        <GiftQR onOpenGift={onOpenGift} />
      </main>
      {/* #12 Lời cảm ơn */}
      <Footer />
    </>
  );
}
