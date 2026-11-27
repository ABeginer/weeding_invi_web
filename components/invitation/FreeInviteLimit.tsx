"use client";

import Link from "next/link";
import { Heart, Lock } from "lucide-react";
import { DesignerGiftBox } from "@/components/designer/designer-gift-box";
import { TemplateRsvpSection } from "@/templates/shared/TemplateRsvpSection";
import type { WeddingTemplateProps } from "@/templates/types";

interface FreeInviteLimitProps {
  data: WeddingTemplateProps["data"];
  inviteSlug?: string;
  weddingSlug?: string;
  guestName: string;
  initialStatus?: WeddingTemplateProps["initialStatus"];
  initialPlusOnes?: number;
  initialDiet?: WeddingTemplateProps["initialDiet"];
  initialSongRequest?: string | null;
  initialRideNeeded?: boolean;
}

export function FreeInviteLimit({
  data,
  inviteSlug,
  weddingSlug,
  guestName,
  initialStatus = "pending",
  initialPlusOnes = 0,
  initialDiet = null,
  initialSongRequest = null,
  initialRideNeeded = false,
}: FreeInviteLimitProps) {
  return (
    <main
      className="min-h-screen-dvh px-4 py-10"
      style={{ backgroundColor: "#FAF7F2", color: "#3A1A1F" }}
    >
      <div className="mx-auto flex w-full max-w-[460px] flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4D1217] text-[#F8F1EA]">
          <Lock className="h-5 w-5" />
        </div>
        <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8D6A58]">
          Thiệp mời trực tuyến
        </p>
        <h1 className="mt-2 font-serif text-2xl font-semibold text-[#4D1217]">
          Thiệp miễn phí này đã hết số lần xem
        </h1>
        <p className="mt-2 max-w-[340px] text-sm leading-relaxed text-[#7C5B4B]">
          Bạn vẫn có thể gửi lời chúc và xem thông tin hộp quà mừng. Nếu cần xem
          lại toàn bộ thiệp, vui lòng liên hệ cô dâu chú rể.
        </p>

        <div className="mt-5 flex items-center gap-2 font-serif text-xl text-[#4D1217]">
          <span>{data.couple.groomName}</span>
          <Heart className="h-4 w-4 fill-current" />
          <span>{data.couple.brideName}</span>
        </div>
        <p className="mt-1 text-xs text-[#8D6A58]">Kính mời {guestName}</p>

        <div className="mt-8 w-full text-left">
          <DesignerGiftBox
            gift={data.gift}
            accentColor="#4D1217"
            textColor="#3A1A1F"
            mutedColor="#7C5B4B"
            fontFamily="var(--font-playfair)"
          />
        </div>

        <div className="mt-4 w-full text-left">
          <TemplateRsvpSection
            data={data}
            mode="live"
            tone="sunset"
            contained
            inviteSlug={inviteSlug}
            weddingSlug={weddingSlug ?? data.weddingSlug}
            invitationMode="personal"
            guestName={guestName}
            initialStatus={initialStatus}
            initialPlusOnes={initialPlusOnes}
            initialDiet={initialDiet}
            initialSongRequest={initialSongRequest}
            initialRideNeeded={initialRideNeeded}
          />
        </div>

        <Link
          href="/#bang-gia"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-full border border-[#D9C2AF] px-5 text-xs font-semibold text-[#4D1217]"
        >
          Nâng cấp gói Pro
        </Link>
      </div>
    </main>
  );
}
