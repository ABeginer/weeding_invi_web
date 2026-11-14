"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Info,
  Loader2,
  MailOpen,
  Search,
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

interface CreateWeddingBuilderProps {
  isAuthenticated: boolean;
  userEmail: string | null;
  initialTemplateId?: string;
}

const DEFAULT_WEDDING_DATE_ISO = "2027-03-20T10:00:00+07:00";

const THEME_FILTERS = [
  "Tất cả",
  "Thanh lịch",
  "Cổ điển",
  "Tối giản",
  "Hiện đại",
  "Lãng mạn",
  "Truyền thống",
] as const;

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0"),
);

const MINUTE_OPTIONS = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

function buildPreviewUrl(params: {
  templateId: string;
  groom: string;
  bride: string;
  date: string;
  quote: string;
  opened: boolean;
}): string {
  const search = new URLSearchParams({
    template: params.templateId,
    groom: params.groom,
    bride: params.bride,
    date: params.date,
    quote: params.quote,
    opened: params.opened ? "1" : "0",
  });
  return `/tao-thiep/preview?${search.toString()}`;
}

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
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [templateQuery, setTemplateQuery] = React.useState("");
  const [themeFilter, setThemeFilter] = React.useState<(typeof THEME_FILTERS)[number]>("Tất cả");
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

  const dateValue = toDatetimeLocalVn(date);
  const datePreview = formatWeddingDateParts(date);

  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
  const [iframeSrc] = React.useState(() =>
    buildPreviewUrl({
      templateId,
      groom: groomName.trim(),
      bride: brideName.trim(),
      date: toIsoPlus07(date) || DEFAULT_WEDDING_DATE_ISO,
      quote: quote.trim(),
      opened: previewOpened,
    }),
  );

  const sendPreview = React.useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: "inviwedd:preview",
        payload: {
          templateId,
          groom: groomName.trim(),
          bride: brideName.trim(),
          date: toIsoPlus07(date) || DEFAULT_WEDDING_DATE_ISO,
          quote: quote.trim(),
          opened: previewOpened,
        },
      },
      window.location.origin,
    );
  }, [brideName, date, groomName, previewOpened, quote, templateId]);

  React.useEffect(() => {
    const timer = window.setTimeout(sendPreview, 200);
    return () => window.clearTimeout(timer);
  }, [sendPreview]);

  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string } | null;
      if (data?.type === "inviwedd:preview:ready") sendPreview();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [sendPreview]);

  const selectedTemplate = HERO_PREVIEW_TEMPLATES.find((tpl) => tpl.id === templateId);
  const filteredTemplates = React.useMemo(() => {
    const needle = templateQuery.trim().toLowerCase();
    return HERO_PREVIEW_TEMPLATES.filter((tpl) => {
      const searchable = [tpl.name, tpl.subtitle, ...(tpl.styleTags ?? [])]
        .join(" ")
        .toLowerCase();
      if (needle && !searchable.includes(needle)) return false;
      if (themeFilter === "Tất cả") return true;
      return searchable.includes(themeFilter.toLowerCase());
    });
  }, [templateQuery, themeFilter]);

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

      <main className="border-b border-border py-5 sm:py-7">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="max-w-2xl space-y-1.5">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-accent-text uppercase">
              Tạo thử ngay không cần đăng nhập
            </p>
            <h1 className="font-display text-2xl font-semibold text-text sm:text-3xl">
              Thiết kế thiệp cưới của hai bạn
            </h1>
            <p className="text-xs text-text-muted sm:text-sm">
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

          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
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

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setPickerOpen((prev) => !prev)}
                    aria-expanded={pickerOpen}
                    aria-controls="template-picker-panel"
                    className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-bg px-3.5 py-3 text-left transition-colors hover:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-text">
                        {selectedTemplate?.name ?? "Chọn mẫu thiệp"}
                      </span>
                      <span className="block truncate text-xs text-text-muted">
                        {selectedTemplate?.subtitle ?? "Bấm để chọn mẫu"}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-semibold text-text-muted">
                        {selectedTemplate ? getPlanLabel(selectedTemplate.plan) : ""}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-text-muted transition-transform",
                          pickerOpen && "rotate-180",
                        )}
                        aria-hidden="true"
                      />
                    </span>
                  </button>

                  {pickerOpen && (
                    <div
                      id="template-picker-panel"
                      className="rounded-xl border border-border bg-surface p-2.5 shadow-sm"
                    >
                      <div className="relative">
                        <Search
                          className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-text-muted"
                          aria-hidden="true"
                        />
                        <input
                          value={templateQuery}
                          onChange={(event) => setTemplateQuery(event.target.value)}
                          placeholder="Tìm mẫu thiệp…"
                          aria-label="Tìm mẫu thiệp"
                          className="h-9 w-full rounded-lg border border-border bg-bg pr-3 pl-8 text-xs text-text outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-focus-ring"
                        />
                      </div>

                      <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {THEME_FILTERS.map((theme) => (
                          <button
                            key={theme}
                            type="button"
                            onClick={() => setThemeFilter(theme)}
                            aria-pressed={themeFilter === theme}
                            className={cn(
                              "shrink-0 cursor-pointer rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                              themeFilter === theme
                                ? "border-accent bg-accent-soft text-accent-text"
                                : "border-border bg-bg text-text-muted hover:bg-surface-alt",
                            )}
                          >
                            {theme}
                          </button>
                        ))}
                      </div>

                      <ul className="mt-2 max-h-[276px] divide-y divide-border overflow-y-auto rounded-lg border border-border">
                        {filteredTemplates.map((tpl) => {
                          const allowed = isTemplateAllowedForPlan("free", tpl.plan);
                          const isSelected = templateId === tpl.id;
                          return (
                            <li key={tpl.id}>
                              <button
                                type="button"
                                disabled={!allowed}
                                onClick={() => {
                                  if (!allowed) return;
                                  setTemplateId(tpl.id);
                                  setPreviewOpened(false);
                                  setPickerOpen(false);
                                  phoneScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
                                }}
                                className={cn(
                                  "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-xs transition-colors",
                                  isSelected ? "bg-accent-soft" : "bg-bg hover:bg-surface-alt",
                                  !allowed && "cursor-not-allowed opacity-60",
                                )}
                              >
                                <span className="min-w-0">
                                  <span className="block truncate font-semibold text-text">
                                    {tpl.name}
                                  </span>
                                  <span className="block truncate text-[11px] text-text-muted">
                                    {tpl.subtitle}
                                  </span>
                                </span>
                                <span className="shrink-0 rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium text-text">
                                  {allowed ? getPlanLabel(tpl.plan) : `Gói ${getPlanLabel(tpl.plan)}`}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                        {filteredTemplates.length === 0 && (
                          <li className="px-3 py-6 text-center text-xs text-text-muted">
                            Không tìm thấy mẫu phù hợp.
                          </li>
                        )}
                      </ul>

                      <p className="mt-2 text-[11px] text-text-muted">
                        Hiển thị {Math.min(filteredTemplates.length, 6)} trong {filteredTemplates.length} mẫu · cuộn để xem thêm
                      </p>
                    </div>
                  )}
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    type="date"
                    label="Ngày cưới *"
                    value={dateValue.slice(0, 10)}
                    onChange={(e) => {
                      const nextIso = toIsoPlus07(
                        `${e.target.value}T${dateValue.slice(11, 16) || "10:00"}`,
                      );
                      setDate(nextIso || e.target.value);
                      setFieldErrors((prev) => ({ ...prev, date: "" }));
                    }}
                    hint={
                      datePreview.day !== "--"
                        ? `Hiển thị trên thiệp: ${datePreview.weekday} · ${datePreview.dotDate}`
                        : undefined
                    }
                    error={fieldErrors.date || undefined}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-xs font-medium text-text">
                      Giờ
                      <select
                        value={dateValue.slice(11, 13)}
                        onChange={(e) => {
                          const nextIso = toIsoPlus07(
                            `${dateValue.slice(0, 10)}T${e.target.value}:${dateValue.slice(14, 16)}`,
                          );
                          setDate(nextIso || dateValue);
                          setFieldErrors((prev) => ({ ...prev, date: "" }));
                        }}
                        className="mt-1 h-10 w-full rounded-xl border border-border bg-bg px-2 text-sm text-text outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-focus-ring"
                      >
                        {HOUR_OPTIONS.map((hour) => (
                          <option key={hour} value={hour}>{hour}</option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-xs font-medium text-text">
                      Phút
                      <select
                        value={dateValue.slice(14, 16)}
                        onChange={(e) => {
                          const nextIso = toIsoPlus07(
                            `${dateValue.slice(0, 10)}T${dateValue.slice(11, 13)}:${e.target.value}`,
                          );
                          setDate(nextIso || dateValue);
                          setFieldErrors((prev) => ({ ...prev, date: "" }));
                        }}
                        className="mt-1 h-10 w-full rounded-xl border border-border bg-bg px-2 text-sm text-text outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-focus-ring"
                      >
                        {MINUTE_OPTIONS.map((minute) => (
                          <option key={minute} value={minute}>{minute}</option>
                        ))}
                      </select>
                    </label>
                    <p className="col-span-2 text-[11px] text-text-muted">
                      Định dạng 24 giờ · Giờ : Phút
                    </p>
                  </div>
                </div>

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
                  3. Tên link thiệp cưới
                </h2>

                <div>
                  <Input
                    label="Tên link thiệp dễ nhớ *"
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
                        ? `Mã link thiệp chung của bạn: ${slugValidation.slug}`
                        : "Chỉ dùng chữ thường không dấu a-z, số 0-9 và dấu gạch ngang (-), dài 3–40 ký tự."
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
              <div className="space-y-2.5 lg:sticky lg:top-16">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-surface px-3.5 py-2.5">
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

                <div className="mx-auto w-full">
                  <PhoneFrame
                    scrollRef={phoneScrollRef}
                    enableFloat={false}
                    lockedScroll
                    desktopOffsetPx={164}
                  >
                    <iframe
                      ref={iframeRef}
                      src={iframeSrc}
                      onLoad={sendPreview}
                      title="Xem trước thiệp cưới"
                      className="h-full w-full border-0 bg-bg"
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

