"use client";

import { RevealSection } from "./RevealSection";
import { useWeddingContent } from "./WeddingContentProvider";

interface InvitationIntroProps {
  guestName?: string;
}

export function InvitationIntro({ guestName }: InvitationIntroProps) {
  const wedding = useWeddingContent();
  const displayName =
    guestName && guestName.trim().length > 0
      ? guestName.trim()
      : wedding.sections.defaultGuestName;

  return (
    <RevealSection className="bg-inv-bg px-5 pt-10 pb-8 text-center">
      <p className="font-inv-serif text-[clamp(20px,5.6vw,26px)] leading-[1.25] font-normal tracking-[0.04em] text-inv-olive-deep uppercase">
        {wedding.sections.invitationPrefix}
      </p>

      <h2 className="mx-auto mt-4 w-[min(78%,340px)] border-b border-dotted border-inv-olive/55 px-2 pb-1.5 font-inv-script text-[clamp(28px,8.5vw,38px)] leading-[1.2] font-normal text-inv-olive-deep break-words">
        {displayName}
      </h2>

      <p className="mx-auto mt-5 max-w-[420px] font-inv-serif text-[14px] leading-[1.6] text-inv-text sm:text-[15.5px]">
        {wedding.invitationNote}
      </p>
    </RevealSection>
  );
}
