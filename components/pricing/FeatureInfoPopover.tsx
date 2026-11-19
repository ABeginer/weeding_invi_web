"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FeatureInfoPopoverProps {
  content: string;
  title?: string;
  variant?: "light" | "dark";
  className?: string;
}

export function FeatureInfoPopover({
  content,
  title,
  variant = "light",
  className,
}: FeatureInfoPopoverProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [horizontalShift, setHorizontalShift] = React.useState(0);
  const [mounted, setMounted] = React.useState(false);

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const popoverRef = React.useRef<HTMLDivElement | null>(null);
  const mobileModalRef = React.useRef<HTMLDivElement | null>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const clearCloseTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handlePointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") {
      clearCloseTimeout();
      setIsOpen(true);
    }
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") {
      clearCloseTimeout();
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 120);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearCloseTimeout();
    setIsOpen((prev) => !prev);
  };

  // Tự động căn chỉnh vị trí popover trên desktop để không bị tràn mép màn hình
  React.useEffect(() => {
    if (!isOpen || !popoverRef.current) {
      setHorizontalShift(0);
      return;
    }

    const updatePosition = () => {
      if (!popoverRef.current) return;
      const rect = popoverRef.current.getBoundingClientRect();
      const padding = 16;
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

    const handlePointerDownOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      const clickedTrigger = containerRef.current?.contains(target);
      const clickedMobileModal = mobileModalRef.current?.contains(target);

      if (!clickedTrigger && !clickedMobileModal) {
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
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      {/* Expanded invisible touch hit target (at least 36-40px) without shifting layout */}
      <button
        type="button"
        onClick={handleClick}
        aria-label="Xem giải thích tính năng"
        aria-expanded={isOpen}
        className={cn(
          "inline-flex items-center justify-center p-2 -m-2 rounded-full touch-manipulation cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B89B72]",
          variant === "dark"
            ? "text-[#FAF8F5]/60 hover:text-[#B89B72]"
            : "text-[#6B655E] hover:text-[#7A1C24]",
        )}
      >
        <Info className="h-[18px] w-[18px]" aria-hidden="true" />
      </button>

      {/* Desktop Floating Popover (sm: and up) */}
      {isOpen && (
        <div
          ref={popoverRef}
          role="tooltip"
          style={{
            transform: `translateX(calc(-50% + ${horizontalShift}px))`,
          }}
          className={cn(
            "hidden sm:block absolute bottom-full left-1/2 z-50 mb-2.5 w-72 sm:w-80 rounded-xl p-4 shadow-xl transition-all duration-150 animate-in fade-in-0 zoom-in-95",
            // Hover bridge: Vùng đệm vô hình nối liền nút và tooltip
            "before:absolute before:-bottom-2.5 before:left-0 before:right-0 before:h-3 before:content-['']",
            variant === "dark"
              ? "border border-[#E8E2D9] bg-[#FAF8F5] text-[#1F1D1A]"
              : "border border-[#B89B72]/30 bg-[#1F1D1A] text-[#FAF8F5]",
          )}
        >
          {title && (
            <h4
              className={cn(
                "font-semibold text-[15px] mb-1 font-sans",
                variant === "dark" ? "text-[#1F1D1A]" : "text-[#FAF8F5]",
              )}
            >
              {title}
            </h4>
          )}
          <p
            className={cn(
              "text-sm leading-relaxed font-sans select-text",
              variant === "dark" ? "text-[#6B655E]" : "text-[#FAF8F5]/90",
            )}
          >
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

      {/* Mobile Bottom-Sheet Mini-Modal (< sm: 375px viewport optimized via Portal) */}
      {isOpen &&
        mounted &&
        createPortal(
          <div className="sm:hidden">
            {/* Dimmed Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              aria-hidden="true"
            />

            {/* Bottom Sheet Card */}
            <div
              ref={mobileModalRef}
              role="dialog"
              aria-modal="true"
              aria-label={title || "Xem giải thích tính năng"}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "fixed inset-x-4 bottom-6 z-50 max-w-md mx-auto rounded-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-200",
                variant === "dark"
                  ? "border border-[#E8E2D9] bg-[#FAF8F5] text-[#1F1D1A]"
                  : "border border-[#B89B72]/40 bg-[#1F1D1A] text-[#FAF8F5]",
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4
                  className={cn(
                    "font-semibold text-[15px] font-sans",
                    variant === "dark" ? "text-[#1F1D1A]" : "text-[#FAF8F5]",
                  )}
                >
                  {title || "Chi tiết tính năng"}
                </h4>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  aria-label="Đóng"
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors cursor-pointer shrink-0 -mr-1.5 -mt-1.5",
                    variant === "dark"
                      ? "text-[#6B655E] hover:bg-black/5 hover:text-[#1F1D1A]"
                      : "text-[#FAF8F5]/60 hover:bg-white/10 hover:text-[#FAF8F5]",
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p
                className={cn(
                  "text-sm leading-relaxed font-sans",
                  variant === "dark" ? "text-[#6B655E]" : "text-[#FAF8F5]/90",
                )}
              >
                {content}
              </p>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
