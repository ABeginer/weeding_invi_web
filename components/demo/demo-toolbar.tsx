"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ProfileMenu } from "@/components/theme/ProfileMenu";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LANDING_COPY } from "@/config/landing";
import { resolveDemoBackNavigation } from "@/lib/demo-return";
import type { WeddingPlan } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { WeddingTemplateMeta } from "@/templates/types";
import { globalAudio } from "@/lib/global-audio";
import { MusicToggle } from "./music-toggle";
import { ViewSwitcher, type DemoViewportMode } from "./view-switcher";

interface DemoToolbarProps {
  template: WeddingTemplateMeta;
  viewport: DemoViewportMode;
  isAuthenticated: boolean;
  userEmail?: string | null;
  ctaLabel?: string;
  onViewportChange: (next: DemoViewportMode) => void;
  onUseTemplate: () => void;
}

function getBadgeClasses(plan: WeddingPlan): string {
  if (plan === "free") {
    return "border-sage bg-surface text-text";
  }
  if (plan === "pro") {
    return "border-accent bg-accent text-accent-fg font-semibold";
  }
  return "border-vip-border bg-vip-bg text-vip-fg font-semibold";
}

export function DemoToolbar({
  template,
  viewport,
  isAuthenticated,
  userEmail,
  ctaLabel,
  onViewportChange,
  onUseTemplate,
}: DemoToolbarProps) {
  const router = useRouter();
  const badgeLabel = LANDING_COPY.templates.planBadges[template.plan];
  const resolvedCtaLabel = ctaLabel || LANDING_COPY.demo.useNowLabel;

  const handleBack = () => {
    globalAudio.stop();
    const target = resolveDemoBackNavigation();
    if (target.type === "back") {
      router.back();
    } else {
      router.push(target.href);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-bg/95 text-text sm:bg-bg/85 sm:backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:px-6">
          {/* Trái: Quay lại & Tên mẫu */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex h-8 shrink-0 cursor-pointer items-center rounded-full border border-border bg-surface px-3 text-xs font-medium text-text transition-colors hover:border-accent hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              {LANDING_COPY.demo.backToTemplates}
            </button>

            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate font-display text-base font-semibold text-accent-text sm:text-lg">
                {template.name}
              </h1>
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                  getBadgeClasses(template.plan),
                )}
              >
                {badgeLabel}
              </span>
            </div>
          </div>

          {/* Giữa: Segmented View Switcher (chỉ hiển thị trên tablet/desktop) */}
          <div className="hidden md:flex items-center justify-center">
            <ViewSwitcher value={viewport} onChange={onViewportChange} />
          </div>

          {/* Phải (Mobile): Nhạc + Theme/Profile */}
          <div className="flex items-center gap-2 md:hidden">
            <MusicToggle
              src={template.defaultMusic.src}
              title={template.defaultMusic.title}
              resetKey={template.id}
              autoPlay={true}
              compact
            />
            {isAuthenticated ? (
              <ProfileMenu email={userEmail} />
            ) : (
              <ThemeToggle />
            )}
          </div>

          {/* Phải (Desktop): Nhạc + Theme/Profile + CTA */}
          <div className="hidden items-center gap-2.5 md:flex">
            <MusicToggle
              src={template.defaultMusic.src}
              title={template.defaultMusic.title}
              resetKey={template.id}
              autoPlay={true}
              compact
            />
            {isAuthenticated ? (
              <ProfileMenu email={userEmail} />
            ) : (
              <ThemeToggle />
            )}
            <button
              type="button"
              onClick={onUseTemplate}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-accent px-5 text-xs font-semibold tracking-wide text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg sm:text-sm"
            >
              <span>{resolvedCtaLabel}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* CTA cố định dưới đáy trên điện thoại */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <button
          type="button"
          onClick={onUseTemplate}
          className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-fg shadow-lg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          <span>{resolvedCtaLabel}</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </>
  );
}
