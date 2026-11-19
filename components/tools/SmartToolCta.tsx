"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SmartToolCtaProps {
  eyebrow: string;
  title: React.ReactNode;
  description: React.ReactNode;
  buttonText: string;
  buttonHref: string;
  highlightPulse?: boolean;
  className?: string;
}

export function SmartToolCta({
  eyebrow,
  title,
  description,
  buttonText,
  buttonHref,
  highlightPulse = false,
  className,
}: SmartToolCtaProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[#E8E2D9]/20 bg-[#1F1D1A] p-6 sm:p-7 text-[#FAF8F5] shadow-md transition-all duration-300",
        highlightPulse &&
          "ring-2 ring-[#B89B72] shadow-[0_0_25px_rgba(184,155,114,0.35)] transition-shadow duration-300",
        className,
      )}
    >
      {/* Decorative subtle background ambiance */}
      <div
        className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-[#B89B72]/15 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative z-10">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.16em] uppercase text-[#B89B72]">
          <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{eyebrow}</span>
        </div>

        <h3 className="mt-2 font-serif text-xl font-normal leading-snug text-white sm:text-2xl">
          {title}
        </h3>

        <div className="mt-2 text-xs leading-relaxed text-[#D4CDC5] sm:text-sm">
          {description}
        </div>

        <div className="mt-5">
          <Link
            href={buttonHref}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#7A1C24] px-5 text-xs font-medium text-white shadow-xs transition-all duration-200 hover:bg-[#5E141B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89B72] sm:text-sm"
          >
            <span>{buttonText}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
