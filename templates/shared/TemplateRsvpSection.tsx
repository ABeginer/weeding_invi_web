"use client";

import * as React from "react";
import { CheckCircle2, Lock, Send, XCircle } from "lucide-react";
import { submitRsvp, submitWish } from "@/lib/api";
import type { GuestDiet, GuestStatus, TemplateData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { isTurnstileEnabled, TurnstileWidget } from "@/components/TurnstileWidget";
import type { TemplateRenderMode } from "../types";
import type { TemplateTone } from "./TemplateOverlays";

interface TemplateRsvpSectionProps {
  data: TemplateData;
  mode: TemplateRenderMode;
  tone: TemplateTone;
  contained?: boolean;
  inviteSlug?: string;
  weddingSlug?: string;
  invitationMode?: "personal" | "public";
  guestName?: string | null;
  initialStatus?: GuestStatus;
  initialPlusOnes?: number;
  initialDiet?: GuestDiet | null;
}

const MAX_WISH_LENGTH = 500;
const PLUS_ONES_OPTIONS = Array.from({ length: 11 }, (_, idx) => idx);

export function TemplateRsvpSection({
  data,
  mode,
  tone,
  contained = false,
  inviteSlug,
  weddingSlug,
  invitationMode = "personal",
  guestName,
  initialStatus = "pending",
  initialPlusOnes = 0,
  initialDiet = null,
}: TemplateRsvpSectionProps) {
  const isReadOnlyPreview = mode === "demo" || mode === "preview";
  const isPublicMode = !isReadOnlyPreview && invitationMode === "public";
  const isNameLocked = !isPublicMode && Boolean(guestName && guestName.trim().length > 0);
  const effectiveWeddingSlug = weddingSlug ?? data.weddingSlug;

  const [status, setStatus] = React.useState<GuestStatus>(initialStatus);
  const [selectedChoice, setSelectedChoice] = React.useState<
    "accepted" | "declined" | null
  >(initialStatus !== "pending" ? initialStatus : null);
  const [plusOnes, setPlusOnes] = React.useState<number>(initialPlusOnes);
  const [diet, setDiet] = React.useState<GuestDiet | null>(initialDiet);

  const [isEditingRsvp, setIsEditingRsvp] = React.useState(
    initialStatus === "pending",
  );
  const [walkInGuest, setWalkInGuest] = React.useState<{
    slug: string;
    name: string;
  } | null>(null);

  const [name, setName] = React.useState(guestName ?? "");
  const [message, setMessage] = React.useState("");
  const [honeypot, setHoneypot] = React.useState("");
  const [turnstileToken, setTurnstileToken] = React.useState<string | null>(null);
  const [turnstileResetSignal, setTurnstileResetSignal] = React.useState(0);

  const [submitting, setSubmitting] = React.useState<"rsvp" | "wish" | null>(null);
  const [rsvpFeedback, setRsvpFeedback] = React.useState<{
    choice: "accepted" | "declined";
    plusOnes: number;
    diet: GuestDiet | null;
    wishIncluded: boolean;
  } | null>(null);
  const [rsvpError, setRsvpError] = React.useState<string | null>(null);
  const [wishError, setWishError] = React.useState<string | null>(null);
  const [publicWishSent, setPublicWishSent] = React.useState(false);

  React.useEffect(() => {
    setStatus(initialStatus);
    setSelectedChoice(initialStatus !== "pending" ? initialStatus : null);
    setIsEditingRsvp(initialStatus === "pending");
  }, [initialStatus]);

  React.useEffect(() => {
    setPlusOnes(initialPlusOnes);
  }, [initialPlusOnes]);

  React.useEffect(() => {
    setDiet(initialDiet);
  }, [initialDiet]);

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

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnlyPreview) return;
    clearAlerts();
    setRsvpFeedback(null);

    const trimmedName = name.trim();
    const trimmedMessage = message.trim();

    if (!selectedChoice) {
      setRsvpError("Vui lòng chọn bạn sẽ tham dự hay không.");
      return;
    }

    if (honeypot.trim().length > 0) {
      setStatus(selectedChoice);
      setMessage("");
      setRsvpFeedback({
        choice: selectedChoice,
        plusOnes: selectedChoice === "accepted" ? plusOnes : 0,
        diet: selectedChoice === "accepted" ? diet : null,
        wishIncluded: trimmedMessage.length > 0,
      });
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
    if (isTurnstileEnabled() && !turnstileToken) {
      setRsvpError("Vui lòng hoàn tất xác thực bảo mật trước khi gửi.");
      return;
    }

    const nextPlusOnes = selectedChoice === "accepted" ? plusOnes : 0;
    const nextDiet = selectedChoice === "accepted" ? diet : null;

    setSubmitting("rsvp");
    const savedSlug = getActiveSlug(trimmedName);
    try {
      const res = await submitRsvp(
        savedSlug
          ? {
            slug: savedSlug,
            status: selectedChoice,
            plusOnes: nextPlusOnes,
            diet: nextDiet,
            wish: trimmedMessage || undefined,
            turnstileToken: turnstileToken ?? undefined,
            website: honeypot,
          }
          : {
            weddingSlug: effectiveWeddingSlug,
            name: trimmedName,
            status: selectedChoice,
            plusOnes: nextPlusOnes,
            diet: nextDiet,
            wish: trimmedMessage || undefined,
            turnstileToken: turnstileToken ?? undefined,
            website: honeypot,
          },
      );
      if (!savedSlug && res.slug) {
        setWalkInGuest({ slug: res.slug, name: trimmedName });
      }
      setStatus(selectedChoice);
      setMessage("");
      setRsvpFeedback({
        choice: selectedChoice,
        plusOnes: nextPlusOnes,
        diet: nextDiet,
        wishIncluded: Boolean(trimmedMessage && (res.wishSaved ?? true)),
      });
      setIsEditingRsvp(false);
    } catch (err) {
      setRsvpError(
        err instanceof Error
          ? err.message
          : "Không thể gửi xác nhận tham dự lúc này. Vui lòng thử lại.",
      );
    } finally {
      setSubmitting(null);
      setTurnstileResetSignal((prev) => prev + 1);
    }
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
    if (isTurnstileEnabled() && !turnstileToken) {
      setWishError("Vui lòng hoàn tất xác thực bảo mật trước khi gửi.");
      return;
    }

    setSubmitting("wish");
    try {
      await submitWish({
        weddingSlug: effectiveWeddingSlug,
        name: trimmedName,
        message: trimmedMessage,
        turnstileToken: turnstileToken ?? undefined,
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
      setTurnstileResetSignal((prev) => prev + 1);
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
        badge: "border-lnd-gold-soft bg-lnd-surface text-lnd-body",
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
          badge: "border-[#E7CFC3] bg-[#FCF5F0] text-[#5C2626]",
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
          badge: "border-[#DFD5C3] bg-[#FAF7F0] text-[#23201C]",
        };

  const turnstileTheme = tone === "obsidian" ? "dark" : "light";

  if (isPublicMode) {
    return (
      <section
        id="rsvp-wishes"
        className={cn(
          "scroll-mt-10",
          contained ? "px-3.5 py-8" : "px-5 py-10",
          styles.wrap,
        )}
      >
        <div className="mx-auto max-w-[440px]">
          <div className="text-center">
            <p className={cn("text-[11px] font-medium uppercase tracking-[0.2em]", styles.eyebrow)}>
              Phản Hồi &amp; Chúc Phúc
            </p>
            <h2
              className={cn(
                "mt-1.5 font-semibold",
                contained ? "text-2xl" : "text-3xl",
                styles.heading,
              )}
            >
              Gửi Lời Chúc Phúc
            </h2>
            <p
              className={cn(
                "mx-auto mt-2 max-w-[380px] leading-relaxed",
                contained ? "text-xs" : "text-sm",
                styles.subtext,
              )}
            >
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

              <TurnstileWidget
                onTokenChange={setTurnstileToken}
                resetSignal={turnstileResetSignal}
                theme={turnstileTheme}
                className="flex justify-center pt-1"
              />

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
  const summaryPlusOnes = rsvpFeedback?.plusOnes ?? plusOnes;
  const summaryDiet = rsvpFeedback?.diet ?? diet;

  return (
    <section
      id="rsvp-wishes"
      className={cn(
        "scroll-mt-10",
        contained ? "px-3.5 py-8" : "px-5 py-10",
        styles.wrap,
      )}
    >
      <div className="mx-auto max-w-[440px]">
        <div className="text-center">
          <p className={cn("text-[11px] font-medium uppercase tracking-[0.2em]", styles.eyebrow)}>
            Phản Hồi &amp; Chúc Phúc
          </p>
          <h2
            className={cn(
              "mt-1.5 font-semibold",
              contained ? "text-2xl" : "text-3xl",
              styles.heading,
            )}
          >
            Xác Nhận Tham Dự &amp; Gửi Lời Chúc
          </h2>
          <p
            className={cn(
              "mx-auto mt-2 max-w-[380px] leading-relaxed",
              contained ? "text-xs" : "text-sm",
              styles.subtext,
            )}
          >
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
            {activeChoice === "accepted" && (summaryPlusOnes > 0 || summaryDiet) && (
              <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
                {summaryPlusOnes > 0 && (
                  <span className={cn("rounded-full border px-2.5 py-0.5 font-medium", styles.badge)}>
                    +{summaryPlusOnes} người đi cùng
                  </span>
                )}
                {summaryDiet && (
                  <span className={cn("rounded-full border px-2.5 py-0.5 font-medium", styles.badge)}>
                    Chế độ ăn: {summaryDiet === "veg" ? "Chay" : "Mặn"}
                  </span>
                )}
              </div>
            )}
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
                setSelectedChoice(activeChoice);
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
          <form onSubmit={handleRsvpSubmit} className="mt-6 space-y-3" noValidate>
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

            <div
              role="group"
              aria-label="Lựa chọn tham dự"
              className={cn(
                "grid grid-cols-1 gap-2",
                !contained && "sm:grid-cols-2",
              )}
            >
              <button
                type="button"
                disabled={isReadOnlyPreview || submitting !== null}
                aria-pressed={selectedChoice === "accepted"}
                onClick={() => {
                  clearAlerts();
                  setSelectedChoice("accepted");
                }}
                className={cn(
                  "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full px-4 py-2 text-center text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-55",
                  selectedChoice === "accepted" ? styles.primaryBtn : styles.outlineBtn,
                )}
              >
                Tôi sẽ tham dự
              </button>
              <button
                type="button"
                disabled={isReadOnlyPreview || submitting !== null}
                aria-pressed={selectedChoice === "declined"}
                onClick={() => {
                  clearAlerts();
                  setSelectedChoice("declined");
                }}
                className={cn(
                  "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full px-4 py-2 text-center text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-55",
                  selectedChoice === "declined" ? styles.primaryBtn : styles.outlineBtn,
                )}
              >
                Tiếc quá, mình bận mất rồi
              </button>
            </div>

            {selectedChoice === "accepted" && !isReadOnlyPreview && (
              <div className={cn("space-y-3 rounded-xl p-3.5", styles.card)}>
                <div>
                  <label
                    htmlFor={`tpl-plus-ones-${tone}`}
                    className="block text-xs font-semibold"
                  >
                    Số người đi cùng
                  </label>
                  <select
                    id={`tpl-plus-ones-${tone}`}
                    value={plusOnes}
                    onChange={(e) => setPlusOnes(Number(e.target.value))}
                    disabled={submitting !== null}
                    className={cn(
                      "mt-1.5 h-10 w-full rounded-lg px-3 text-xs sm:text-sm focus:outline-none focus:ring-2",
                      styles.input,
                    )}
                  >
                    {PLUS_ONES_OPTIONS.map((count) => (
                      <option key={count} value={count}>
                        {count === 0
                          ? "Chỉ mình tôi (0 người đi cùng)"
                          : `+${count} người đi cùng (tổng ${count + 1} người)`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="block text-xs font-semibold">Chế độ ăn</span>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    {[
                      { value: "meat" as const, label: "Mặn" },
                      { value: "veg" as const, label: "Chay" },
                    ].map((opt) => {
                      const active = diet === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={submitting !== null}
                          aria-pressed={active}
                          onClick={() =>
                            setDiet((prev) =>
                              prev === opt.value ? null : opt.value,
                            )
                          }
                          className={cn(
                            "inline-flex h-9 cursor-pointer items-center justify-center rounded-lg text-xs font-medium transition-colors",
                            active ? styles.primaryBtn : styles.outlineBtn,
                          )}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div>
              <textarea
                aria-label="Lời chúc dành cho cô dâu & chú rể (không bắt buộc)"
                placeholder="Viết lời chúc tốt đẹp của bạn tại đây (không bắt buộc)..."
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

            {!isReadOnlyPreview && (
              <TurnstileWidget
                onTokenChange={setTurnstileToken}
                resetSignal={turnstileResetSignal}
                theme={turnstileTheme}
                className="flex justify-center pt-1"
              />
            )}

            {(rsvpError || wishError) && (
              <p role="alert" className={cn("rounded-xl border px-3.5 py-2.5 text-xs", styles.alert)}>
                {rsvpError ?? wishError}
              </p>
            )}

            <button
              type="submit"
              disabled={isReadOnlyPreview || submitting !== null}
              className={cn(
                "inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-full px-4 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-55",
                styles.primaryBtn,
              )}
            >
              {submitting === "rsvp" ? "Đang gửi..." : "Gửi xác nhận"}
            </button>

            {isReadOnlyPreview && (
              <p className={cn("pt-1 text-center text-xs italic", styles.subtext)}>
                Chế độ xem thử
              </p>
            )}

            {!isReadOnlyPreview && status !== "pending" && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    clearAlerts();
                    setIsEditingRsvp(false);
                  }}
                  className={cn(
                    "cursor-pointer text-xs font-medium underline underline-offset-4 hover:opacity-80",
                    styles.eyebrow,
                  )}
                >
                  Giữ nguyên lựa chọn trước đó
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
