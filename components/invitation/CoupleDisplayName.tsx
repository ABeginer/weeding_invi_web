"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * QUY TẮC HIỂN THỊ TÊN CÔ DÂU & CHÚ RỂ TRÊN THIỆP:
 * - Nếu tổng chiều rộng 2 tên + ký hiệu "&" vừa trong 1 hàng -> giữ nguyên 1 hàng duy nhất,
 *   không bao giờ để bị ngắt dở chữ giữa chừng (ví dụ: "Minh Khôi & Thảo / Nguyên").
 * - Nếu quá dài so với chiều rộng khung hiển thị -> tự động chia làm đúng 3 dòng cân đối:
 *     Dòng 1: Tên chú rể
 *     Dòng 2: Ký hiệu "&" (và)
 *     Dòng 3: Tên cô dâu
 * Mọi mẫu thiệp hiện tại và tương lai đều dùng component này cho tên cặp đôi.
 */
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
  const probeRef = React.useRef<HTMLSpanElement | null>(null);

  const cleanGroom = groomName.trim();
  const cleanBride = brideName.trim();

  // Dự đoán ban đầu cho SSR trước khi DOM thực hiện đo pixel chính xác
  const [isStacked, setIsStacked] = React.useState(
    () => `${cleanGroom} ${connector} ${cleanBride}`.length > 18,
  );

  const measureFit = React.useCallback(() => {
    const container = containerRef.current;
    const probe = probeRef.current;
    if (!container || !probe) return;

    const availableWidth = container.clientWidth;
    if (availableWidth <= 0) return;

    const singleLineWidth = probe.getBoundingClientRect().width;
    const shouldStack = singleLineWidth > availableWidth - 2;
    setIsStacked((prev) => (prev === shouldStack ? prev : shouldStack));
  }, []);

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
      {/* Bản đo ẩn giữ nguyên font/size từ thẻ cha để kiểm tra có vừa 1 hàng hay không */}
      <span
        ref={probeRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute top-0 left-0 inline-flex items-baseline whitespace-nowrap opacity-0"
      >
        <span>{cleanGroom}</span>
        <span
          className={cn(
            "mx-[0.22em] font-normal italic",
            inlineAmpersandClassName,
          )}
        >
          {connector}
        </span>
        <span>{cleanBride}</span>
      </span>

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

