"use client";

import * as React from "react";
import "@/styles/designer-animations.css";
import "@/styles/invitation-templates.css";
import type { CSSProperties } from "react";
import type { DesignerCanvasContent, DesignerElement } from "@/components/ops/designer-types";
import type { DesignerElementOverride } from "@/lib/wedding-types";
import type { GuestDiet, GuestStatus, TemplateData, WeddingPlan } from "@/lib/types";
import { WeddingContentProvider } from "@/components/invitation/WeddingContentProvider";
import { TemplateFontScope } from "@/components/theme/TemplateFontScope";
import { RsvpWishBlock } from "@/components/invitation/RsvpWishBlock";
import { MusicPlayer } from "@/components/invitation/MusicPlayer";
import { DesignerCover } from "./designer-cover";
import { DesignerAlbum } from "./designer-album";
import { DesignerGiftBox } from "./designer-gift-box";
import { DesignerTemplateRenderer } from "./designer-template-renderer";

interface DesignerInvitationProps {
  canvas: DesignerCanvasContent;
  values: Record<string, string>;
  coupleLabel: string;
  /** Preview/embed không chặn nội dung bằng bìa. */
  showCover?: boolean;
  /** Dữ liệu thiệp để render RSVP chuẩn; preview không truyền. */
  data?: TemplateData;
  weddingSlug?: string;
  guestName?: string;
  invitationMode?: "personal" | "public";
  initialStatus?: GuestStatus;
  initialPlusOnes?: number;
  initialDiet?: GuestDiet | null;
  initialSongRequest?: string | null;
  initialRideNeeded?: boolean;
  readOnly?: boolean;
  /** Gói của thiệp để giới hạn album 5/30 ảnh. */
  plan?: WeddingPlan;
  /** Ghi đè theo từng thiệp: vị trí/chữ/ảnh/zoom. */
  overrides?: Record<string, DesignerElementOverride>;
  /** Bật hotspot chỉnh trực tiếp trong dashboard. */
  editable?: boolean;
  onElementClick?: (element: DesignerElement) => void;
  onElementMove?: (
    id: string,
    patch: Pick<DesignerElementOverride, "xPct" | "yPct">,
  ) => void;
}

/**
 * Thiệp thật của designer: xếp toàn bộ trang theo đúng bản đã ghim.
 * Mỗi trang là một artboard 390×844 scale theo bề rộng màn hình.
 */
const FALLBACK_GIFT = {
  groomBankName: "Ngân hàng nhà trai",
  groomAccountName: "TÊN TÀI KHOẢN",
  groomAccountNumber: "0000 0000 0000",
  groomQrUrl: null,
  brideBankName: "Ngân hàng nhà gái",
  brideAccountName: "TÊN TÀI KHOẢN",
  brideAccountNumber: "0000 0000 0000",
  brideQrUrl: null,
};

function DesignerRsvpPreview() {
  return (
    <div className="px-4 py-6">
      <div className="rounded-[24px] border border-[#D9B8AE] bg-white/70 p-4">
        <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#9B4052]">
          Xác nhận tham dự
        </p>
        <p className="mt-1 font-display text-xl text-[#4A2430]">Bạn có thể tham dự không?</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <span className="rounded-full bg-[#B35A6B] px-3 py-2 text-center text-xs font-semibold text-white">
            Có, tôi sẽ tham dự
          </span>
          <span className="rounded-full border border-[#B35A6B]/40 px-3 py-2 text-center text-xs text-[#8E6A62]">
            Rất tiếc, tôi không thể
          </span>
        </div>
        <div className="mt-3 h-9 rounded-lg border border-[#D9B8AE] bg-white/60 px-3 py-2 text-[10px] text-[#A77A74]">
          Họ và tên của bạn
        </div>
        <div className="mt-2 h-16 rounded-lg border border-[#D9B8AE] bg-white/60 px-3 py-2 text-[10px] text-[#A77A74]">
          Lời chúc gửi cô dâu chú rể…
        </div>
        <div className="mt-3 rounded-full bg-[#B35A6B] px-4 py-2 text-center text-xs font-semibold text-white">
          Gửi xác nhận
        </div>
      </div>
    </div>
  );
}

export function DesignerInvitation({
  canvas,
  values,
  coupleLabel,
  showCover = true,
  data,
  weddingSlug,
  guestName,
  invitationMode = "personal",
  initialStatus,
  initialPlusOnes,
  initialDiet,
  initialSongRequest,
  initialRideNeeded,
  readOnly = false,
  plan = "free",
  overrides,
  editable = false,
  onElementClick,
  onElementMove,
}: DesignerInvitationProps) {
  const pages =
    Array.isArray(canvas.pages) && canvas.pages.length > 0 ? canvas.pages : null;
  const pageCount = pages?.length ?? 1;
  const background = pages?.[0]?.background ?? canvas.background ?? "#FAF8F5";
  const albumAfterPage = Math.min(
    pageCount,
    Math.max(1, canvas.albumAfterPage ?? pageCount),
  );
  const hasRsvpPage = Boolean(pages?.some((page) => page.kind === "rsvp"));
  const hasGiftPage = Boolean(pages?.some((page) => page.kind === "gift"));

  // State quản lý Nhạc nền
  const [isPlaying, setIsPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const hasMusic = Boolean(data?.music?.src);
  const hasGifts = Boolean(
    data?.gift?.groomAccountNumber ||
      data?.gift?.brideAccountNumber ||
      data?.gift?.groomQrUrl ||
      data?.gift?.brideQrUrl,
  );
  const galleryPhotos = data?.photos?.gallery ?? [];
  const accent = canvas.accentColor || "#5F4636";
  const pageBackground = pages?.[0]?.background ?? background;
  const hex = pageBackground.match(/#[0-9a-f]{3,8}/i)?.[0] ?? "#FAF7F2";
  const normalizedHex = hex.replace("#", "");
  const darkBackground =
    normalizedHex.length >= 6 &&
    (() => {
      const r = Number.parseInt(normalizedHex.slice(0, 2), 16);
      const g = Number.parseInt(normalizedHex.slice(2, 4), 16);
      const b = Number.parseInt(normalizedHex.slice(4, 6), 16);
      return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.42;
    })();
  const rsvpTheme = darkBackground
    ? {
        "--inv-bg": "#1B1111",
        "--inv-paper": "#2A1B1B",
        "--inv-cream": "#332222",
        "--inv-input-bg": "#2A1B1B",
        "--inv-title": "#F7E7C8",
        "--inv-ink": "#FFF8E7",
        "--inv-text-small": "#F1DFC6",
        "--inv-muted": "#D9C6A8",
        "--inv-olive": accent,
        "--inv-olive-mid": accent,
        "--inv-olive-deep": accent,
        "--inv-olive-btn": accent,
        "--inv-olive-hover": accent,
        "--inv-tint": "#332222",
        "--inv-cream-text": "#2A1B1B",
        "--inv-cream-soft": "#332222",
        "--color-inv-bg": "#1B1111",
        "--color-inv-paper": "#2A1B1B",
        "--color-inv-cream": "#332222",
        "--color-inv-input": "#2A1B1B",
        "--color-inv-title": "#F7E7C8",
        "--color-inv-ink": "#FFF8E7",
        "--color-inv-text": "#F1DFC6",
        "--color-inv-muted": "#D9C6A8",
        "--color-inv-olive": accent,
        "--color-inv-olive-mid": accent,
        "--color-inv-olive-deep": accent,
        "--color-inv-olive-btn": accent,
        "--color-inv-olive-hover": accent,
        "--color-inv-tint": "#332222",
        "--color-inv-cream-text": "#2A1B1B",
        "--color-inv-cream-soft": "#332222",
      }
    : {
        "--inv-bg": "#FAF7F2",
        "--inv-paper": "#FFFFFF",
        "--inv-cream": "#F3EEE6",
        "--inv-input-bg": "#FFFFFF",
        "--inv-title": "#3F2B2B",
        "--inv-ink": "#3F2B2B",
        "--inv-text-small": "#5B4A43",
        "--inv-muted": "#7A6A62",
        "--inv-olive": accent,
        "--inv-olive-mid": accent,
        "--inv-olive-deep": accent,
        "--inv-olive-btn": accent,
        "--inv-olive-hover": accent,
        "--inv-tint": "#F3E9DF",
        "--inv-cream-text": "#FFFFFF",
        "--inv-cream-soft": "#F7EFE8",
        "--color-inv-bg": "#FAF7F2",
        "--color-inv-paper": "#FFFFFF",
        "--color-inv-cream": "#F3EEE6",
        "--color-inv-input": "#FFFFFF",
        "--color-inv-title": "#3F2B2B",
        "--color-inv-ink": "#3F2B2B",
        "--color-inv-text": "#5B4A43",
        "--color-inv-muted": "#7A6A62",
        "--color-inv-olive": accent,
        "--color-inv-olive-mid": accent,
        "--color-inv-olive-deep": accent,
        "--color-inv-olive-btn": accent,
        "--color-inv-olive-hover": accent,
        "--color-inv-tint": "#F3E9DF",
        "--color-inv-cream-text": "#FFFFFF",
        "--color-inv-cream-soft": "#F7EFE8",
      };

  const wasPlayingBeforeHideRef = React.useRef(false);
  const userManuallyMutedRef = React.useRef(false);

  const broadcastMusicState = React.useCallback((playing: boolean) => {
    try {
      window.dispatchEvent(
        new CustomEvent("inviwedd:music-state-change", {
          detail: { isPlaying: playing },
        }),
      );
    } catch {}
  }, []);

  const playAudio = React.useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      const promise = audio.play();
      if (promise !== undefined) {
        promise
          .then(() => {
            setIsPlaying(true);
            broadcastMusicState(true);
          })
          .catch(() => {
            setIsPlaying(false);
            broadcastMusicState(false);
          });
      } else {
        setIsPlaying(true);
        broadcastMusicState(true);
      }
    } catch {
      setIsPlaying(false);
      broadcastMusicState(false);
    }
  }, [broadcastMusicState]);

  const pauseAudio = React.useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setIsPlaying(false);
    broadcastMusicState(false);
  }, [broadcastMusicState]);

  const toggleMusic = React.useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      userManuallyMutedRef.current = true;
      pauseAudio();
    } else {
      userManuallyMutedRef.current = false;
      playAudio();
    }
  }, [isPlaying, pauseAudio, playAudio]);

  // Lắng nghe sự kiện bật/tắt nhạc từ block Nhạc nền trong canvas hoặc Desktop Floating Utility Rail
  React.useEffect(() => {
    const handleToggle = () => toggleMusic();
    window.addEventListener("inviwedd:toggle-music", handleToggle);
    return () => {
      window.removeEventListener("inviwedd:toggle-music", handleToggle);
    };
  }, [toggleMusic]);

  // Tự động phát khi chạm vào bìa cover
  React.useEffect(() => {
    const handleOpen = () => {
      if (!userManuallyMutedRef.current) {
        playAudio();
      }
    };
    window.addEventListener("inviwedd:open-envelope", handleOpen);
    return () => {
      window.removeEventListener("inviwedd:open-envelope", handleOpen);
    };
  }, [playAudio]);

  // Quản lý vòng đời audio khi người dùng chuyển tab hoặc ẩn ứng dụng Zalo/Messenger
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      const audio = audioRef.current;
      if (!audio) return;

      if (document.hidden) {
        if (!audio.paused) {
          wasPlayingBeforeHideRef.current = true;
          audio.pause();
          setIsPlaying(false);
          broadcastMusicState(false);
        } else {
          wasPlayingBeforeHideRef.current = false;
        }
      } else {
        if (wasPlayingBeforeHideRef.current && !userManuallyMutedRef.current) {
          playAudio();
        }
      }
    };

    const handlePageHide = () => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        wasPlayingBeforeHideRef.current = true;
        audio.pause();
        setIsPlaying(false);
        broadcastMusicState(false);
      }
    };

    const handlePageShow = () => {
      if (wasPlayingBeforeHideRef.current && !userManuallyMutedRef.current) {
        playAudio();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [broadcastMusicState, playAudio]);

  return (
    <TemplateFontScope>
      <div
        className="invitation-theme min-h-screen-dvh w-full"
        style={{ backgroundColor: background }}
      >
      {showCover && canvas.cover && (
        <DesignerCover cover={canvas.cover} coupleLabel={coupleLabel} />
      )}

      {/* Audio phát nhạc nền khi có cấu hình */}
      {hasMusic && data?.music?.src && (
        <audio
          ref={audioRef}
          src={data.music.src}
          loop
          preload="none"
          onEnded={() => setIsPlaying(false)}
        />
      )}

      <main className="mx-auto w-full max-w-[430px]">
        <h1 className="sr-only">Thiệp cưới {coupleLabel}</h1>
        {Array.from({ length: pageCount }, (_, index) => {
          const page = pages?.[index];
          return (
            <React.Fragment key={page?.id ?? index}>
              {page?.kind === "rsvp" ? (
                <div style={{ background: page.background }}>
                  {data ? (
                    <div
                      className="designer-rsvp-theme px-3 py-6"
                      style={rsvpTheme as CSSProperties}
                    >
                      <WeddingContentProvider
                        data={data}
                        contained
                        viewport="phone"
                        mode={readOnly ? "preview" : "live"}
                      >
                        <div
                          className="rounded-[26px] border p-1"
                          style={{
                            borderColor: darkBackground
                              ? `${canvas.accentColor ?? "#B35A6B"}55`
                              : "#D9B8AE",
                            backgroundColor: darkBackground
                              ? "rgba(255,255,255,0.035)"
                              : "rgba(255,255,255,0.35)",
                          }}
                        >
                          <RsvpWishBlock
                            slug={weddingSlug}
                            weddingSlug={weddingSlug}
                            mode={invitationMode}
                            guestName={guestName}
                            initialStatus={initialStatus}
                            initialPlusOnes={initialPlusOnes}
                            initialDiet={initialDiet}
                            initialSongRequest={initialSongRequest}
                            initialRideNeeded={initialRideNeeded}
                          />
                        </div>
                      </WeddingContentProvider>
                    </div>
                  ) : (
                    <DesignerRsvpPreview />
                  )}
                </div>
              ) : page?.kind === "gift" ? (
                <div style={{ background: page.background }}>
                  <DesignerGiftBox
                    gift={data?.gift ?? FALLBACK_GIFT}
                    accentColor={canvas.accentColor}
                    textColor={darkBackground ? "#F7E7C8" : "#4A2430"}
                    mutedColor={darkBackground ? "#D9C6A8" : "#8E6A62"}
                  />
                </div>
              ) : (
                <DesignerTemplateRenderer
                  canvas={canvas}
                  values={values}
                  pageIndex={index}
                  variant="plain"
                  sampleFallback={false}
                  overrides={overrides}
                  editable={editable}
                  onElementClick={onElementClick}
                  onElementMove={onElementMove}
                />
              )}
              {index + 1 === albumAfterPage && (
                <div className="px-3 pt-6">
                  <DesignerAlbum
                    photos={galleryPhotos}
                    limit={plan === "free" ? 5 : 30}
                    accentColor={canvas.accentColor}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}

        {!data && albumAfterPage >= pageCount && (
          <div className="px-3 pt-6">
            <DesignerAlbum
              photos={galleryPhotos}
              limit={plan === "free" ? 5 : 30}
              accentColor={canvas.accentColor}
            />
          </div>
        )}

        {data && (
          <div
            className="designer-rsvp-theme px-3 pb-8 space-y-6"
            style={rsvpTheme as CSSProperties}
          >
            <WeddingContentProvider
              data={data}
              contained
              viewport="phone"
              mode={readOnly ? "preview" : "live"}
            >
              {!hasGiftPage && hasGifts && data.gift && !data.hiddenSections?.includes("gift") && (
                <DesignerGiftBox
                  gift={data.gift}
                  accentColor={canvas.accentColor}
                  textColor={darkBackground ? "#F7E7C8" : "#4A2430"}
                  mutedColor={darkBackground ? "#D9C6A8" : "#8E6A62"}
                  fontFamily="var(--font-playfair)"
                />
              )}

              {/* Khối Xác nhận tham dự & Lời chúc (fallback cho mẫu không có trang RSVP) */}
              {!hasRsvpPage && (
                <div
                  className="rounded-[26px] border p-1"
                  style={{
                    borderColor: darkBackground ? `${canvas.accentColor ?? "#B35A6B"}55` : "#D9B8AE",
                    backgroundColor: darkBackground
                      ? "rgba(255,255,255,0.035)"
                      : "rgba(255,255,255,0.35)",
                  }}
                >
                  <RsvpWishBlock
                    slug={weddingSlug}
                    weddingSlug={weddingSlug}
                    mode={invitationMode}
                    guestName={guestName}
                    initialStatus={initialStatus}
                    initialPlusOnes={initialPlusOnes}
                    initialDiet={initialDiet}
                    initialSongRequest={initialSongRequest}
                    initialRideNeeded={initialRideNeeded}
                  />
                </div>
              )}

              {/* Floating Music Player */}
              {hasMusic && (
                <MusicPlayer
                  visible={hasMusic}
                  isPlaying={isPlaying}
                  onToggle={toggleMusic}
                />
              )}
            </WeddingContentProvider>
          </div>
        )}
      </main>
      </div>
    </TemplateFontScope>
  );
}
