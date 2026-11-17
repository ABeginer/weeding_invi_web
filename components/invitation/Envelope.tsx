"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  useInvitationContained,
  useInvitationDesktopLayout,
  useWeddingContent,
} from "./WeddingContentProvider";

interface EnvelopeProps {
  guestName?: string | null;
  onOpen: () => void;
  contained?: boolean;
}

const DOOR_EASE = [0.22, 1, 0.36, 1] as const;

function BotanicalLineArt() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/templates/basic-1/line-flowers.webp"
      alt=""
      aria-hidden="true"
      className="h-full w-full select-none object-contain object-center opacity-30 mix-blend-multiply"
    />
  );
}

export function Envelope({ guestName, onOpen, contained = false }: EnvelopeProps) {
  const data = useWeddingContent();
  const isContained = useInvitationContained() || contained;
  const desktopLayout = useInvitationDesktopLayout();
  const isDesktopLayout = desktopLayout && !isContained;
  const prefersReducedMotion = useReducedMotion();
  const [opening, setOpening] = React.useState(false);

  const displayName =
    guestName && guestName.trim().length > 0
      ? guestName.trim()
      : data.ui.defaultGuestName;

  const handleOpen = () => {
    if (opening) return;
    if (prefersReducedMotion) {
      onOpen();
      return;
    }
    setOpening(true);
    onOpen();
  };

  return (
    <div
      className={
        isContained
          ? opening
            ? "pointer-events-none absolute inset-0 z-40 h-full w-full overflow-hidden"
            : "absolute inset-0 z-40 h-full w-full overflow-hidden"
          : cn(
            "fixed inset-y-0 left-1/2 z-50 w-full -translate-x-1/2 overflow-hidden",
            isDesktopLayout ? "max-w-[960px]" : "max-w-[500px]",
            opening
              ? "pointer-events-none md:border-x md:border-inv-olive/15"
              : "md:border-x md:border-inv-olive/15 md:shadow-[0_12px_40px_color-mix(in_srgb,var(--inv-olive-deep)_10%,transparent)]",
          )
      }
      aria-label="Thiệp mời cưới"
    >
      <motion.div
        aria-hidden="true"
        initial={false}
        animate={
          opening
            ? prefersReducedMotion
              ? { opacity: 0 }
              : { x: "-105%" }
            : { x: "0%", opacity: 1 }
        }
        transition={
          prefersReducedMotion
            ? { duration: 0.01 }
            : { duration: 0.9, ease: DOOR_EASE }
        }
        className="pointer-events-none absolute inset-y-0 left-0 z-20 w-[63.2%] will-change-transform"
      >
        <div
          className="relative h-full w-[79.1139%] overflow-hidden border-r border-inv-olive/20 bg-inv-paper shadow-[4px_0_18px_color-mix(in_srgb,var(--inv-olive-deep)_12%,transparent)]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--inv-bg) 70%, transparent) 0%, transparent 65%), repeating-linear-gradient(115deg, color-mix(in srgb, var(--inv-olive-deep) 1.4%, transparent) 0px, transparent 1px, transparent 3px)",
          }}
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 w-[200%]">
            <BotanicalLineArt />
          </div>
        </div>

        <div
          className={cn(
            "absolute top-1/2 left-[79.1139%] z-30 -translate-x-1/2 -translate-y-1/2",
            isContained
              ? "h-[74px] w-[74px]"
              : isDesktopLayout
                ? "h-[96px] w-[96px] md:h-[116px] md:w-[116px]"
                : "h-[96px] w-[96px] sm:h-[108px] sm:w-[108px]",
          )}
        >
          <img
            src="/images/olive-wax-seal.webp"
            alt=""
            width={320}
            height={320}
            decoding="async"
            fetchPriority="high"
            aria-hidden="true"
            draggable={false}
            className="h-full w-full select-none object-contain drop-shadow-[2px_5px_10px_color-mix(in_srgb,var(--inv-olive-deep)_42%,transparent)]"
          />
        </div>
      </motion.div>

      <motion.div
        aria-hidden="true"
        initial={false}
        animate={
          opening
            ? prefersReducedMotion
              ? { opacity: 0 }
              : { x: "105%" }
            : { x: "0%", opacity: 1 }
        }
        transition={
          prefersReducedMotion
            ? { duration: 0.01 }
            : { duration: 0.9, ease: DOOR_EASE }
        }
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-[50%] overflow-hidden bg-inv-paper will-change-transform"
        style={{
          backgroundImage:
            "radial-gradient(circle at 80% 25%, color-mix(in srgb, var(--inv-bg) 70%, transparent) 0%, transparent 65%), repeating-linear-gradient(115deg, color-mix(in srgb, var(--inv-olive-deep) 1.4%, transparent) 0px, transparent 1px, transparent 3px)",
        }}
      >
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[200%]">
          <BotanicalLineArt />
        </div>
      </motion.div>

      <button
        type="button"
        onClick={handleOpen}
        disabled={opening}
        aria-label={`${data.ui.tapHint} - ${data.ui.invitePrefix} ${displayName}`}
        className={cn(
          "relative z-30 flex h-full w-full cursor-pointer flex-col items-center justify-between px-6 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-inv-olive-deep",
          isContained ? "pt-[14%] pb-[9%]" : "pt-[13dvh] pb-[6dvh]",
        )}
      >
        <motion.div
          animate={opening ? { opacity: 0, y: -6 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className={cn(
            "px-4 py-2",
            isDesktopLayout ? "max-w-[520px]" : "max-w-[340px]",
          )}
        >
          <p className="font-inv-serif text-[11px] font-medium uppercase tracking-[0.26em] text-inv-text">
            {data.ui.invitePrefix}
          </p>
          <p
            className={cn(
              "mt-2 font-inv-script leading-[1.15] text-inv-olive-deep",
              isContained
                ? "text-[clamp(24px,9.5cqw,36px)]"
                : isDesktopLayout
                  ? "text-[clamp(30px,4vw,46px)]"
                  : "text-[clamp(32px,9.5vw,44px)]",
            )}
          >
            {displayName}
          </p>
        </motion.div>

        <motion.span
          animate={opening ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="w-full"
        >
          <span className="inline-block font-inv-serif text-[12px] tracking-[0.14em] uppercase text-inv-tap-hint [text-shadow:0_1px_4px_rgba(255,255,255,0.95),0_0_10px_rgba(255,255,255,0.85)] motion-safe:animate-[inv-tap-hint-pulse_2.4s_ease-in-out_infinite]">
            {data.ui.tapHint}
          </span>
        </motion.span>
      </button>
    </div>
  );
}
