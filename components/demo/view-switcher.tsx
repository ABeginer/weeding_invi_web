"use client";

import * as React from "react";
import { Monitor, Smartphone } from "lucide-react";
import { LANDING_COPY } from "@/config/landing";
import { cn } from "@/lib/utils";

export type DemoViewportMode = "phone" | "desktop";

interface ViewSwitcherProps {
  value: DemoViewportMode;
  onChange: (next: DemoViewportMode) => void;
  className?: string;
}

export function ViewSwitcher({ value, onChange, className }: ViewSwitcherProps) {
  return (
    <div
      role="group"
      aria-label={LANDING_COPY.demo.viewSwitcherAriaLabel}
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-surface p-1",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange("phone")}
        aria-pressed={value === "phone"}
        className={cn(
          "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-medium whitespace-nowrap transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1 focus-visible:ring-offset-bg",
          value === "phone"
            ? "bg-accent font-semibold text-accent-fg"
            : "text-text hover:text-accent-text",
        )}
      >
        <Smartphone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{LANDING_COPY.demo.phoneViewLabel}</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("desktop")}
        aria-pressed={value === "desktop"}
        className={cn(
          "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-medium whitespace-nowrap transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1 focus-visible:ring-offset-bg",
          value === "desktop"
            ? "bg-accent font-semibold text-accent-fg"
            : "text-text hover:text-accent-text",
        )}
      >
        <Monitor className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{LANDING_COPY.demo.desktopViewLabel}</span>
      </button>
    </div>
  );
}
