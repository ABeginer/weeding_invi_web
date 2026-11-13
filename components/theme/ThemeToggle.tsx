"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrandTheme } from "./ThemeProvider";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useBrandTheme();
  const isDark = theme === "dark";
  const label = isDark
    ? "Chuyển sang giao diện sáng"
    : "Chuyển sang giao diện tối";

  return (
    <button
      type="button"
      onClick={() => {
        void toggleTheme();
      }}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-text transition-colors hover:border-accent hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
        className,
      )}
    >
      {isDark ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}

