"use client";

import * as React from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FeatureInfoPopoverProps {
  content: string;
  variant?: "light" | "dark";
  className?: string;
}

export function FeatureInfoPopover({
  content,
  variant = "light",
  className,
}: FeatureInfoPopoverProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [horizontalShift, setHorizontalShift] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const popoverRef = React.useRef<HTMLDivElement | null>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    clearCloseTimeout();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    clearCloseTimeout();
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 120);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearCloseTimeout();
    setIsOpen((prev) => !prev);
  };

  // Tự động căn chỉnh vị trí popover để không bị tràn màn hình (đặc biệt trên màn hình 375px)
  React.useEffect(() => {
    if (!isOpen || !popoverRef.current) {
      setHorizontalShift(0);
      return;
    }

    const updatePosition = () => {
      if (!popoverRef.current) return;
      const rect = popoverRef.current.getBoundingClientRect();
      const padding = 12; // Khoảng cách tối thiểu tới mép màn hình
      const viewportWidth = window.innerWidth;

      if (rect.left < padding) {
        setHorizontalShift(padding - rect.left);
      } else if (rect.right > viewportWidth - padding) {
        setHorizontalShift(viewportWidth - padding - rect.right);
      } else {
        setHorizontalShift(0);
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [isOpen]);

  // Đóng khi bấm ra ngoài hoặc nhấn phím Escape
  React.useEffect(() => {
    if (!isOpen) return;

    const handlePointerDownOutside = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDownOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDownOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-flex items-center", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={handleClick}
        aria-label="Tìm hiểu thêm về tính năng"
        aria-expanded={isOpen}
        className={cn(
          "inline-flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
          variant === "dark"
            ? "text-[#FAF8F5]/60 hover:text-[#B89B72]"
            : "text-[#6B655E] hover:text-[#7A1C24]",
        )}
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          role="tooltip"
          style={{
            transform: `translateX(calc(-50% + ${horizontalShift}px))`,
          }}
          className={cn(
            "absolute bottom-full left-1/2 z-50 mb-2 w-64 max-w-[calc(100vw-24px)] rounded-xl p-3 text-xs leading-relaxed shadow-xl transition-all duration-150 animate-in fade-in-0 zoom-in-95",
            // Hover bridge: Vùng đệm vô hình nối liền nút và tooltip để con trỏ chuột không bị rớt focus
            "before:absolute before:-bottom-2.5 before:left-0 before:right-0 before:h-3 before:content-['']",
            variant === "dark"
              ? "border border-[#E8E2D9] bg-[#FAF8F5] text-[#1F1D1A]"
              : "border border-[#B89B72]/30 bg-[#1F1D1A] text-[#FAF8F5]",
          )}
        >
          <p className="font-normal font-sans tracking-normal select-text">
            {content}
          </p>
          {/* Mũi tên nhỏ trỏ về icon */}
          <div
            style={{
              left: `calc(50% - ${horizontalShift}px)`,
            }}
            className={cn(
              "absolute -bottom-1 h-2 w-2 -translate-x-1/2 rotate-45",
              variant === "dark"
                ? "border-b border-r border-[#E8E2D9] bg-[#FAF8F5]"
                : "border-b border-r border-[#B89B72]/30 bg-[#1F1D1A]",
            )}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}
