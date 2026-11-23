"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInvitationContained, useWeddingContent } from "./WeddingContentProvider";
import { usePublicWishes } from "./usePublicWishes";

/**
 * Chế độ "overlay trên thiệp": các ô lời chúc nhỏ nổi ở góc dưới-trái,
 * nền màu chủ đạo của theme + chữ trắng, cuộn dọc vô tận.
 * Không dùng khung lớn — chỉ từng ô lời chúc như khách yêu cầu.
 */
export function WishOverlay() {
  const data = useWeddingContent();
  const isContained = useInvitationContained();
  const { wishes, enabled, style } = usePublicWishes();
  const [dismissed, setDismissed] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const total = wishes.length;

  if (!enabled || style !== "overlay" || total === 0 || dismissed) return null;

  // Template nền tối dùng nền đen mờ, còn lại dùng chính màu chủ đạo (olive).
  const dark =
    data.templateId !== "vuon-o-liu" &&
    data.templateId !== "basic-1" &&
    data.templateId !== "bach-lan-lua-nga" &&
    data.templateId !== "rang-hong-hoang-hon";

  // Overlay portal ra body nên KHÔNG còn biến --inv-* của theme trong cây thiệp.
  // Dùng màu cứng: xanh ô liu của mẫu sáng, đen mờ cho mẫu tối (card_exp §22.28).
  const chipStyle: React.CSSProperties = dark
    ? { backgroundColor: "rgba(0,0,0,0.78)" }
    : { backgroundColor: "rgba(94, 115, 63, 0.88)" };
  const duration = Math.max(20, total * 4.5);

  const item = (wish: (typeof wishes)[number], key: string) => (
    <div
      key={key}
      className="rounded-xl px-3 py-1.5 shadow-[0_4px_14px_rgba(0,0,0,0.18)]"
      style={chipStyle}
    >
      <p className="truncate text-[11px] font-bold uppercase tracking-[0.08em] text-white">
        {wish.name}
      </p>
      <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-white/90">
        {wish.message}
      </p>
    </div>
  );

  const node = (
    <div className="pointer-events-none fixed bottom-1 left-1 z-50 w-[360px] max-w-[94%] sm:w-[400px]">
      <div className="mb-1 flex items-center justify-between gap-2 px-1">
        <span
          className="text-[9px] font-semibold uppercase tracking-[0.18em]"
          style={{
            color: dark ? "rgba(255,255,255,0.7)" : "rgba(94,115,63,0.85)",
            textShadow: dark ? "0 1px 3px rgba(0,0,0,0.5)" : "0 1px 2px rgba(255,255,255,0.6)",
          }}
        >
          Sổ lưu bút
        </span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Ẩn sổ lưu bút"
          className="pointer-events-auto flex h-5 w-5 items-center justify-center rounded-full bg-[#1F1D1A]/40 text-white/85 hover:bg-[#151412]/80 transition-colors"
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      </div>

      <div className="relative h-[150px] overflow-hidden">
        <div
          className={cn("flex flex-col gap-1.5 pb-1.5", total > 1 && "wish-marquee-y")}
          style={
            total > 1
              ? ({ "--wish-marquee-duration": `${duration}s` } as React.CSSProperties)
              : undefined
          }
        >
          {[0, 1].map((group) => (
            <div
              key={group}
              className="flex shrink-0 flex-col gap-1.5 pb-1.5"
              aria-hidden={group === 1 ? true : undefined}
            >
              {wishes.map((wish) => item(wish, `${group}-${wish.id}`))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Portal ra body để `fixed` bám viewport thật: nếu để trong block RSVP,
  // tổ tiên có transform (RevealSection) sẽ biến `fixed` thành absolute theo
  // block đó → chỉ thấy overlay khi cuộn tới cuối thiệp (card_exp §22.27).
  if (!mounted) return null;
  return isContained ? node : createPortal(node, document.body);
}
