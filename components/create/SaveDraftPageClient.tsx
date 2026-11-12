"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { LandingNavbar } from "@/components/landing/navbar";
import { useBrandTheme } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { getWeddingLimitMessage } from "@/config/plans";
import { SITE_LINKS } from "@/config/site";
import {
  ApiError,
  checkWeddingSlugAvailability,
  createWedding,
  syncMe,
} from "@/lib/api";
import { emptyGiftInfo, toIsoPlus07 } from "@/lib/types";
import {
  clearWeddingDraft,
  readWeddingDraft,
  type WeddingDraft,
  writeWeddingDraft,
} from "@/lib/wedding-draft";
import { validateWeddingSlug } from "@/lib/wedding-slug";

interface SaveDraftPageClientProps {
  userEmail: string | null;
}

export function SaveDraftPageClient({ userEmail }: SaveDraftPageClientProps) {
  const router = useRouter();
  const { setSessionInfo, adoptAccountTheme } = useBrandTheme();

  const [draft, setDraft] = React.useState<WeddingDraft | null>(null);
  const [slugInput, setSlugInput] = React.useState("");
  const [phase, setPhase] = React.useState<
    "saving" | "conflict" | "limit" | "error"
  >("saving");
  const [message, setMessage] = React.useState<string>("");
  const [retrying, setRetrying] = React.useState(false);
  const [slugChecking, setSlugChecking] = React.useState(false);
  const [slugAvailableHint, setSlugAvailableHint] = React.useState<string | null>(
    null,
  );
  const startedRef = React.useRef(false);

  const attemptCreate = React.useCallback(
    async (targetDraft: WeddingDraft) => {
      setMessage("");
      try {
        const created = await createWedding({
          slug: targetDraft.slug,
          templateId: targetDraft.templateId,
          content: {
            couple: {
              groomName: targetDraft.groomName,
              brideName: targetDraft.brideName,
              groomFullName: "",
              brideFullName: "",
              groomParents: "",
              brideParents: "",
            },
            date: toIsoPlus07(targetDraft.date) || "2027-03-20T10:00:00+07:00",
            quote: targetDraft.quote,
            heroPhotoId: null,
            groomPhotoId: null,
            bridePhotoId: null,
            gift: emptyGiftInfo(),
          },
        });
        clearWeddingDraft();
        router.replace(`${SITE_LINKS.dashboard}/weddings/${created.id}`);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          window.location.assign("/auth/login?returnTo=/tao-thiep/luu");
          return;
        }
        if (err instanceof ApiError && err.status === 409) {
          setPhase("conflict");
          setMessage(err.message);
          return;
        }
        if (err instanceof ApiError && err.status === 403) {
          setPhase("limit");
          setMessage(err.message || getWeddingLimitMessage("free"));
          return;
        }
        setPhase("error");
        setMessage(
          err instanceof Error
            ? err.message
            : "Không thể lưu bản nháp thiệp cưới lúc này.",
        );
      }
    },
    [router],
  );

  React.useEffect(() => {
    setSessionInfo({ isAuthenticated: true, email: userEmail });
    syncMe()
      .then((profile) => {
        setSessionInfo({
          isAuthenticated: true,
          email: profile.email ?? userEmail,
        });
        if (profile.theme) {
          adoptAccountTheme(profile.theme);
        }
      })
      .catch(() => {});
  }, [adoptAccountTheme, setSessionInfo, userEmail]);

  React.useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const stored = readWeddingDraft();
    if (!stored) {
      router.replace(SITE_LINKS.dashboard);
      return;
    }

    setDraft(stored);
    setSlugInput(stored.slug);
    void attemptCreate(stored);
  }, [attemptCreate, router]);

  React.useEffect(() => {
    if (phase !== "conflict") return;
    const trimmed = slugInput.trim();
    const check = validateWeddingSlug(trimmed);
    if (!check.valid) {
      setSlugAvailableHint(null);
      return;
    }

    let cancelled = false;
    setSlugChecking(true);
    const timer = window.setTimeout(() => {
      checkWeddingSlugAvailability(check.slug)
        .then((res) => {
          if (cancelled) return;
          if (res.valid && res.available) {
            setSlugAvailableHint("Đường dẫn này khả dụng.");
          } else {
            setSlugAvailableHint(null);
          }
        })
        .catch(() => {
          if (!cancelled) setSlugAvailableHint(null);
        })
        .finally(() => {
          if (!cancelled) setSlugChecking(false);
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [phase, slugInput]);

  const handleRetryWithSlug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;

    const check = validateWeddingSlug(slugInput);
    if (!check.valid) {
      setMessage(check.error ?? "Đường dẫn thiệp không hợp lệ.");
      return;
    }

    const updatedDraft: WeddingDraft = {
      ...draft,
      slug: check.slug,
    };
    setDraft(updatedDraft);
    writeWeddingDraft(updatedDraft);

    setRetrying(true);
    try {
      await attemptCreate(updatedDraft);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="landing-theme min-h-screen-dvh bg-bg text-text">
      <LandingNavbar isAuthenticated userEmail={userEmail} />

      <main className="mx-auto max-w-xl px-4 py-14 sm:px-6">
        {phase === "saving" && (
          <Card className="space-y-4 p-8 text-center">
            <Loader2
              className="mx-auto h-9 w-9 animate-spin text-accent-text"
              aria-hidden="true"
            />
            <h1 className="font-display text-2xl font-semibold text-text">
              Đang lưu thiệp cưới của bạn...
            </h1>
            <p className="text-sm text-text-muted">
              Vui lòng đợi trong giây lát, chúng tôi đang tạo trang thiệp và chuyển bạn vào Dashboard.
            </p>
          </Card>
        )}

        {phase === "conflict" && draft && (
          <Card className="space-y-5 p-6 sm:p-8">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold tracking-[0.16em] text-accent-text uppercase">
                Đổi đường dẫn thiệp
              </p>
              <h1 className="font-display text-2xl font-semibold text-text">
                Đường dẫn /w/{draft.slug} vừa có người dùng
              </h1>
              <p className="text-sm text-text-muted">
                Nội dung thiệp cho{" "}
                <strong className="text-text">
                  {draft.groomName} &amp; {draft.brideName}
                </strong>{" "}
                vẫn được giữ nguyên. Hãy chọn đường dẫn mới để lưu thiệp ngay.
              </p>
            </div>

            <form onSubmit={handleRetryWithSlug} className="space-y-4" noValidate>
              <div>
                <Input
                  label="Đường dẫn mới (/w/<slug>)"
                  value={slugInput}
                  onChange={(e) => {
                    setSlugInput(e.target.value.toLowerCase());
                    setMessage("");
                  }}
                  maxLength={40}
                  autoFocus
                  error={message || undefined}
                />
                {slugChecking && (
                  <p className="mt-1.5 text-xs text-text-muted">
                    Đang kiểm tra...
                  </p>
                )}
                {!slugChecking && slugAvailableHint && !message && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-success-fg">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{slugAvailableHint}</span>
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <Link
                  href={SITE_LINKS.createWedding}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-accent-text"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Quay lại chỉnh sửa</span>
                </Link>
                <Button type="submit" variant="primary" loading={retrying}>
                  Lưu với đường dẫn này
                </Button>
              </div>
            </form>
          </Card>
        )}

        {(phase === "limit" || phase === "error") && (
          <Card className="space-y-4 p-6 text-center sm:p-8">
            <AlertCircle
              className="mx-auto h-9 w-9 text-danger-fg"
              aria-hidden="true"
            />
            <h1 className="font-display text-2xl font-semibold text-text">
              {phase === "limit"
                ? "Tài khoản đã đạt giới hạn thiệp miễn phí"
                : "Chưa thể lưu thiệp cưới"}
            </h1>
            <p className="text-sm text-text-muted">{message}</p>

            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {phase === "error" && draft && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setPhase("saving");
                    void attemptCreate(draft);
                  }}
                >
                  Thử lưu lại
                </Button>
              )}
              <Link
                href={SITE_LINKS.dashboard}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-text px-4 text-sm font-medium text-text hover:bg-surface-alt"
              >
                Vào Dashboard
              </Link>
              {phase === "limit" && (
                <Link
                  href={SITE_LINKS.pricingAnchor}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-fg hover:bg-accent-hover"
                >
                  Xem bảng giá nâng cấp
                </Link>
              )}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}

