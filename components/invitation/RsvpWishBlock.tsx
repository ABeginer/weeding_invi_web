"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Lock, Send, XCircle } from "lucide-react";
import { submitRsvp, submitWish } from "@/lib/api";
import { GuestStatus } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { RevealSection } from "./RevealSection";
import { useInvitationDemoMode, useWeddingContent } from "./WeddingContentProvider";

interface RsvpWishBlockProps {
  slug?: string;
  weddingSlug?: string;
  mode?: "personal" | "public";
  guestName?: string;
  initialStatus?: GuestStatus;
}

const MAX_WISH_LENGTH = 500;

export function RsvpWishBlock({
  slug,
  weddingSlug,
  mode = "personal",
  guestName,
  initialStatus = "pending",
}: RsvpWishBlockProps) {
  const wedding = useWeddingContent();
  const isDemo = useInvitationDemoMode();
  const isPublicMode = mode === "public";
  const isNameLocked = !isPublicMode && Boolean(guestName && guestName.trim().length > 0);
  const copy = wedding.sections.rsvpWish;

  const [status, setStatus] = React.useState<GuestStatus>(initialStatus);
  const [isEditingRsvp, setIsEditingRsvp] = React.useState(
    initialStatus === "pending"
  );
  const [walkInGuest, setWalkInGuest] = React.useState<{
    slug: string;
    name: string;
  } | null>(null);

  const [name, setName] = React.useState(guestName ?? "");
  const [message, setMessage] = React.useState("");
  const [honeypot, setHoneypot] = React.useState("");

  const [submitting, setSubmitting] = React.useState<
    "accepted" | "declined" | "wish" | null
  >(null);

  const [rsvpFeedback, setRsvpFeedback] = React.useState<{
    choice: "accepted" | "declined";
    wishIncluded: boolean;
  } | null>(null);

  const [rsvpError, setRsvpError] = React.useState<string | null>(null);
  const [wishError, setWishError] = React.useState<string | null>(null);
  const [rsvpSavedBeforeWishFailed, setRsvpSavedBeforeWishFailed] =
    React.useState(false);
  const [publicWishSent, setPublicWishSent] = React.useState(false);

  React.useEffect(() => {
    setStatus(initialStatus);
    setIsEditingRsvp(initialStatus === "pending");
  }, [initialStatus]);

  React.useEffect(() => {
    if (guestName) {
      setName(guestName);
    }
  }, [guestName]);

  const clearAlerts = () => {
    setRsvpError(null);
    setWishError(null);
    setRsvpSavedBeforeWishFailed(false);
  };

  const getActiveSlug = (trimmedName: string): string | undefined => {
    if (slug) return slug;
    if (walkInGuest && walkInGuest.name === trimmedName) {
      return walkInGuest.slug;
    }
    return undefined;
  };

  const handleRespond = async (choice: "accepted" | "declined") => {
    clearAlerts();
    setRsvpFeedback(null);

    const trimmedName = name.trim();
    const trimmedMessage = message.trim();

    // Honeypot chống spam tự động
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

    if (isDemo) {
      setSubmitting(choice);
      window.setTimeout(() => {
        setStatus(choice);
        setMessage("");
        setRsvpFeedback({ choice, wishIncluded: trimmedMessage.length > 0 });
        setIsEditingRsvp(false);
        setSubmitting(null);
      }, 250);
      return;
    }

    setSubmitting(choice);
    let savedSlug = getActiveSlug(trimmedName);

    try {
      const res = await submitRsvp(
        savedSlug
          ? { slug: savedSlug, status: choice, website: honeypot }
          : { weddingSlug, name: trimmedName, status: choice, website: honeypot }
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
          : "Không thể gửi xác nhận tham dự lúc này. Vui lòng thử lại."
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
        setRsvpSavedBeforeWishFailed(true);
        setWishError(
          err instanceof Error
            ? `Đã ghi nhận xác nhận tham dự, nhưng chưa gửi được lời chúc: ${err.message}`
            : "Đã ghi nhận xác nhận tham dự, nhưng chưa gửi được lời chúc. Vui lòng thử gửi lại."
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

  const handleRetryWish = async () => {
    clearAlerts();
    const trimmedName = name.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedMessage) {
      setWishError("Vui lòng nhập đầy đủ tên và lời chúc trước khi gửi lại.");
      return;
    }
    if (trimmedMessage.length > MAX_WISH_LENGTH) {
      setWishError(`Lời chúc tối đa ${MAX_WISH_LENGTH} ký tự.`);
      return;
    }

    if (isDemo) {
      setSubmitting("wish");
      window.setTimeout(() => {
        setMessage("");
        setPublicWishSent(true);
        setSubmitting(null);
      }, 250);
      return;
    }

    setSubmitting("wish");
    try {
      await submitWish({
        slug: getActiveSlug(trimmedName),
        name: trimmedName,
        message: trimmedMessage,
        website: honeypot,
      });
      setMessage("");
      setRsvpFeedback({
        choice: status === "declined" ? "declined" : "accepted",
        wishIncluded: true,
      });
      setIsEditingRsvp(false);
    } catch (err) {
      setRsvpSavedBeforeWishFailed(true);
      setWishError(
        err instanceof Error
          ? err.message
          : "Không thể gửi lời chúc lúc này. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(null);
    }
  };

  const handlePublicWishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    if (isDemo) {
      setSubmitting("wish");
      window.setTimeout(() => {
        setMessage("");
        setPublicWishSent(true);
        setSubmitting(null);
      }, 250);
      return;
    }

    setSubmitting("wish");
    try {
      await submitWish({
        weddingSlug,
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
          : "Không thể gửi lời chúc lúc này. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(null);
    }
  };

  const handleOpenEdit = () => {
    clearAlerts();
    setRsvpFeedback(null);
    setIsEditingRsvp(true);
  };

  if (isPublicMode) {
    return (
      <RevealSection className="bg-inv-bg px-5 pt-10 pb-6">
        <div className="mx-auto max-w-[440px]">
          <div className="text-center">
            <h2 className="font-inv-script text-[clamp(32px,8.8vw,46px)] leading-[1.2] font-normal text-inv-olive-deep">
              {copy.titlePublic}
            </h2>
            <p className="mx-auto mt-2.5 max-w-[390px] font-inv-serif text-[14px] leading-[1.55] text-inv-olive-btn sm:text-[15px]">
              {copy.subtitlePublic}
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
                  {copy.wishOnlySuccessMessage}
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
                  {copy.sendAnotherWishLabel}
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
                  aria-label={copy.nameLabel}
                  placeholder={copy.namePlaceholder}
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
                  aria-label={copy.messageLabelPublic}
                  placeholder={copy.messagePlaceholder}
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
                  <span>{copy.submitWishLabel}</span>
                </Button>
              </div>
            </form>
          )}
        </div>
      </RevealSection>
    );
  }

  const showSavedSummary =
    !isEditingRsvp && status !== "pending" && !rsvpSavedBeforeWishFailed;

  const activeChoice =
    rsvpFeedback?.choice ?? (status !== "pending" ? status : null);

  return (
    <RevealSection className="bg-inv-bg px-5 pt-10 pb-6">
      <div className="mx-auto max-w-[440px]">
        <div className="text-center">
          <h2 className="font-inv-script text-[clamp(32px,8.8vw,46px)] leading-[1.2] font-normal text-inv-olive-deep">
            {copy.titlePersonal}
          </h2>
          <p className="mx-auto mt-2.5 max-w-[390px] font-inv-serif text-[14px] leading-[1.55] text-inv-olive-btn sm:text-[15px]">
            {copy.subtitlePersonal}
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
                    ? copy.currentAcceptedBadge
                    : copy.currentDeclinedBadge}
                </span>
              </div>
              <p className="mt-2 font-inv-serif text-sm leading-relaxed text-inv-text">
                {activeChoice === "accepted"
                  ? copy.acceptedMessage
                  : copy.declinedMessage}
              </p>
              {rsvpFeedback?.wishIncluded && (
                <p className="mt-2.5 border-t border-inv-olive/20 pt-2.5 font-inv-serif text-xs font-medium text-inv-olive-deep">
                  {copy.wishAlsoSavedNote}
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
                {copy.changeMindLabel}
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-7 space-y-3"
            noValidate
          >
            {/* Trường honeypot ẩn chống spam (không dùng text label tránh dính khi bôi đen copy) */}
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
                <Input
                  aria-label={copy.nameLabel}
                  placeholder={copy.namePlaceholder}
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
              {isNameLocked && (
                <p className="mt-1.5 px-3 font-inv-serif text-xs text-inv-muted">
                  {copy.lockedNameHint}
                </p>
              )}
            </div>

            <div>
              <Textarea
                aria-label={copy.messageLabel}
                placeholder={copy.messagePlaceholder}
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

            {rsvpError && (
              <p
                role="alert"
                className="rounded-2xl border border-inv-olive/35 bg-inv-tint px-4 py-2.5 font-inv-serif text-sm text-inv-ink"
              >
                {rsvpError}
              </p>
            )}

            {wishError && (
              <div
                role="alert"
                className="rounded-2xl border border-inv-olive/35 bg-inv-tint px-4 py-3 font-inv-serif text-sm text-inv-ink"
              >
                <div className="flex items-start gap-2">
                  {rsvpSavedBeforeWishFailed && (
                    <AlertTriangle
                      className="mt-0.5 h-4 w-4 shrink-0 text-inv-olive-deep"
                      aria-hidden="true"
                    />
                  )}
                  <p className="flex-1 leading-relaxed">{wishError}</p>
                </div>
                {rsvpSavedBeforeWishFailed && (
                  <div className="mt-2.5 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      loading={submitting === "wish"}
                      disabled={submitting !== null}
                      className="rounded-full border-inv-olive/45 bg-inv-bg px-4 font-inv-serif text-inv-olive-deep hover:bg-inv-tint"
                      onClick={handleRetryWish}
                    >
                      <Send className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{copy.retryWishLabel}</span>
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3 pt-1">
              {status !== "pending" && !rsvpSavedBeforeWishFailed && (
                <p className="text-center font-inv-serif text-xs text-inv-muted">
                  Trạng thái hiện tại:{" "}
                  <strong className="font-semibold text-inv-ink">
                    {status === "accepted"
                      ? copy.currentAcceptedBadge
                      : copy.currentDeclinedBadge}
                  </strong>
                </p>
              )}

              <div className="flex flex-col gap-2.5 sm:flex-row">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  loading={submitting === "accepted"}
                  disabled={submitting !== null}
                  onClick={() => handleRespond("accepted")}
                  className="h-11 w-full rounded-full bg-inv-olive-btn font-inv-serif text-sm tracking-[0.02em] text-white hover:bg-inv-olive-hover sm:flex-1"
                >
                  {copy.acceptLabel}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  loading={submitting === "declined"}
                  disabled={submitting !== null}
                  onClick={() => handleRespond("declined")}
                  className="h-11 w-full rounded-full border-inv-olive-btn bg-inv-bg font-inv-serif text-sm tracking-[0.02em] text-inv-olive-deep hover:bg-inv-tint sm:flex-1"
                >
                  {copy.declineLabel}
                </Button>
              </div>

              {status !== "pending" && !rsvpSavedBeforeWishFailed && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      clearAlerts();
                      setIsEditingRsvp(false);
                    }}
                    className="cursor-pointer font-inv-serif text-xs font-medium text-inv-olive-deep underline underline-offset-4 hover:opacity-80"
                  >
                    {copy.keepPreviousLabel}
                  </button>
                </div>
              )}
            </div>
          </form>
        )}
      </div>
    </RevealSection>
  );
}

