"use client";

import * as React from "react";
import { CheckCircle2, Lock, Send, XCircle } from "lucide-react";
import { getWishes, submitRsvp, submitWish } from "@/lib/api";
import { getWishAuthorKey } from "@/lib/wish-author";
import type { GuestDiet, GuestStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { isTurnstileEnabled, TurnstileWidget } from "@/components/TurnstileWidget";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { RevealSection } from "./RevealSection";
import { WishMarquee } from "./WishMarquee";
import { WishOverlay } from "./WishOverlay";
import {
  useInvitationContained,
  useInvitationReadOnly,
  useWeddingContent,
} from "./WeddingContentProvider";

interface RsvpWishBlockProps {
  slug?: string;
  weddingSlug?: string;
  mode?: "personal" | "public";
  guestName?: string;
  initialStatus?: GuestStatus;
  initialPlusOnes?: number;
  initialDiet?: GuestDiet | null;
  initialSongRequest?: string | null;
  initialRideNeeded?: boolean;
}

const MAX_WISH_LENGTH = 500;
const ATTENDEE_OPTIONS = Array.from({ length: 11 }, (_, idx) => idx + 1);

export function RsvpWishBlock({
  slug,
  weddingSlug,
  mode = "personal",
  guestName,
  initialStatus = "pending",
  initialPlusOnes = 0,
  initialDiet = "meat",
  initialSongRequest = "",
}: RsvpWishBlockProps) {
  const data = useWeddingContent();
  const isContained = useInvitationContained();
  const isReadOnlyPreview = useInvitationReadOnly();
  const isOliveGarden = data.templateId === "basic-1";
  const mealMode = data.mealMode ?? "meat";
  const dietOptions =
    mealMode === "both"
      ? [
          { value: "meat" as const, label: "Mặn" },
          { value: "veg" as const, label: "Chay" },
        ]
      : mealMode === "veg"
        ? [{ value: "veg" as const, label: "Chay" }]
        : [{ value: "meat" as const, label: "Mặn" }];
  const isPublicMode = !isReadOnlyPreview && mode === "public";
  const isNameLocked = !isPublicMode && !isReadOnlyPreview && Boolean(guestName && guestName.trim().length > 0);
  const effectiveWeddingSlug = weddingSlug ?? data.weddingSlug;

  const [status, setStatus] = React.useState<GuestStatus>(initialStatus);
  const [selectedChoice, setSelectedChoice] = React.useState<
    "accepted" | "declined" | null
  >(initialStatus !== "pending" ? initialStatus : null);
  const [plusOnes, setPlusOnes] = React.useState<number>(initialPlusOnes);
  const [diet, setDiet] = React.useState<GuestDiet | null>(
    initialDiet ?? (data.mealMode === "veg" ? "veg" : "meat"),
  );
  const [songRequest, setSongRequest] = React.useState<string>(initialSongRequest ?? "");

  const [isEditingRsvp, setIsEditingRsvp] = React.useState(
    initialStatus === "pending",
  );
  const [walkInGuest, setWalkInGuest] = React.useState<{
    slug: string;
    name: string;
  } | null>(null);

  const [name, setName] = React.useState(guestName ?? (isReadOnlyPreview ? (data.ui.defaultGuestName ?? "") : ""));
  const [message, setMessage] = React.useState("");
  /** Khoá định danh người gửi (link chung) — để mỗi người chỉ có 1 lời chúc. */
  const [authorKey, setAuthorKey] = React.useState<string | undefined>(undefined);
  const [hasExistingWish, setHasExistingWish] = React.useState(false);
  const [honeypot, setHoneypot] = React.useState("");
  const [turnstileToken, setTurnstileToken] = React.useState<string | null>(null);
  const [turnstileResetSignal, setTurnstileResetSignal] = React.useState(0);

  const [submitting, setSubmitting] = React.useState<"rsvp" | "wish" | null>(null);

  // Mỗi người một lời chúc: lấy khoá định danh + điền sẵn lời chúc cũ để sửa.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    setAuthorKey(getWishAuthorKey(effectiveWeddingSlug));
  }, [effectiveWeddingSlug]);

  React.useEffect(() => {
    if (isReadOnlyPreview || !effectiveWeddingSlug) return;
    let alive = true;
    getWishes({
      weddingSlug: effectiveWeddingSlug,
      slug: isPublicMode ? undefined : slug,
      authorKey,
    })
      .then((res) => {
        if (!alive || !res.mine) return;
        setHasExistingWish(true);
        setMessage((prev) => (prev.trim().length > 0 ? prev : res.mine!.message));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [authorKey, effectiveWeddingSlug, isPublicMode, isReadOnlyPreview, slug]);

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
    if (guestName) {
      setName(guestName);
    }
  }, [guestName]);

  const clearAlerts = () => {
    setRsvpError(null);
    setWishError(null);
  };

  const getActiveSlug = (trimmedName: string): string | undefined => {
    if (slug) return slug;
    if (walkInGuest && walkInGuest.name === trimmedName) {
      return walkInGuest.slug;
    }
    return undefined;
  };

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();
    setRsvpFeedback(null);

    const trimmedName = name.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName) {
      setRsvpError("Vui lòng nhập Họ và tên trước khi gửi xác nhận.");
      return;
    }
    if (trimmedName.length > 100) {
      setRsvpError("Họ và tên tối đa 100 ký tự.");
      return;
    }
    if (!selectedChoice) {
      setRsvpError("Vui lòng chọn bạn sẽ tham dự hay không.");
      return;
    }
    if (selectedChoice === "accepted") {
      const attendeesCount = plusOnes + 1;
      if (attendeesCount < 1 || attendeesCount > 11) {
        setRsvpError("Số người đi từ 1 đến 11 người.");
        return;
      }
    }
    if (trimmedMessage.length > MAX_WISH_LENGTH) {
      setWishError(`Lời chúc tối đa ${MAX_WISH_LENGTH} ký tự.`);
      return;
    }

    const nextPlusOnes = selectedChoice === "accepted" ? plusOnes : 0;
    const nextDiet =
      selectedChoice === "accepted"
        ? mealMode === "both"
          ? (diet ?? "meat")
          : mealMode
        : null;
    const nextSongRequest =
      selectedChoice === "accepted" && songRequest.trim() ? songRequest.trim() : null;
    const nextRideNeeded = false;

    if (isReadOnlyPreview) {
      setStatus(selectedChoice);
      setRsvpFeedback({
        choice: selectedChoice,
        plusOnes: nextPlusOnes,
        diet: nextDiet,
        wishIncluded: trimmedMessage.length > 0,
      });
      setIsEditingRsvp(false);
      return;
    }

    // Honeypot chống spam tự động
    if (honeypot.trim().length > 0) {
      setStatus(selectedChoice);
      setMessage("");
      setRsvpFeedback({
        choice: selectedChoice,
        plusOnes: nextPlusOnes,
        diet: nextDiet,
        wishIncluded: trimmedMessage.length > 0,
      });
      setIsEditingRsvp(false);
      return;
    }

    if (isTurnstileEnabled() && !turnstileToken) {
      setRsvpError("Vui lòng hoàn tất xác thực bảo mật trước khi gửi.");
      return;
    }

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
            songRequest: nextSongRequest,
            rideNeeded: nextRideNeeded,
            wish: trimmedMessage || undefined,
            authorKey,
            turnstileToken: turnstileToken ?? undefined,
            website: honeypot,
          }
          : {
            weddingSlug: effectiveWeddingSlug,
            name: trimmedName,
            status: selectedChoice,
            plusOnes: nextPlusOnes,
            diet: nextDiet,
            songRequest: nextSongRequest,
            rideNeeded: nextRideNeeded,
            wish: trimmedMessage || undefined,
            authorKey,
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
        authorKey,
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

  const handleOpenEdit = () => {
    clearAlerts();
    setRsvpFeedback(null);
    setSelectedChoice(status !== "pending" ? status : selectedChoice);
    setIsEditingRsvp(true);
  };

  if (isPublicMode) {
    return (
      <RevealSection
        id="rsvp-wishes"
        className={cn(
          "scroll-mt-10 bg-inv-bg pb-6",
          isContained ? "px-3.5 pt-8" : "px-5 pt-10",
        )}
      >
        <div className="mx-auto max-w-[440px]">
          <div className="text-center">
            <h2
              className={cn(
                "font-inv-script leading-[1.2] font-normal text-inv-olive-deep",
                isContained
                  ? "text-[clamp(26px,9cqw,38px)]"
                  : "text-[clamp(32px,8.8vw,46px)]",
              )}
            >
              Gửi Lời Chúc
            </h2>
            <p
              className={cn(
                "mx-auto mt-2.5 max-w-[390px] font-inv-serif leading-[1.55] text-inv-olive-btn",
                isContained ? "text-[13px]" : "text-[14px] sm:text-[15px]",
              )}
            >
              Gửi đôi lời yêu thương để cùng lưu giữ những kỷ niệm đẹp nhất trong ngày cưới của chúng mình.
            </p>
          </div>

          {publicWishSent ? (
            <div className="mt-7 space-y-4 text-center">
              <div className="rounded-2xl border border-inv-olive/30 bg-inv-tint p-5 text-inv-ink">
                <div className="flex items-center justify-center gap-2 font-inv-serif font-semibold">
                  <CheckCircle2
                    className="h-5 w-5 shrink-0 text-inv-olive-deep"
                    aria-hidden="true"
                  />
                  <span>Đã gửi lời chúc</span>
                </div>
                <p className="mt-2 font-inv-serif text-sm leading-relaxed text-inv-text">
                  Cảm ơn bạn thật nhiều! Lời chúc của bạn đã được gửi tới cô dâu &amp; chú rể.
                </p>
              </div>
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPublicWishSent(false)}
                  className="rounded-full border-inv-olive/45 bg-inv-bg px-5 font-inv-serif text-inv-olive-deep hover:bg-inv-tint"
                >
                  Gửi thêm lời chúc
                </Button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handlePublicWishSubmit}
              className="mt-7 space-y-3"
              noValidate
            >
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
                <Input
                  aria-label="Tên của bạn"
                  placeholder="Nhập tên hoặc biệt danh của bạn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting !== null}
                  required
                  maxLength={100}
                  className="h-11 rounded-full border-inv-olive-btn bg-inv-bg px-4 font-inv-serif text-base text-inv-ink placeholder:text-inv-olive-btn/80 focus-visible:border-inv-olive-deep focus-visible:ring-inv-olive sm:text-sm"
                />
              </div>

              <div>
                <Textarea
                  aria-label="Lời chúc dành cho cô dâu & chú rể"
                  placeholder="Viết lời chúc tốt đẹp của bạn tại đây..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={MAX_WISH_LENGTH}
                  disabled={submitting !== null}
                  className="min-h-[104px] rounded-[19px] border-inv-olive-btn bg-inv-bg px-4 py-3 font-inv-serif text-base text-inv-ink placeholder:text-inv-olive-btn/80 focus-visible:border-inv-olive-deep focus-visible:ring-inv-olive sm:text-sm"
                  rows={4}
                />
                <div className="mt-1 flex justify-end px-2">
                  <span
                    className={
                      message.length >= MAX_WISH_LENGTH
                        ? "font-inv-serif text-xs font-semibold text-inv-olive-deep"
                        : "font-inv-serif text-xs text-inv-muted"
                    }
                  >
                    {message.length}/{MAX_WISH_LENGTH} ký tự
                  </span>
                </div>
              </div>

              <TurnstileWidget
                onTokenChange={setTurnstileToken}
                resetSignal={turnstileResetSignal}
                theme="light"
                className="flex justify-center pt-1"
              />

              {wishError && (
                <p
                  role="alert"
                  className="rounded-2xl border border-inv-olive/35 bg-inv-tint px-4 py-2.5 font-inv-serif text-sm text-inv-ink"
                >
                  {wishError}
                </p>
              )}

              <div className="pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={submitting === "wish"}
                  disabled={submitting !== null}
                  className="h-11 w-full rounded-full bg-inv-olive-btn font-inv-serif text-sm tracking-[0.02em] text-white hover:bg-inv-olive-hover"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  <span>Gửi lời chúc</span>
                </Button>
              </div>
            </form>
          )}

          {/* Sổ lưu bút luôn hiển thị, kể cả sau khi đã gửi lời chúc */}
          <WishOverlay />
          <WishMarquee tone="olive" className="mt-5" />
        </div>
      </RevealSection>
    );
  }

  const showSavedSummary =
    !isReadOnlyPreview &&
    !isEditingRsvp &&
    status !== "pending";

  const activeChoice =
    rsvpFeedback?.choice ?? (status !== "pending" ? status : null);
  const summaryPlusOnes = rsvpFeedback?.plusOnes ?? plusOnes;
  const summaryDiet = rsvpFeedback?.diet ?? diet;

  return (
    <RevealSection
      id="rsvp-wishes"
      className={cn(
        "scroll-mt-10 bg-inv-bg pb-6",
        isContained ? "px-3.5 pt-8" : "px-5 pt-10",
      )}
    >
      <div className="mx-auto max-w-[440px]">
        <div className="text-center">
          <h2
            className={cn(
              "font-inv-script leading-[1.2] font-normal text-inv-olive-deep",
              isContained
                ? "text-[clamp(26px,9cqw,38px)]"
                : "text-[clamp(32px,8.8vw,46px)]",
            )}
          >
            {isOliveGarden ? "Xác nhận Tham Dự" : "Xác Nhận Tham Dự"}
          </h2>
          <p
            className={cn(
              "mx-auto mt-2.5 max-w-[390px] font-inv-serif leading-[1.55] text-inv-olive-btn",
              isContained ? "text-[13px]" : "text-[14px] sm:text-[15px]",
            )}
          >
            {isOliveGarden
              ? "Sự có mặt của quý khách là niềm vui lớn của gia đình chúng tôi. Xin dành chút thời gian xác nhận để chúng tôi chuẩn bị đón tiếp thật chu đáo. Trân trọng!"
              : "Vui lòng cho chúng mình biết bạn có thể thu xếp tham dự nhé. Bạn có thể đính kèm thêm lời chúc phúc ngay bên dưới."}
          </p>
        </div>

        {showSavedSummary && activeChoice ? (
          <div className="mt-7 space-y-4 text-center">
            <div className="rounded-2xl border border-inv-olive/30 bg-inv-tint p-5 text-inv-ink">
              <div className="flex items-center justify-center gap-2 font-inv-serif font-semibold">
                {activeChoice === "accepted" ? (
                  <CheckCircle2
                    className="h-5 w-5 shrink-0 text-inv-olive-deep"
                    aria-hidden="true"
                  />
                ) : (
                  <XCircle
                    className="h-5 w-5 shrink-0 text-inv-olive-deep"
                    aria-hidden="true"
                  />
                )}
                <span>
                  {activeChoice === "accepted"
                    ? "Bạn đã xác nhận sẽ tham dự"
                    : "Bạn đã báo bận không thể tham dự"}
                </span>
              </div>
              <p className="mt-2 font-inv-serif text-sm leading-relaxed text-inv-text">
                {activeChoice === "accepted"
                  ? "Cảm ơn bạn đã nhận lời! Chúng mình rất mong chờ được đón tiếp và nâng ly cùng bạn trong ngày vui."
                  : "Rất tiếc vì bạn chưa thể sắp xếp tham dự, nhưng tấm lòng của bạn luôn đáng quý với chúng mình!"}
              </p>

              {activeChoice === "accepted" &&
                (summaryPlusOnes > 0 || summaryDiet) && (
                  <div className="mt-3 flex flex-wrap justify-center gap-2 border-t border-inv-olive/20 pt-2.5 font-inv-serif text-xs text-inv-olive-deep">
                    {summaryPlusOnes > 0 && (
                      <span className="rounded-full border border-inv-olive/30 bg-inv-bg px-2.5 py-0.5 font-medium">
                        +{summaryPlusOnes} người đi cùng
                      </span>
                    )}
                    {summaryDiet && (
                      <span className="rounded-full border border-inv-olive/30 bg-inv-bg px-2.5 py-0.5 font-medium">
                        Chế độ ăn: {summaryDiet === "veg" ? "Chay" : "Mặn"}
                      </span>
                    )}
                  </div>
                )}

              {rsvpFeedback?.wishIncluded && (
                <p className="mt-2.5 border-t border-inv-olive/20 pt-2.5 font-inv-serif text-xs font-medium text-inv-olive-deep">
                  Lời chúc của bạn cũng đã được gửi tới cô dâu &amp; chú rể.
                </p>
              )}
            </div>

            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenEdit}
                className="rounded-full border-inv-olive/45 bg-inv-bg px-5 font-inv-serif text-inv-olive-deep hover:bg-inv-tint"
              >
                Thay đổi lựa chọn hoặc gửi thêm lời chúc
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleRsvpSubmit}
            className="mt-7 space-y-3.5"
            noValidate
          >
            {/* Trường honeypot ẩn chống spam */}
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
              <label
                htmlFor="rsvp-name-input"
                className="block font-inv-serif text-xs font-semibold text-inv-ink mb-1.5"
              >
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  id="rsvp-name-input"
                  aria-label="Họ và tên"
                  placeholder="Nhập họ và tên của bạn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  readOnly={isNameLocked}
                  disabled={isNameLocked || submitting !== null}
                  required
                  maxLength={100}
                  className={
                    isNameLocked
                      ? "h-11 rounded-full border-inv-olive-btn bg-inv-bg px-4 pr-10 font-inv-serif text-base text-inv-ink placeholder:text-inv-olive-btn/80 focus-visible:border-inv-olive-deep focus-visible:ring-inv-olive sm:text-sm"
                      : "h-11 rounded-full border-inv-olive-btn bg-inv-bg px-4 font-inv-serif text-base text-inv-ink placeholder:text-inv-olive-btn/80 focus-visible:border-inv-olive-deep focus-visible:ring-inv-olive sm:text-sm"
                  }
                />
                {isNameLocked && (
                  <Lock
                    className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-inv-olive-btn"
                    aria-hidden="true"
                  />
                )}
              </div>
              {isNameLocked && !isReadOnlyPreview && (
                <p className="mt-1.5 px-3 font-inv-serif text-xs text-inv-muted">
                  Tên được điền tự động theo thiệp mời cá nhân của bạn
                </p>
              )}
            </div>

            <div>
              <p className="font-inv-serif text-xs font-semibold text-inv-ink mb-1.5">
                Phản hồi tham dự <span className="text-red-500">*</span>
              </p>
              <div
                role="group"
                aria-label="Lựa chọn tham dự"
                className={cn(
                  "grid grid-cols-1 gap-2",
                  !isContained && "sm:grid-cols-2",
                )}
              >
                <button
                  type="button"
                  disabled={submitting !== null}
                  aria-pressed={selectedChoice === "accepted"}
                  onClick={() => {
                    clearAlerts();
                    setSelectedChoice("accepted");
                  }}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center justify-center rounded-full border px-4 py-2 text-center font-inv-serif text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inv-olive",
                    selectedChoice === "accepted"
                      ? "border-inv-olive-deep bg-inv-olive-btn font-semibold text-white"
                      : "border-inv-olive-btn bg-inv-bg text-inv-olive-deep hover:bg-inv-tint",
                  )}
                >
                  Tôi sẽ tham dự
                </button>
                <button
                  type="button"
                  disabled={submitting !== null}
                  aria-pressed={selectedChoice === "declined"}
                  onClick={() => {
                    clearAlerts();
                    setSelectedChoice("declined");
                  }}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center justify-center rounded-full border px-4 py-2 text-center font-inv-serif text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inv-olive",
                    selectedChoice === "declined"
                      ? "border-inv-olive-deep bg-inv-olive-deep font-semibold text-white"
                      : "border-inv-olive/50 bg-inv-bg text-inv-olive-deep hover:bg-inv-tint",
                  )}
                >
                  {isOliveGarden ? "Tiếc quá, tôi bận mất rồi" : "Tiếc quá, mình bận mất rồi"}
                </button>
              </div>
            </div>

            {selectedChoice === "accepted" && (
              <div className="space-y-3 rounded-2xl border border-inv-olive/30 bg-inv-tint p-4">
                <div>
                  <label
                    htmlFor="olive-plus-ones"
                    className="block font-inv-serif text-xs font-semibold text-inv-ink"
                  >
                    Số người đi <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="olive-plus-ones"
                    value={plusOnes + 1}
                    onChange={(e) => setPlusOnes(Math.max(0, Number(e.target.value) - 1))}
                    disabled={submitting !== null}
                    className="mt-1.5 h-10 w-full rounded-xl border border-inv-olive/45 bg-inv-bg px-3 font-inv-serif text-sm text-inv-ink focus:border-inv-olive-deep focus:outline-none focus:ring-2 focus:ring-inv-olive"
                  >
                    {ATTENDEE_OPTIONS.map((count) => (
                      <option key={count} value={count}>
                        {count === 1
                          ? "1 người (chỉ mình tôi)"
                          : `${count} người`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="block font-inv-serif text-xs font-semibold text-inv-ink">
                    Ăn chay / Ăn mặn
                  </span>
                  <div className={cn("mt-1.5 grid gap-2", dietOptions.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                    {dietOptions.map((opt) => {
                      const active = (diet ?? "meat") === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={submitting !== null || dietOptions.length === 1}
                          aria-pressed={active}
                          onClick={() => dietOptions.length > 1 && setDiet(opt.value)}
                          className={cn(
                            "flex h-9 cursor-pointer items-center justify-center rounded-xl border font-inv-serif text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inv-olive",
                            active
                              ? "border-inv-olive-deep bg-inv-olive-btn font-semibold text-white"
                              : "border-inv-olive/40 bg-inv-bg text-inv-ink hover:bg-white",
                          )}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="rsvp-song-request"
                    className="block font-inv-serif text-xs font-semibold text-inv-ink mb-1.5"
                  >
                    Bài hát bạn muốn nghe (tùy chọn)
                  </label>
                  <Input
                    id="rsvp-song-request"
                    type="text"
                    value={songRequest}
                    onChange={(e) => setSongRequest(e.target.value)}
                    maxLength={200}
                    disabled={submitting !== null}
                    placeholder="Gợi ý bài hát bạn muốn nghe tại tiệc cưới..."
                    className="h-10 text-xs sm:text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="rsvp-wish-message"
                className="block font-inv-serif text-xs font-semibold text-inv-ink mb-1.5"
              >
                Lời chúc dành cho cô dâu &amp; chú rể (không bắt buộc)
              </label>
              <Textarea
                id="rsvp-wish-message"
                aria-label="Lời chúc dành cho cô dâu & chú rể"
                placeholder="Viết lời chúc tốt đẹp của bạn tại đây (không bắt buộc)..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={MAX_WISH_LENGTH}
                disabled={submitting !== null}
                className="min-h-[96px] rounded-[19px] border-inv-olive-btn bg-inv-bg px-4 py-3 font-inv-serif text-base text-inv-ink placeholder:text-inv-olive-btn/80 focus-visible:border-inv-olive-deep focus-visible:ring-inv-olive sm:text-sm"
                rows={3}
              />
              {hasExistingWish && (
                <p className="mt-1.5 px-1 font-inv-serif text-[11px] leading-relaxed text-inv-muted">
                  Bạn đã gửi lời chúc trước đó — sửa lại ở trên rồi gửi để cập nhật
                  (mỗi người chỉ có một lời chúc).
                </p>
              )}
              <div className="mt-1 flex justify-end px-2">
                <span
                  className={
                    message.length >= MAX_WISH_LENGTH
                      ? "font-inv-serif text-xs font-semibold text-inv-olive-deep"
                      : "font-inv-serif text-xs text-inv-muted"
                  }
                >
                  {message.length}/{MAX_WISH_LENGTH} ký tự
                </span>
              </div>
            </div>

            {!isReadOnlyPreview && (
              <TurnstileWidget
                onTokenChange={setTurnstileToken}
                resetSignal={turnstileResetSignal}
                theme="light"
                className="flex justify-center"
              />
            )}

            {(rsvpError || wishError) && (
              <p
                role="alert"
                className="rounded-2xl border border-inv-olive/35 bg-inv-tint px-4 py-2.5 font-inv-serif text-sm text-inv-ink"
              >
                {rsvpError ?? wishError}
              </p>
            )}

            <div className="space-y-2.5 pt-1">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={submitting === "rsvp"}
                  disabled={submitting !== null}
                  className="h-11 w-full rounded-full bg-inv-olive-btn font-inv-serif text-sm tracking-[0.02em] text-white hover:bg-inv-olive-hover"
                >
                  <span>Gửi xác nhận</span>
                </Button>
                {isReadOnlyPreview && (
                  <span className="text-center font-inv-serif text-xs text-inv-muted whitespace-nowrap">
                    Đây là bản xem thử
                  </span>
                )}
              </div>

              {isReadOnlyPreview && (
                <p className="text-center font-inv-serif text-xs italic text-inv-muted">
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
                    className="cursor-pointer font-inv-serif text-xs font-medium text-inv-olive-deep underline underline-offset-4 hover:opacity-80"
                  >
                    Giữ nguyên lựa chọn trước đó
                  </button>
                </div>
              )}
            </div>
          </form>
        )}

        {/* Sổ lưu bút nằm dưới nút "Thay đổi lựa chọn..." và luôn hiển thị,
            kể cả sau khi khách đã xác nhận tham dự. */}
        <WishOverlay />
        <WishMarquee tone="olive" className="mt-5" />
      </div>
    </RevealSection>
  );
}
