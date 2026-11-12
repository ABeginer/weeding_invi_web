"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Info,
  Loader2,
  Lock,
  MailOpen,
  Sparkles,
} from "lucide-react";
import { LandingFooter } from "@/components/landing/footer";
import { LandingNavbar } from "@/components/landing/navbar";
import { PhoneFrame } from "@/components/landing/phone-frame";
import { useBrandTheme } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { toDatetimeLocalVn } from "@/components/dashboard/WeddingInfoEditor";
import {
  getPlanLabel,
  getWeddingLimitMessage,
  isTemplateAllowedForPlan,
} from "@/config/plans";
import { SITE_LINKS } from "@/config/site";
import {
  ApiError,
  checkWeddingSlugAvailability,
  createWedding,
  listWeddings,
  syncMe,
} from "@/lib/api";
import {
  emptyGiftInfo,
  NAME_MAX_LENGTH,
  QUOTE_MAX_LENGTH,
  toIsoPlus07,
  type WeddingPlan,
} from "@/lib/types";
import { cn, formatWeddingDateParts } from "@/lib/utils";
import { toTemplateData } from "@/lib/wedding-data";
import {
  clearWeddingDraft,
  readWeddingDraft,
  writeWeddingDraft,
} from "@/lib/wedding-draft";
import {
  FREE_PLAN_MAX_WEDDINGS,
  suggestWeddingSlug,
  validateWeddingSlug,
} from "@/lib/wedding-slug";
import { HERO_PREVIEW_TEMPLATES } from "@/templates/registry";
import { TemplatePreviewRenderer } from "@/templates/TemplatePreviewRenderer";

interface CreateWeddingBuilderProps {
  isAuthenticated: boolean;
  userEmail: string | null;
  initialTemplateId?: string;
}

const DEFAULT_WEDDING_DATE_ISO = "2027-03-20T10:00:00+07:00";

function resolveFreeTemplateId(candidate?: string): string {
  if (candidate) {
    const matched = HERO_PREVIEW_TEMPLATES.find(
      (tpl) => tpl.id === candidate && isTemplateAllowedForPlan("free", tpl.plan),
    );
    if (matched) return matched.id;
  }
  return "basic-1";
}

export function CreateWeddingBuilder({
  isAuthenticated,
  userEmail,
  initialTemplateId,
}: CreateWeddingBuilderProps) {
  const router = useRouter();
  const { setSessionInfo, adoptAccountTheme } = useBrandTheme();

  const [templateId, setTemplateId] = React.useState(() =>
    resolveFreeTemplateId(initialTemplateId),
  );
  const [groomName, setGroomName] = React.useState("");
  const [brideName, setBrideName] = React.useState("");
  const [date, setDate] = React.useState(DEFAULT_WEDDING_DATE_ISO);
  const [quote, setQuote] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false);

  const [slugStatus, setSlugStatus] = React.useState<{
    state: "idle" | "checking" | "available" | "unavailable";
    message?: string;
  }>({ state: "idle" });

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const [reachedFreeLimit, setReachedFreeLimit] = React.useState(false);
  const [userPlan, setUserPlan] = React.useState<WeddingPlan>("free");

  const [previewOpened, setPreviewOpened] = React.useState(false);
  const phoneScrollRef = React.useRef<HTMLDivElement | null>(null);
  const slugCheckSeqRef = React.useRef(0);

  // Đồng bộ phiên đăng nhập & theme tài khoản nếu đã đăng nhập
  React.useEffect(() => {
    setSessionInfo({ isAuthenticated, email: userEmail });
    if (!isAuthenticated) {
      setUserPlan("free");
      setReachedFreeLimit(false);
      return;
    }

    let cancelled = false;

    syncMe()
      .then((profile) => {
        if (cancelled) return;
        setSessionInfo({
          isAuthenticated: true,
          email: profile.email ?? userEmail,
        });
        if (profile.theme) {
          adoptAccountTheme(profile.theme);
        }
      })
      .catch(() => {});

    listWeddings()
      .then((weddings) => {
        if (cancelled) return;
        const hasPaid = weddings.some((w) => w.plan === "pro" || w.plan === "vip");
        if (weddings.some((w) => w.plan === "vip")) setUserPlan("vip");
        else if (weddings.some((w) => w.plan === "pro")) setUserPlan("pro");
        else setUserPlan("free");

        setReachedFreeLimit(!hasPaid && weddings.length >= FREE_PLAN_MAX_WEDDINGS);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [adoptAccountTheme, isAuthenticated, setSessionInfo, userEmail]);

  // Khôi phục bản nháp nếu người dùng quay lại từ bước đăng nhập hoặc vừa soạn dở
  React.useEffect(() => {
    const saved = readWeddingDraft();
    if (!saved) return;

    if (!initialTemplateId) {
      setTemplateId(resolveFreeTemplateId(saved.templateId));
    }
    if (saved.groomName) setGroomName(saved.groomName);
    if (saved.brideName) setBrideName(saved.brideName);
    if (saved.date) setDate(toIsoPlus07(saved.date) || DEFAULT_WEDDING_DATE_ISO);
    if (saved.quote) setQuote(saved.quote);
    if (saved.slug) {
      setSlug(saved.slug);
      setSlugManuallyEdited(true);
    }
  }, [initialTemplateId]);

  // Tự gợi ý đường dẫn từ tên hai bạn khi chưa tự sửa slug
  React.useEffect(() => {
    if (slugManuallyEdited) return;
    if (!groomName.trim() && !brideName.trim()) {
      setSlug("");
      return;
    }
    setSlug(suggestWeddingSlug(groomName, brideName));
  }, [brideName, groomName, slugManuallyEdited]);

  // Kiểm tra khả dụng slug theo thời gian thực (debounce)
  const slugValidation = React.useMemo(() => {
    if (!slug.trim()) return null;
    return validateWeddingSlug(slug.trim());
  }, [slug]);

  React.useEffect(() => {
    const trimmed = slug.trim();
    if (!trimmed) {
      setSlugStatus({ state: "idle" });
      return;
    }

    const check = validateWeddingSlug(trimmed);
    if (!check.valid) {
      setSlugStatus({ state: "idle" });
      return;
    }

    const seq = ++slugCheckSeqRef.current;
    setSlugStatus({ state: "checking" });

    const timer = window.setTimeout(() => {
      checkWeddingSlugAvailability(check.slug)
        .then((res) => {
          if (slugCheckSeqRef.current !== seq) return;
          if (!res.valid) {
            setSlugStatus({
              state: "unavailable",
              message: res.error ?? "Đường dẫn thiệp không hợp lệ.",
            });
            return;
          }
          if (res.available) {
            setSlugStatus({
              state: "available",
              message: "Đường dẫn khả dụng.",
            });
          } else {
            setSlugStatus({
              state: "unavailable",
              message: "Đường dẫn này đã có người dùng, vui lòng chọn tên khác.",
            });
          }
        })
        .catch(() => {
          if (slugCheckSeqRef.current !== seq) return;
          setSlugStatus({ state: "idle" });
        });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [slug]);

  const previewData = React.useMemo(() => {
    return toTemplateData({
      templateId,
      plan: "free",
      weddingSlug: slug.trim() || undefined,
      content: {
        couple: {
          groomName: groomName.trim(),
          brideName: brideName.trim(),
          groomFullName: "",
          brideFullName: "",
          groomParents: "",
          brideParents: "",
        },
        date: toIsoPlus07(date) || DEFAULT_WEDDING_DATE_ISO,
        quote: quote.trim(),
        heroPhotoId: null,
        groomPhotoId: null,
        bridePhotoId: null,
        gift: emptyGiftInfo(),
      },
      events: [],
      photos: [],
    });
  }, [brideName, date, groomName, quote, slug, templateId]);

  const dateValue = toDatetimeLocalVn(date);
  const datePreview = formatWeddingDateParts(date);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setSubmitError(null);

    const nextErrors: Record<string, string> = {};
    const cleanGroom = groomName.trim();
    const cleanBride = brideName.trim();
    const isoDate = toIsoPlus07(date);
    const slugCheck = validateWeddingSlug(slug);

    if (!cleanGroom) {
      nextErrors.groomName = "Vui lòng nhập tên chú rể.";
    }
    if (!cleanBride) {
      nextErrors.brideName = "Vui lòng nhập tên cô dâu.";
    }
    if (!isoDate) {
      nextErrors.date = "Vui lòng chọn ngày giờ cưới hợp lệ.";
    }
    if (!slugCheck.valid) {
      nextErrors.slug = slugCheck.error ?? "Đường dẫn thiệp không hợp lệ.";
    } else if (slugStatus.state === "unavailable") {
      nextErrors.slug =
        slugStatus.message ?? "Đường dẫn này đã có người dùng.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    const cleanQuote = quote.trim();
    const draft = {
      templateId,
      groomName: cleanGroom,
      brideName: cleanBride,
      date: isoDate,
      quote: cleanQuote,
      slug: slugCheck.slug,
    };

    writeWeddingDraft(draft);

    if (!isAuthenticated) {
      window.location.assign("/auth/login?returnTo=/tao-thiep/luu");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createWedding({
        slug: draft.slug,
        templateId: draft.templateId,
        content: {
          couple: {
            groomName: draft.groomName,
            brideName: draft.brideName,
            groomFullName: "",
            brideFullName: "",
            groomParents: "",
            brideParents: "",
          },
          date: draft.date,
          quote: draft.quote,
          heroPhotoId: null,
          groomPhotoId: null,
          bridePhotoId: null,
          gift: emptyGiftInfo(),
        },
      });
      clearWeddingDraft();
      router.push(`${SITE_LINKS.dashboard}/weddings/${created.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.assign("/auth/login?returnTo=/tao-thiep/luu");
        return;
      }
      if (err instanceof ApiError && err.status === 409) {
        setFieldErrors({ slug: err.message });
        setSlugStatus({ state: "unavailable", message: err.message });
        return;
      }
      setSubmitError(
        err instanceof Error ? err.message : "Không thể tạo thiệp cưới lúc này.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="landing-theme min-h-screen-dvh bg-bg text-text">
      <LandingNavbar isAuthenticated={isAuthenticated} userEmail={userEmail} />

      <main className="border-b border-border py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl space-y-2">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.18em] text-accent-text uppercase">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Tạo thử ngay không cần đăng nhập</span>
            </p>
            <h1 className="font-display text-3xl font-semibold text-text sm:text-4xl">
              Thiết kế thiệp cưới của hai bạn
            </h1>
            <p className="text-sm text-text-muted sm:text-base">
              Nhập thông tin cơ bản để xem thiệp chạy trực tiếp trong khung điện thoại, sau đó lưu và nhận đường dẫn mời ngay.
            </p>
          </div>

          {isAuthenticated && reachedFreeLimit && (
            <div
              role="status"
              className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/40 bg-accent-soft px-4 py-3 text-xs text-text sm:text-sm"
            >
              <span>
                {getWeddingLimitMessage(userPlan)} Bạn vẫn có thể xem thử bố cục tại đây hoặc vào Dashboard quản lý thiệp hiện có.
              </span>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={SITE_LINKS.dashboard}
                  className="font-semibold text-text underline"
                >
                  Vào Dashboard
                </Link>
                <Link
                  href={SITE_LINKS.pricingAnchor}
                  className="font-semibold text-text underline"
                >
                  Xem bảng giá
                </Link>
              </div>
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
            {/* Cột trái: Form nhập liệu */}
            <form
              onSubmit={handleSubmit}
              noValidate
              className="space-y-6 lg:col-span-7"
            >
              <Card className="space-y-4 p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-sans text-base font-semibold text-text">
                    1. Chọn mẫu giao diện
                  </h2>
                  <Link
                    href={SITE_LINKS.pricingAnchor}
                    className="text-xs font-medium text-accent-text underline underline-offset-4"
                  >
                    So sánh gói miễn phí &amp; trả phí
                  </Link>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {HERO_PREVIEW_TEMPLATES.map((tpl) => {
                    const isSelected = templateId === tpl.id;
                    const allowed = isTemplateAllowedForPlan("free", tpl.plan);
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        disabled={!allowed}
                        onClick={() => {
                          if (!allowed) return;
                          setTemplateId(tpl.id);
                          setPreviewOpened(false);
                          phoneScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
                        }}
                        className={cn(
                          "flex flex-col justify-between rounded-xl border p-3.5 text-left transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
                          isSelected
                            ? "border-accent bg-accent-soft"
                            : allowed
                              ? "cursor-pointer border-border bg-bg hover:border-accent/60"
                              : "cursor-not-allowed border-border/70 bg-surface-alt/60 opacity-75",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold text-text">
                            {tpl.name}
                          </span>
                          {!allowed ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-text">
                              <Lock className="h-2.5 w-2.5" aria-hidden="true" />
                              <span>Gói {getPlanLabel(tpl.plan)}</span>
                            </span>
                          ) : (
                            <span className="rounded-full border border-sage bg-surface px-2 py-0.5 text-[10px] font-medium text-text">
                              {getPlanLabel(tpl.plan)}
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-xs text-text-muted">
                          {tpl.subtitle}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card className="space-y-4 p-4 sm:p-6">
                <h2 className="font-sans text-base font-semibold text-text">
                  2. Thông tin cô dâu, chú rể &amp; ngày cưới
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Tên chú rể *"
                    value={groomName}
                    onChange={(e) => {
                      setGroomName(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, groomName: "" }));
                    }}
                    maxLength={NAME_MAX_LENGTH}
                    placeholder="Ví dụ: Gia Huy"
                    error={fieldErrors.groomName || undefined}
                  />
                  <Input
                    label="Tên cô dâu *"
                    value={brideName}
                    onChange={(e) => {
                      setBrideName(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, brideName: "" }));
                    }}
                    maxLength={NAME_MAX_LENGTH}
                    placeholder="Ví dụ: Ngọc Hân"
                    error={fieldErrors.brideName || undefined}
                  />
                </div>

                <Input
                  type="datetime-local"
                  label="Ngày giờ cưới dự kiến (múi giờ Việt Nam +07:00) *"
                  value={dateValue}
                  onChange={(e) => {
                    const nextIso = toIsoPlus07(e.target.value);
                    setDate(nextIso || e.target.value);
                    setFieldErrors((prev) => ({ ...prev, date: "" }));
                  }}
                  hint={
                    datePreview.day !== "--"
                      ? `Hiển thị trên thiệp: ${datePreview.time}, ${datePreview.weekday} · ${datePreview.dotDate}`
                      : undefined
                  }
                  error={fieldErrors.date || undefined}
                />

                <div>
                  <Textarea
                    label="Lời dẫn ngắn / câu trích dẫn"
                    rows={3}
                    maxLength={QUOTE_MAX_LENGTH}
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    placeholder="Ví dụ: Hạnh phúc không nằm ở những điều lớn lao, mà ở từng buổi sáng bình yên khi có nhau."
                  />
                  <div className="mt-1 flex justify-end">
                    <span className="text-xs text-text-muted tabular-nums">
                      {quote.length}/{QUOTE_MAX_LENGTH} ký tự
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="space-y-4 p-4 sm:p-6">
                <h2 className="font-sans text-base font-semibold text-text">
                  3. Đường dẫn thiệp cưới
                </h2>

                <div>
                  <Input
                    label="Đường dẫn tuỳ chỉnh (/w/<slug>) *"
                    value={slug}
                    onChange={(e) => {
                      setSlugManuallyEdited(true);
                      setSlug(e.target.value.toLowerCase());
                      setFieldErrors((prev) => ({ ...prev, slug: "" }));
                    }}
                    maxLength={40}
                    placeholder="vi-du: gia-huy-ngoc-han"
                    error={
                      fieldErrors.slug ||
                      (slugValidation && !slugValidation.valid
                        ? slugValidation.error
                        : slugStatus.state === "unavailable"
                          ? slugStatus.message
                          : undefined)
                    }
                    hint={
                      slugValidation?.valid && slugStatus.state !== "unavailable"
                        ? `Link thiệp chung sẽ là: /w/${slugValidation.slug}`
                        : "Chỉ dùng chữ thường a-z, số 0-9 và dấu gạch ngang (-), dài 3–40 ký tự."
                    }
                  />

                  {slugValidation?.valid && slugStatus.state === "checking" && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-text-muted">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      <span>Đang kiểm tra đường dẫn...</span>
                    </p>
                  )}

                  {slugValidation?.valid && slugStatus.state === "available" && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-success-fg">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{slugStatus.message}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-start gap-2.5 rounded-xl border border-border bg-surface-alt/70 px-3.5 py-3 text-xs text-text-muted">
                  <Info
                    className="mt-0.5 h-4 w-4 shrink-0 text-accent-text"
                    aria-hidden="true"
                  />
                  <p>
                    Ảnh cưới và lịch các buổi lễ sẽ được thêm ngay sau khi bạn lưu thiệp trong Dashboard.
                  </p>
                </div>

                {submitError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-danger-border bg-danger-bg px-3.5 py-3 text-xs text-danger-fg sm:text-sm"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs text-text-muted">
                    {isAuthenticated
                      ? "Thiệp được tạo ngay trong tài khoản của bạn."
                      : "Bước tiếp theo sẽ yêu cầu đăng nhập nhanh để lưu thiệp."}
                  </span>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={submitting}
                    disabled={reachedFreeLimit && isAuthenticated}
                  >
                    <span>Lưu và tạo link mời</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </Card>
            </form>

            {/* Cột phải: Khung điện thoại xem trước trực tiếp */}
            <aside className="lg:col-span-5">
              <div className="space-y-3 lg:sticky lg:top-20">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-surface px-4 py-3">
                  <span className="text-xs font-semibold tracking-[0.14em] text-text uppercase">
                    Xem trước trực tiếp
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewOpened((prev) => !prev);
                      phoneScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
                    }}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-bg px-2.5 py-1 text-xs font-medium text-text transition-colors hover:border-accent hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    <MailOpen className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{previewOpened ? "Đóng bì thư" : "Mở xem nội dung"}</span>
                  </button>
                </div>

                <div className="mx-auto w-full max-w-[390px]">
                  <PhoneFrame
                    scrollRef={phoneScrollRef}
                    enableFloat={false}
                    lockedScroll={!previewOpened}
                    className="max-w-[390px]"
                  >
                    <TemplatePreviewRenderer
                      key={templateId}
                      templateId={templateId}
                      data={previewData}
                      mode="preview"
                      contained
                      viewport="phone"
                      isOpened={previewOpened}
                      onOpenedChange={setPreviewOpened}
                      externalMusicControl
                    />
                  </PhoneFrame>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

