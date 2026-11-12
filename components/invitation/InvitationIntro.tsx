"use client";

import { cn } from "@/lib/utils";
import { RevealSection } from "./RevealSection";
import { useInvitationContained, useInvitationDesktopLayout, useWeddingContent } from "./WeddingContentProvider";

interface InvitationIntroProps {
  guestName?: string;
}

export function InvitationIntro({ guestName }: InvitationIntroProps) {
  const data = useWeddingContent();
  const isContained = useInvitationContained();
  const isDesktopLayout = useInvitationDesktopLayout();
  const displayName =
    guestName && guestName.trim().length > 0
      ? guestName.trim()
      : data.ui.defaultGuestName;

  return (
    <RevealSection className="bg-inv-bg px-5 pt-10 pb-8 text-center">
      <p
        className={cn(
          "font-inv-serif leading-[1.25] font-normal tracking-[0.04em] text-inv-olive-deep uppercase",
          isContained ? "text-[clamp(17px,5.6cqw,22px)]" : "text-[clamp(20px,5.6vw,26px)]",
        )}
      >
        {data.ui.invitePrefix}
      </p>

      <h2
        className={cn(
          "mx-auto mt-4 w-[min(78%,340px)] border-b border-dotted border-inv-olive/55 px-2 pb-1.5 font-inv-script leading-[1.2] font-normal text-inv-olive-deep break-words",
          isContained ? "text-[clamp(22px,8.5cqw,32px)]" : "text-[clamp(28px,8.5vw,38px)]",
        )}
      >
        {displayName}
      </h2>

      <p
        className={cn(
          "mx-auto mt-5 max-w-[420px] font-inv-serif text-[14px] leading-[1.6] text-inv-text sm:text-[15.5px]",
          isDesktopLayout && "md:max-w-[540px]",
        )}
      >
        {data.ui.invitationNote}
      </p>
    </RevealSection>
  );
}
