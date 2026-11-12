"use client";

import * as React from "react";
import { CheckCircle2, Lock, Send, XCircle } from "lucide-react";
import { submitRsvp, submitWish } from "@/lib/api";
import type { GuestStatus, TemplateData } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { TemplateRenderMode } from "../types";
import type { TemplateTone } from "./TemplateOverlays";

interface TemplateRsvpSectionProps {
  data: TemplateData;
  mode: TemplateRenderMode;
  tone: TemplateTone;
  inviteSlug?: string;
  weddingSlug?: string;
  invitationMode?: "personal" | "public";
  guestName?: string | null;
  initialStatus?: GuestStatus;
}

const MAX_WISH_LENGTH = 500;

export function TemplateRsvpSection({
  data,
  mode,
  tone,
  inviteSlug,
  weddingSlug,
  invitationMode = "personal",
  guestName,
  initialStatus = "pending",
}: TemplateRsvpSectionProps) {
  const isReadOnlyPreview = mode === "demo" || mode === "preview";
  const isPublicMode = !isReadOnlyPreview && invitationMode === "public";
  const isNameLocked = !isPublicMode && Boolean(guestName && guestName.trim().length > 0);
  const effectiveWeddingSlug = weddingSlug ?? data.weddingSlug;

  const [status, setStatus] = React.useState<GuestStatus>(initialStatus);
  const [isEditingRsvp, setIsEditingRsvp] = React.useState(initialStatus === "pending");
  const [walkInGuest, setWalkInGuest] = React.useState<{ slug: string; name: string } | null>(null);

  const [name, setName] = React.useState(guestName ?? "");
  const [message, setMessage] = React.useState("");
  const [honeypot, setHoneypot] = React.useState("");
  const [submitting, setSubmitting] = React.useState<"accepted" | "declined" | "wish" | null>(null);
  const [rsvpFeedback, setRsvpFeedback] = React.useState<{
    choice: "accepted" | "declined";
    wishIncluded: boolean;
  } | null>(null);
  const [rsvpError, setRsvpError] = React.useState<string | null>(null);
  const [wishError, setWishError] = React.useState<string | null>(null);
  const [publicWishSent, setPublicWishSent] = React.useState(false);

  React.useEffect(() => {
    setStatus(initialStatus);
    setIsEditingRsvp(initialStatus === "pending");
  }, [initialStatus]);

  React.useEffect(() => {
    if (guestName) setName(guestName);
  }, [guestName]);

  const clearAlerts = () => {
    setRsvpError(null);
    setWishError(null);
  };

  const getActiveSlug = (trimmedName: string): string | undefined => {
    if (inviteSlug) return inviteSlug;
    if (walkInGuest && walkInGuest.name === trimmedName) return walkInGuest.slug;
    return undefined;
  };

  const handleRespond = async (choice: "accepted" | "declined") => {
    if (isReadOnlyPreview) return;
    clearAlerts();
    setRsvpFeedback(null);

    const trimmedName = name.trim();
    const trimmedMessage = message.trim();

    if (honeypot.trim().length > 0) {
      setStatus(choice);
      setMessage("");
      setRsvpFeedback({ choice, wishIncluded: trimmedMessage.length > 0 });
      setIsEditingRsvp(false);
      return;
    }

    if (!trimmedName) {
      setRsvpError("Vui lòng nhập tên của bạn trước khi xác nhận tham dự.");
      return;
    }
    if (trimmedMessage.length > MAX_WISH_LENGTH) {
      setWishError(`Lời chúc tối đa ${MAX_WISH_LENGTH} ký tự.`);
      return;
    }

    setSubmitting(choice);
    let savedSlug = getActiveSlug(trimmedName);
    try {
      const res = await submitRsvp(
        savedSlug
          ? { slug: savedSlug, status: choice, website: honeypot }
          : { weddingSlug: effectiveWeddingSlug, name: trimmedName, status: choice, website: honeypot },
      );
      if (!savedSlug && res.slug) {
        savedSlug = res.slug;
        setWalkInGuest({ slug: res.slug, name: trimmedName });
      }
      setStatus(choice);
    } catch (err) {
      setRsvpError(
        err instanceof Error
          ? err.message
          : "Không thể gửi xác nhận tham dự lúc này. Vui lòng thử lại.",
      );
      setSubmitting(null);
      return;
    }

    if (trimmedMessage.length > 0) {
      try {
        await submitWish({
          slug: savedSlug,
          name: trimmedName,
          message: trimmedMessage,
          website: honeypot,
        });
        setMessage("");
        setRsvpFeedback({ choice, wishIncluded: true });
        setIsEditingRsvp(false);
      } catch (err) {
        setWishError(
          err instanceof Error
            ? `Đã ghi nhận xác nhận tham dự, nhưng chưa gửi được lời chúc: ${err.message}`
            : "Đã ghi nhận xác nhận tham dự, nhưng chưa gửi được lời chúc.",
        );
      } finally {
        setSubmitting(null);
      }
      return;
    }

    setRsvpFeedback({ choice, wishIncluded: false });
    setIsEditingRsvp(false);
    setSubmitting(null);
  };

  const handlePublicWishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnlyPreview) return;
    clearAlerts();

    const trimmedName = name.trim();
    const trimmedMessage = message.trim();

    if (honeypot.trim().length > 0) {
      setMessage("");
      setPublicWishSent(true);
      return;
    }

    if (!trimmedName) {
      setWishError("Vui lòng nhập tên của bạn.");
      return;
    }
    if (!trimmedMessage) {
      setWishError("Vui lòng nhập lời chúc (tối đa 500 ký tự).");
      return;
    }
    if (trimmedMessage.length > MAX_WISH_LENGTH) {
      setWishError(`Lời chúc tối đa ${MAX_WISH_LENGTH} ký tự.`);
      return;
    }

    setSubmitting("wish");
    try {
      await submitWish({
        weddingSlug: effectiveWeddingSlug,
        name: trimmedName,
        message: trimmedMessage,
        website: honeypot,
      });
      setMessage("");
      setPublicWishSent(true);
    } catch (err) {
      setWishError(
        err instanceof Error
          ? err.message
          : "Không thể gửi lời chúc lúc này. Vui lòng thử lại.",
      );
    } finally {
      setSubmitting(null);
    }
  };

  const styles =
    tone === "obsidian"
      ? {
          wrap: "bg-lnd-surface border-y border-lnd-border text-lnd-body",
          eyebrow: "text-lnd-gold",
          heading: "text-lnd-gold font-display",
          subtext: "text-lnd-muted",
          card: "border border-lnd-border bg-lnd-bg text-lnd-body",
          input:
            "border border-lnd-border bg-lnd-bg text-lnd-body placeholder:text-lnd-muted focus:border-lnd-gold focus:ring-lnd-gold",
          primaryBtn:
            "bg-lnd-gold text-lnd-bg hover:bg-lnd-gold-bright font-semibold",
          outlineBtn:
            "border border-lnd-gold-soft bg-transparent text-lnd-body hover:border-lnd-gold hover:text-lnd-gold",
          alert: "border-lnd-gold-soft bg-lnd-gold-tint text-lnd-body",
        }
      : tone === "sunset"
        ? {
            wrap: "bg-[#FBF3ED] border-y border-[#E7CFC3] text-[#322424]",
            eyebrow: "text-[#8A4444]",
            heading: "text-[#7A3535] font-display",
            subtext: "text-[#6B504B]",
            card: "border border-[#E7CFC3] bg-white text-[#322424]",
            input:
              "border border-[#D5B2A3] bg-white text-[#322424] placeholder:text-[#8E6F68] focus:border-[#7A3535] focus:ring-[#7A3535]",
            primaryBtn: "bg-[#7A3535] text-white hover:bg-[#612828] font-medium",
            outlineBtn:
              "border border-[#B77C72] bg-white text-[#6A2E2E] hover:bg-[#F5E6DF]",
            alert: "border-[#D5B2A3] bg-[#F5E6DF] text-[#4B2626]",
          }
        : {
            wrap: "bg-[#F6F3EC] border-y border-[#E2D9C8] text-[#1F1D1A]",
            eyebrow: "text-[#706040]",
            heading: "text-[#1F1D1A] font-display",
            subtext: "text-[#5E574B]",
            card: "border border-[#DFD5C3] bg-white text-[#1F1D1A]",
            input:
              "border border-[#C9BFA9] bg-white text-[#1F1D1A] placeholder:text-[#786E5C] focus:border-[#706040] focus:ring-[#706040]",
            primaryBtn: "bg-[#23201C] text-[#FAF7F0] hover:bg-[#3A342D] font-medium",
            outlineBtn:
              "border border-[#9A8966] bg-white text-[#23201C] hover:bg-[#EFEAE0]",
            alert: "border-[#D4C7AE] bg-[#EFEAE0] text-[#23201C]",
          };

  if (isPublicMode) {
    return (
      <section className={cn("px-5 py-10", styles.wrap)}>
        <div className="mx-auto max-w-[440px]">
          <div className="text-center">
            <p className={cn("text-[11px] font-medium uppercase tracking-[0.2em]", styles.eyebrow)}>
              Phản Hồi &amp; Chúc Phúc
            </p>
            <h2 className={cn("mt-1.5 text-3xl font-semibold", styles.heading)}>
              Gửi Lời Chúc Phúc
            </h2>
            <p className={cn("mx-auto mt-2 max-w-[380px] text-sm leading-relaxed", styles.subtext)}>
              Gửi đôi lời yêu thương để cùng lưu giữ những kỷ niệm đẹp nhất trong ngày cưới của chúng mình.
            </p>
          </div>

          {publicWishSent ? (
            <div className={cn("mt-6 rounded-2xl p-5 text-center", styles.card)}>
              <div className="flex items-center justify-center gap-2 font-semibold">
                <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>Đã gửi lời chúc</span>
              </div>
              <p className={cn("mt-2 text-sm leading-relaxed", styles.subtext)}>
                Cảm ơn bạn thật nhiều! Lời chúc của bạn đã được gửi tới cô dâu &amp; chú rể.
              </p>
              <button
                type="button"
                onClick={() => setPublicWishSent(false)}
                className={cn(
                  "mt-4 inline-flex h-9 cursor-pointer items-center justify-center rounded-full px-4 text-xs font-medium transition-colors",
                  styles.outlineBtn,
                )}
              >
                Gửi thêm lời chúc
              </button>
            </div>
          ) : (
            <form onSubmit={handlePublicWishSubmit} className="mt-6 space-y-3" noValidate>
              <input
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="pointer-events-none fixed -left-[9999px] h-0 w-0 opacity-0 select-none"
              />

              <input
                aria-label="Tên của bạn"
                placeholder="Nhập tên hoặc biệt danh của bạn"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting !== null}
                maxLength={100}
                className={cn(
                  "h-11 w-full rounded-xl px-4 text-sm focus:outline-none focus:ring-2",
                  styles.input,
                )}
              />

              <div>
                <textarea
                  aria-label="Lời chúc dành cho cô dâu & chú rể"
                  placeholder="Viết lời chúc tốt đẹp của bạn tại đây..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={MAX_WISH_LENGTH}
                  disabled={submitting !== null}
                  rows={3}
                  className={cn(
                    "w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2",
                    styles.input,
                  )}
                />
                <div className={cn("mt-1 text-right text-[11px]", styles.subtext)}>
                  {message.length}/{MAX_WISH_LENGTH} ký tự
                </div>
              </div>

              {wishError && (
                <p role="alert" className={cn("rounded-xl border px-3.5 py-2.5 text-xs", styles.alert)}>
                  {wishError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting !== null}
                className={cn(
                  "inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full px-5 text-sm transition-colors disabled:opacity-60",
                  styles.primaryBtn,
                )}
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                <span>{submitting === "wish" ? "Đang gửi..." : "Gửi lời chúc"}</span>
              </button>
            </form>
          )}
        </div>
      </section>
    );
  }

  const showSavedSummary = !isReadOnlyPreview && !isEditingRsvp && status !== "pending";
  const activeChoice = rsvpFeedback?.choice ?? (status !== "pending" ? status : null);

  return (
    <section className={cn("px-5 py-10", styles.wrap)}>
      <div className="mx-auto max-w-[440px]">
        <div className="text-center">
          <p className={cn("text-[11px] font-medium uppercase tracking-[0.2em]", styles.eyebrow)}>
            Phản Hồi &amp; Chúc Phúc
          </p>
          <h2 className={cn("mt-1.5 text-3xl font-semibold", styles.heading)}>
            Xác Nhận Tham Dự &amp; Gửi Lời Chúc
          </h2>
          <p className={cn("mx-auto mt-2 max-w-[380px] text-sm leading-relaxed", styles.subtext)}>
            Vui lòng cho chúng mình biết bạn có thể thu xếp tham dự nhé. Bạn có thể đính kèm thêm lời chúc phúc ngay bên dưới.
          </p>
        </div>

        {showSavedSummary && activeChoice ? (
          <div className={cn("mt-6 rounded-2xl p-5 text-center", styles.card)}>
            <div className="flex items-center justify-center gap-2 font-semibold">
              {activeChoice === "accepted" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              ) : (
                <XCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
              )}
              <span>
                {activeChoice === "accepted"
                  ? "Bạn đã xác nhận sẽ tham dự"
                  : "Bạn đã báo bận không thể tham dự"}
              </span>
            </div>
            <p className={cn("mt-2 text-sm leading-relaxed", styles.subtext)}>
              {activeChoice === "accepted"
                ? "Cảm ơn bạn đã nhận lời! Chúng mình rất mong chờ được đón tiếp và nâng ly cùng bạn trong ngày vui."
                : "Rất tiếc vì bạn chưa thể sắp xếp tham dự, nhưng tấm lòng của bạn luôn đáng quý với chúng mình!"}
            </p>
            {rsvpFeedback?.wishIncluded && (
              <p className={cn("mt-2 text-xs font-medium", styles.eyebrow)}>
                Lời chúc của bạn cũng đã được gửi tới cô dâu &amp; chú rể.
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                clearAlerts();
                setRsvpFeedback(null);
                setIsEditingRsvp(true);
              }}
              className={cn(
                "mt-4 inline-flex h-9 cursor-pointer items-center justify-center rounded-full px-4 text-xs font-medium transition-colors",
                styles.outlineBtn,
              )}
            >
              Thay đổi lựa chọn hoặc gửi thêm lời chúc
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => e.preventDefault()} className="mt-6 space-y-3" noValidate>
            <input
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="pointer-events-none fixed -left-[9999px] h-0 w-0 opacity-0 select-none"
            />

            <div>
              <div className="relative">
                <input
                  aria-label="Tên của bạn"
                  placeholder="Nhập tên hoặc biệt danh của bạn"
                  value={isReadOnlyPreview ? data.ui.defaultGuestName : name}
                  onChange={(e) => setName(e.target.value)}
                  readOnly={isReadOnlyPreview || isNameLocked}
                  disabled={isReadOnlyPreview || isNameLocked || submitting !== null}
                  maxLength={100}
                  className={cn(
                    "h-11 w-full rounded-xl px-4 text-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-65",
                    isNameLocked && "pr-10",
                    styles.input,
                  )}
                />
                {isNameLocked && (
                  <Lock
                    className={cn(
                      "pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2",
                      styles.subtext,
                    )}
                    aria-hidden="true"
                  />
                )}
              </div>
              {isNameLocked && !isReadOnlyPreview && (
                <p className={cn("mt-1 px-1 text-[11px]", styles.subtext)}>
                  Tên được điền tự động theo thiệp mời cá nhân của bạn
                </p>
              )}
            </div>

            <div>
              <textarea
                aria-label="Lời chúc dành cho cô dâu & chú rể (không bắt buộc)"
                placeholder="Viết lời chúc tốt đẹp của bạn tại đây..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={MAX_WISH_LENGTH}
                disabled={isReadOnlyPreview || submitting !== null}
                rows={3}
                className={cn(
                  "w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-65",
                  styles.input,
                )}
              />
              <div className={cn("mt-1 text-right text-[11px]", styles.subtext)}>
                {message.length}/{MAX_WISH_LENGTH} ký tự
              </div>
            </div>

            {(rsvpError || wishError) && (
              <p role="alert" className={cn("rounded-xl border px-3.5 py-2.5 text-xs", styles.alert)}>
                {rsvpError ?? wishError}
              </p>
            )}

            <div className="flex flex-col gap-2 pt-1 sm:flex-row">
              <button
                type="button"
                disabled={isReadOnlyPreview || submitting !== null}
                onClick={() => handleRespond("accepted")}
                className={cn(
                  "inline-flex h-11 flex-1 cursor-pointer items-center justify-center rounded-full px-4 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-55",
                  styles.primaryBtn,
                )}
              >
                {submitting === "accepted" ? "Đang gửi..." : "Tôi sẽ tham dự"}
              </button>
              <button
                type="button"
                disabled={isReadOnlyPreview || submitting !== null}
                onClick={() => handleRespond("declined")}
                className={cn(
                  "inline-flex h-11 flex-1 cursor-pointer items-center justify-center rounded-full px-4 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-55",
                  styles.outlineBtn,
                )}
              >
                {submitting === "declined" ? "Đang gửi..." : "Tiếc quá, mình bận mất rồi"}
              </button>
            </div>

            {isReadOnlyPreview && (
              <p className={cn("pt-1 text-center text-xs italic", styles.subtext)}>
                Chế độ xem thử
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
