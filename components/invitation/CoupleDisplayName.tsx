"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CoupleDisplayNameProps {
  as?: "h1" | "h2" | "p";
  groomName: string;
  brideName: string;
  className?: string;
  inlineAmpersandClassName?: string;
  stackedAmpersandClassName?: string;
  connector?: string;
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export function CoupleDisplayName({
  as = "h1",
  groomName,
  brideName,
  className,
  inlineAmpersandClassName,
  stackedAmpersandClassName,
  connector = "&",
}: CoupleDisplayNameProps) {
  const containerRef = React.useRef<HTMLHeadingElement | null>(null);

  const cleanGroom = groomName.trim();
  const cleanBride = brideName.trim();

  // Dự đoán ban đầu cho SSR trước khi DOM thực hiện đo pixel chính xác
  const [isStacked, setIsStacked] = React.useState(
    () => `${cleanGroom} ${connector} ${cleanBride}`.length > 18,
  );

  const measureFit = React.useCallback(() => {
    const container = containerRef.current;
    if (!container || typeof window === "undefined" || typeof document === "undefined") return;

    const availableWidth = container.clientWidth;
    if (availableWidth <= 0) return;

    // Đo độ dài 1 hàng bằng probe tách biệt, không render đúp vào trong Tag
    const computed = window.getComputedStyle(container);
    const probe = document.createElement("span");
    probe.style.position = "fixed";
    probe.style.left = "-9999px";
    probe.style.top = "-9999px";
    probe.style.visibility = "hidden";
    probe.style.whiteSpace = "nowrap";
    probe.style.font = computed.font;
    probe.style.fontFamily = computed.fontFamily;
    probe.style.fontSize = computed.fontSize;
    probe.style.fontWeight = computed.fontWeight;
    probe.style.letterSpacing = computed.letterSpacing;
    probe.textContent = `${cleanGroom} ${connector} ${cleanBride}`;

    document.body.appendChild(probe);
    const singleLineWidth = probe.getBoundingClientRect().width;
    document.body.removeChild(probe);

    const shouldStack = singleLineWidth > availableWidth - 2;
    setIsStacked((prev) => (prev === shouldStack ? prev : shouldStack));
  }, [cleanGroom, cleanBride, connector]);

  useIsomorphicLayoutEffect(() => {
    measureFit();

    const container = containerRef.current;
    if (!container) return;

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        measureFit();
      });
      observer.observe(container);
    }

    let cancelled = false;
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready
        .then(() => {
          if (!cancelled) measureFit();
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [cleanGroom, cleanBride, connector, measureFit]);

  const Tag = as;

  return (
    <Tag ref={containerRef} className={cn("relative w-full", className)}>
      {isStacked ? (
        <span className="inline-flex max-w-full flex-col items-center leading-[1.08]">
          <span className="block max-w-full break-words">{cleanGroom}</span>
          <span
            aria-label="và"
            className={cn(
              "my-[0.04em] block text-[0.76em] leading-[0.95] font-normal italic",
              stackedAmpersandClassName ?? inlineAmpersandClassName,
            )}
          >
            {connector}
          </span>
          <span className="block max-w-full break-words">{cleanBride}</span>
        </span>
      ) : (
        <span className="inline-flex max-w-full flex-nowrap items-baseline whitespace-nowrap">
          <span>{cleanGroom}</span>
          <span
            aria-label="và"
            className={cn(
              "mx-[0.22em] font-normal italic",
              inlineAmpersandClassName,
            )}
          >
            {connector}
          </span>
          <span>{cleanBride}</span>
        </span>
      )}
    </Tag>
  );
}
