import * as React from "react";
import Image from "next/image";
import { QrCode } from "lucide-react";

export function LedMiniDemo({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-xl border border-[#E8E2D9] bg-[#141210] shadow-md select-none ${className}`}
    >
      {/* Background Dark Overlay */}
      <div className="absolute inset-0 z-0 bg-radial from-transparent via-[#141210]/30 to-[#141210]" />

      {/* Layer 1 Photo */}
      <div className="absolute inset-0 animate-led-mini-photo-1">
        <Image
          src="/photos/1.webp"
          alt="Demo wedding photo 1"
          fill
          sizes="(max-width: 640px) 100vw, 400px"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141210]/85 via-transparent to-black/30" />
      </div>

      {/* Layer 2 Photo */}
      <div className="absolute inset-0 animate-led-mini-photo-2">
        <Image
          src="/photos/2.webp"
          alt="Demo wedding photo 2"
          fill
          sizes="(max-width: 640px) 100vw, 400px"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141210]/85 via-transparent to-black/30" />
      </div>

      {/* Top Left: LIVE indicator dot & Title */}
      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-2.5 py-1 backdrop-blur-md">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[#B89B72] opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#B89B72]" />
        </span>
        <span className="text-[10px] font-semibold tracking-wider text-[#FAF8F5] uppercase">
          LIVE LED
        </span>
      </div>

      {/* Couple Name / Watermark in center-bottom */}
      <div className="absolute bottom-2.5 left-3 z-10 text-left">
        <p className="font-serif text-xs font-medium text-white drop-shadow-md">
          Minh Khôi & Thảo Nguyên
        </p>
        <p className="text-[9px] text-[#FAF8F5]/80 drop-shadow-xs">
          Khoảnh khắc từ khách mời
        </p>
      </div>

      {/* Bottom Right: Mini QR Card with "Quét QR" */}
      <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/95 px-2 py-1 shadow-md backdrop-blur-xs">
        <QrCode className="h-3.5 w-3.5 text-[#1F1D1A]" />
        <span className="text-[9px] font-semibold text-[#1F1D1A]">Quét QR gửi ảnh</span>
      </div>
    </div>
  );
}
