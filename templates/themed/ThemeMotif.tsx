import * as React from "react";
import { cn } from "@/lib/utils";

export type MotifType =
  | "sakura"
  | "porcelain"
  | "hearts"
  | "rustic"
  | "crown"
  | "dragon"
  | "orchid"
  | "lace"
  | "double-happiness"
  | "phoenix"
  | "silk-ribbon"
  | "lotus"
  | "spring-flowers"
  | "botanical"
  | "glasshouse"
  | "forest";

interface ThemeMotifProps {
  type: MotifType;
  color?: string;
  className?: string;
  size?: number;
}

export function ThemeMotif({
  type,
  color = "currentColor",
  className = "theme-motif w-8 h-8",
  size = 32,
}: ThemeMotifProps) {
  switch (type) {
    case "sakura":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("theme-motif", className)}
        >
          <path d="M12 3c-1.5 2.5-3 4-6 4 1 2 2 3.5 1.5 6 2.5-.5 4.5 0 6 2 1.5-2 3.5-2.5 6-2-.5-2.5.5-4 1.5-6-3 0-4.5-1.5-6-4z" />
          <circle cx="12" cy="11" r="1.5" fill={color} />
        </svg>
      );

    case "double-happiness":
      return (
        <svg
          viewBox="0 0 32 32"
          width={size}
          height={size}
          fill={color}
          className={cn("theme-motif", className)}
        >
          <rect x="4" y="5" width="10" height="2" rx="0.5" />
          <rect x="18" y="5" width="10" height="2" rx="0.5" />
          <rect x="8" y="5" width="2" height="22" rx="0.5" />
          <rect x="22" y="5" width="2" height="22" rx="0.5" />
          <rect x="4" y="11" width="10" height="2" rx="0.5" />
          <rect x="18" y="11" width="10" height="2" rx="0.5" />
          <rect x="4" y="17" width="10" height="2" rx="0.5" />
          <rect x="18" y="17" width="10" height="2" rx="0.5" />
          <rect x="4" y="25" width="10" height="2" rx="0.5" />
          <rect x="18" y="25" width="10" height="2" rx="0.5" />
          <rect x="12" y="11" width="2" height="8" rx="0.5" />
          <rect x="26" y="11" width="2" height="8" rx="0.5" />
        </svg>
      );

    case "lotus":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("theme-motif", className)}
        >
          <path d="M12 3c1.5 3 2.5 6 0 10-2.5-4-1.5-7 0-10z" />
          <path d="M12 13c3-1.5 5.5-2 7 1-1.5 3-4.5 4-7 1.5z" />
          <path d="M12 13c-3-1.5-5.5-2-7 1 1.5 3 4.5 4 7 1.5z" />
          <path d="M12 15.5c2 2 5 2.5 7.5.5-2 3.5-5.5 4-7.5 2z" />
          <path d="M12 15.5c-2 2-5 2.5-7.5.5 2 3.5 5.5 4 7.5 2z" />
          <path d="M6 21c3-.8 9-.8 12 0" />
        </svg>
      );

    case "crown":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("theme-motif", className)}
        >
          <path d="M4 18h16l1-11-4.5 3.5L12 4 7.5 10.5 3 7l1 11z" />
          <circle cx="12" cy="4" r="1" fill={color} />
          <circle cx="3" cy="7" r="1" fill={color} />
          <circle cx="21" cy="7" r="1" fill={color} />
          <path d="M6 18v2h12v-2" />
        </svg>
      );

    case "dragon":
    case "phoenix":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("theme-motif", className)}
        >
          <path d="M12 2C8 4 6 8 8 12c-2 1-4 3-4 6 3 0 6-1 8-4 2 3 5 4 8 4 0-3-2-5-4-6 2-4 0-8-4-10z" />
          <path d="M12 12v9" />
          <path d="M9 16c1.5 1 3 1 4.5 0" />
        </svg>
      );

    case "porcelain":
    case "lace":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("theme-motif", className)}
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3v18" />
          <path d="M3 12h18" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="1.5" fill={color} />
        </svg>
      );

    case "orchid":
    case "spring-flowers":
    case "botanical":
    case "forest":
    case "glasshouse":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("theme-motif", className)}
        >
          <path d="M12 21V11" />
          <path d="M12 11c-2-3-5-4-7-3 0 3 2 6 7 6z" />
          <path d="M12 14c2-3 5-4 7-3 0 3-2 6-7 6z" />
          <circle cx="12" cy="7" r="3" />
          <circle cx="12" cy="7" r="1" fill={color} />
        </svg>
      );

    case "hearts":
    case "rustic":
    case "silk-ribbon":
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("theme-motif", className)}
        >
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      );
  }
}
