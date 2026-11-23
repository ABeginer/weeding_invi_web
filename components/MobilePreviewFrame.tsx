"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface MobilePreviewFrameProps {
  children: React.ReactNode;
  className?: string;
  targetWidth?: number;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  lockedScroll?: boolean;
}

/**
 * MobilePreviewFrame (IframePortal)
 * -------------------------------------------------------------
 * Render cây React của template vào <iframe> cùng origin có chiều rộng
 * logic chuẩn mobile (mặc định 375px) thông qua React `createPortal`.
 * 
 * LỢI ÍCH CỐT LÕI:
 * 1. Mọi viewport media queries (Tailwind `sm:`, `md:`, `lg:`) đều đánh giá
 *    theo đúng 375px thay vì màn hình Desktop 1440px+.
 * 2. Tự động co tỉ lệ mượt bằng `transform: scale(ratio)` nếu khung hiển thị
 *    thực tế hẹp hoặc rộng hơn 375px, chống bóp méo layout.
 * 3. Đồng bộ 100% styles (<link>, <style>, Google Fonts, CSS variables, HMR)
 *    từ `document.head` sang iframe bằng `MutationObserver`.
 * 4. Giữ nguyên 100% cơ chế React Synthetic Events (click chỉnh nhanh, live state,
 *    undo/redo, nút đóng/mở bì thư, SFX).
 */
export function MobilePreviewFrame({
  children,
  className,
  targetWidth = 375,
  scrollRef,
  lockedScroll = false,
}: MobilePreviewFrameProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
  const [mountNode, setMountNode] = React.useState<HTMLElement | null>(null);
  const [scale, setScale] = React.useState<number>(1);
  const [contentHeight, setContentHeight] = React.useState<number | string>("100%");

  // Tính toán scale và contentHeight theo kích thước thực tế của container
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateDimensions = () => {
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      if (cw <= 0) return;

      const currentScale = cw / targetWidth;
      setScale(currentScale);
      if (ch > 0 && currentScale > 0) {
        setContentHeight(ch / currentScale);
      }
    };

    updateDimensions();

    const ro = new ResizeObserver(() => {
      updateDimensions();
    });
    ro.observe(el);

    return () => ro.disconnect();
  }, [targetWidth]);

  // Khởi tạo iframe document và đồng bộ style
  React.useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let observer: MutationObserver | null = null;

    const setupIframeDoc = () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc || !doc.body) return;

        // Reset chuẩn cho html & body bên trong iframe
        doc.documentElement.style.height = "100%";
        doc.documentElement.style.width = "100%";
        doc.documentElement.style.margin = "0";
        doc.documentElement.style.padding = "0";
        doc.documentElement.style.overflow = "hidden";

        doc.body.style.height = "100%";
        doc.body.style.width = "100%";
        doc.body.style.margin = "0";
        doc.body.style.padding = "0";
        doc.body.style.overflow = "hidden";
        doc.body.style.backgroundColor = "transparent";

        // Kế thừa className và data-theme từ document cha (Google Fonts, theme variables)
        doc.documentElement.className = document.documentElement.className;
        const currentTheme = document.documentElement.getAttribute("data-theme");
        if (currentTheme) {
          doc.documentElement.setAttribute("data-theme", currentTheme);
        }
        doc.body.className = document.body.className;

        // Đồng bộ stylesheet và thẻ style từ document.head
        const syncStyles = () => {
          if (!doc.head) return;
          const parentHeadNodes = document.head.querySelectorAll("link[rel='stylesheet'], style");

          // Xóa các style cũ đã đồng bộ trước đó để tránh trùng lặp
          const syncedOld = doc.head.querySelectorAll("[data-preview-sync='true']");
          syncedOld.forEach((n) => n.remove());

          parentHeadNodes.forEach((node) => {
            const clone = node.cloneNode(true) as HTMLElement;
            clone.setAttribute("data-preview-sync", "true");
            doc.head.appendChild(clone);
          });

          // Tiêm style ẩn scrollbar và mượt font bên trong iframe
          const scrollbarStyle = doc.createElement("style");
          scrollbarStyle.setAttribute("data-preview-sync", "true");
          scrollbarStyle.textContent = `
            html,
            body,
            * {
              scrollbar-width: none !important;
              -ms-overflow-style: none !important;
            }
            html::-webkit-scrollbar,
            body::-webkit-scrollbar,
            *::-webkit-scrollbar {
              display: none !important;
              width: 0 !important;
              height: 0 !important;
            }
            html, body {
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
          `;
          doc.head.appendChild(scrollbarStyle);
        };

        syncStyles();

        // MutationObserver theo dõi style động (Next.js font, HMR styles)
        if (observer) observer.disconnect();
        observer = new MutationObserver(() => {
          syncStyles();
        });
        observer.observe(document.head, { childList: true, subtree: true });

        setMountNode(doc.body);
      } catch (err) {
        console.error("Lỗi khởi tạo MobilePreviewFrame iframe:", err);
      }
    };

    setupIframeDoc();
    iframe.addEventListener("load", setupIframeDoc);

    // Fallback nếu iframe about:blank đã complete trước khi listener load kịp gắn
    let rafId = 0;
    if (iframe.contentDocument?.readyState === "complete" && iframe.contentDocument?.body) {
      setupIframeDoc();
    } else {
      rafId = requestAnimationFrame(() => {
        setupIframeDoc();
      });
    }

    return () => {
      iframe.removeEventListener("load", setupIframeDoc);
      if (rafId) cancelAnimationFrame(rafId);
      if (observer) observer.disconnect();
    };
  }, []);

  const portalContent = (
    <div
      ref={(el) => {
        if (scrollRef) {
          (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }
      }}
      className={cn(
        "relative h-full w-full overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        lockedScroll ? "overflow-y-hidden" : "overflow-y-auto"
      )}
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {children}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={cn("relative h-full w-full overflow-hidden select-none", className)}
    >
      <iframe
        ref={iframeRef}
        title="Xem trước giao diện điện thoại"
        className="block border-0 select-auto"
        style={{
          width: `${targetWidth}px`,
          height: typeof contentHeight === "number" ? `${contentHeight}px` : "100%",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          pointerEvents: "auto",
        }}
      />
      {mountNode && createPortal(portalContent, mountNode)}
    </div>
  );
}
