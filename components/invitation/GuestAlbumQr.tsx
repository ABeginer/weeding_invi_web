"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ExternalLink, QrCode, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuestAlbumQrProps {
  slug?: string;
  accentColor?: string;
  textColor?: string;
  mutedColor?: string;
  className?: string;
}

export function GuestAlbumQr({
  slug,
  accentColor = "#4D1217",
  textColor = "#3A1A1F",
  mutedColor = "#7C5B4B",
  className,
}: GuestAlbumQrProps) {
  const [qr, setQr] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [url, setUrl] = React.useState("");

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!slug || typeof window === "undefined") {
      setQr(null);
      setUrl("");
      return;
    }
    let cancelled = false;
    const nextUrl = `${window.location.origin}/a/${slug}`;
    setUrl(nextUrl);
    import("qrcode")
      .then((module) =>
        module.default.toDataURL(nextUrl, {
          width: 520,
          margin: 1,
          color: { dark: accentColor, light: "#FFF9F3" },
        }),
      )
      .then((dataUrl) => {
        if (!cancelled) setQr(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setQr(null);
      });
    return () => {
      cancelled = true;
    };
  }, [accentColor, slug]);

  if (!slug || !qr) return null;

  return (
    <section className={cn("px-4 py-8 text-center", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: mutedColor }}>
        Album ảnh cưới
      </p>
      <h2 className="mt-1 text-xl" style={{ fontFamily: "var(--font-playfair)", color: textColor }}>
        Quét QR để xem album
      </h2>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-auto mt-4 block rounded-xl border-4 border-white bg-[#FFF9F3] p-2 shadow-lg transition-transform hover:scale-[1.03]"
        aria-label="Phóng to QR album"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="Mã QR album ảnh cưới" className="h-36 w-36 object-contain" />
      </button>
      <p className="mt-2 text-[10px]" style={{ color: mutedColor }}>
        Quét mã hoặc bấm để phóng to
      </p>

      {open &&
        mounted &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="QR album ảnh cưới"
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4"
            onClick={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            <div className="w-full max-w-sm rounded-2xl bg-[#FFF9F3] p-5 text-center shadow-2xl">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: mutedColor }}>
                  Album ảnh cưới
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Đóng"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border"
                  style={{ borderColor: `${accentColor}44`, color: accentColor }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="Mã QR album phóng to" className="mx-auto mt-3 w-full max-w-[300px] object-contain" />
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-semibold"
                style={{ backgroundColor: accentColor, color: "#FFF8F0" }}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Mở album
              </a>
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}

export function GuestAlbumQrBadge({ className }: { className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-1.5 text-xs", className)}>
      <QrCode className="h-4 w-4" />
      QR album
    </div>
  );
}
