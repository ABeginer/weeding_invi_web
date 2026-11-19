"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  Palette,
  RotateCcw,
  Search,
  Sparkles,
  Upload,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useBrandTheme } from "@/components/theme/ThemeProvider";
import { toDatetimeLocalVn } from "@/components/dashboard/WeddingInfoEditor";
import {
  getPlanLabel,
  getWeddingLimitMessage,
  isTemplateAllowedForPlan,
} from "@/config/plans";
import { SITE_LINKS } from "@/config/site";
import {
  ApiError,
  assignDesignerTemplate,
  checkWeddingSlugAvailability,
  createWedding,
  listWeddings,
  syncMe,
} from "@/lib/api";
import { compressImageToWebP, type CompressResult } from "@/lib/image-compress";
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
  initialDesignerTemplateId?: string;
}

const DEFAULT_WEDDING_DATE_ISO = "2027-03-20T10:00:00+07:00";

type EditorTab = "info" | "event" | "photos" | "style";

const THEME_FILTERS = [
  "Tất cả",
  "Tối giản",
  "Truyền thống",
  "Hiện đại",
  "Cổ điển",
] as const;

const ROLE_PREVIEWS = [
  { id: "default", label: "Khách mặc định", name: "" },
  { id: "elder", label: "Chú Bảy (Họ hàng)", name: "Chú Bảy cùng Gia đình" },
  { id: "friend", label: "Bạn thân", name: "Bạn Tuấn Anh" },
] as const;

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
  initialDesignerTemplateId,
}: CreateWeddingBuilderProps) {
  const router = useRouter();
  const { setSessionInfo, adoptAccountTheme } = useBrandTheme();

  // Tab states
  const [activeTab, setActiveTab] = React.useState<EditorTab>("info");
  const [mobileTab, setMobileTab] = React.useState<"edit" | "preview">("edit");

  // Template state
  const [templateId, setTemplateId] = React.useState(() =>
    resolveFreeTemplateId(initialTemplateId),
  );
  const [designerTemplateId, setDesignerTemplateId] = React.useState<string | undefined>(
    initialDesignerTemplateId,
  );
  const [designerName, setDesignerName] = React.useState<string | null>(null);
  const [designerPlan, setDesignerPlan] = React.useState<"free" | "pro" | "vip" | null>(null);

  // Form inputs
  const [groomName, setGroomName] = React.useState("");
  const [brideName, setBrideName] = React.useState("");
  const [date, setDate] = React.useState(DEFAULT_WEDDING_DATE_ISO);
  const [quote, setQuote] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false);

  // Image upload & compression state
  const [coverPhotoUrl, setCoverPhotoUrl] = React.useState<string | null>(null);
  const [compressing, setCompressing] = React.useState(false);
  const [compressionToast, setCompressionToast] = React.useState<string | null>(null);

  // Role preview & audio
  const [selectedRole, setSelectedRole] = React.useState<(typeof ROLE_PREVIEWS)[number]>(
    ROLE_PREVIEWS[0],
  );
  const [audioMuted, setAudioMuted] = React.useState(false);

  // Draft auto-save status
  const [autoSaveStatus, setAutoSaveStatus] = React.useState<"saved" | "saving">("saved");

  // Slug check
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
  const [templateQuery, setTemplateQuery] = React.useState("");
  const [themeFilter, setThemeFilter] = React.useState<(typeof THEME_FILTERS)[number]>("Tất cả");

  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
  const slugCheckSeqRef = React.useRef(0);

  // Synchronize session info
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

  // Restore draft smoothly in useEffect
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

  // Auto-save debounce (800ms) to localStorage
  React.useEffect(() => {
    setAutoSaveStatus("saving");
    const timer = window.setTimeout(() => {
      const cleanGroom = groomName.trim();
      const cleanBride = brideName.trim();
      const isoDate = toIsoPlus07(date) || DEFAULT_WEDDING_DATE_ISO;

      if (cleanGroom || cleanBride || quote.trim()) {
        const draft = {
          templateId,
          designerTemplateId,
          groomName: cleanGroom,
          brideName: cleanBride,
          date: isoDate,
          quote: quote.trim(),
          slug: slug.trim(),
        };
        writeWeddingDraft(draft);
        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(
              `inviwedd_draft_${templateId}`,
              JSON.stringify(draft),
            );
          } catch {}
        }
      }
      setAutoSaveStatus("saved");
    }, 800);

    return () => window.clearTimeout(timer);
  }, [brideName, date, designerTemplateId, groomName, quote, slug, templateId]);

  // Suggest slug from couple names if not manually edited
  React.useEffect(() => {
    if (slugManuallyEdited) return;
    if (!groomName.trim() && !brideName.trim()) {
      setSlug("");
      return;
    }
    setSlug(suggestWeddingSlug(groomName, brideName));
  }, [brideName, groomName, slugManuallyEdited]);

  // Check slug availability debounce
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

  // Fetch designer template info if set
  React.useEffect(() => {
    if (!designerTemplateId) return;
    let cancelled = false;
    fetch("/api/public/designer-templates")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items?: Array<{ id: string; name: string; displayTitle: string | null; plan: "free" | "pro" | "vip" }> }) => {
        if (cancelled) return;
        const match = (data.items ?? []).find((item) => item.id === designerTemplateId);
        if (match) {
          setDesignerName(match.displayTitle ?? match.name);
          setDesignerPlan(match.plan);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [designerTemplateId]);

  const dateValue = toDatetimeLocalVn(date);
  const datePreview = formatWeddingDateParts(date);

  const [iframeSrc, setIframeSrc] = React.useState(() =>
    designerTemplateId
      ? `/mau/designer/${designerTemplateId}/embed`
      : buildPreviewUrl({
          templateId,
          groom: groomName.trim(),
          bride: brideName.trim(),
          date: toIsoPlus07(date) || DEFAULT_WEDDING_DATE_ISO,
          quote: quote.trim(),
          opened: previewOpened,
        }),
  );
  const previewKey = designerTemplateId ?? templateId;

  React.useEffect(() => {
    setIframeSrc(
      designerTemplateId
        ? `/mau/designer/${designerTemplateId}/embed`
        : buildPreviewUrl({
            templateId,
            groom: groomName.trim(),
            bride: brideName.trim(),
            date: toIsoPlus07(date) || DEFAULT_WEDDING_DATE_ISO,
            quote: quote.trim(),
            opened: previewOpened,
          }),
    );
  }, [previewKey]);

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
          guestName: selectedRole.name,
        },
      },
      window.location.origin,
    );
  }, [brideName, date, groomName, previewOpened, quote, selectedRole.name, templateId]);

  React.useEffect(() => {
    const timer = window.setTimeout(sendPreview, 150);
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

  // Image compression upload handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCompressing(true);
      const res: CompressResult = await compressImageToWebP(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.82,
      });

      const objectUrl = URL.createObjectURL(res.file);
      setCoverPhotoUrl(objectUrl);
      setCompressionToast(res.savedText);

      window.setTimeout(() => {
        setCompressionToast(null);
      }, 4500);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể xử lý hình ảnh.");
    } finally {
      setCompressing(false);
      e.target.value = "";
    }
  };

  const handleResetDefaults = () => {
    if (!confirm("Bạn có chắc muốn đặt lại toàn bộ thông tin về mặc định?")) return;
    clearWeddingDraft();
    setGroomName("");
    setBrideName("");
    setDate(DEFAULT_WEDDING_DATE_ISO);
    setQuote("");
    setSlug("");
    setCoverPhotoUrl(null);
    setSlugManuallyEdited(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setSubmitError(null);

    const nextErrors: Record<string, string> = {};
    const cleanGroom = groomName.trim();
    const cleanBride = brideName.trim();
    const isoDate = toIsoPlus07(date);
    const slugCheck = validateWeddingSlug(slug);

    if (!cleanGroom) nextErrors.groomName = "Vui lòng nhập tên chú rể.";
    if (!cleanBride) nextErrors.brideName = "Vui lòng nhập tên cô dâu.";
    if (!isoDate) nextErrors.date = "Vui lòng chọn ngày giờ cưới hợp lệ.";
    if (!slugCheck.valid) {
      nextErrors.slug = slugCheck.error ?? "Đường dẫn thiệp không hợp lệ.";
    } else if (slugStatus.state === "unavailable") {
      nextErrors.slug = slugStatus.message ?? "Đường dẫn này đã có người dùng.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setActiveTab("info");
      return;
    }

    const cleanQuote = quote.trim();
    const draft = {
      templateId,
      designerTemplateId,
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

      if (designerTemplateId) {
        try {
          await assignDesignerTemplate(created.id, { designerTemplateId });
        } catch (assignError) {
          setSubmitError(
            assignError instanceof Error
              ? `Đã tạo thiệp nhưng chưa gán được mẫu: ${assignError.message}`
              : "Đã tạo thiệp nhưng chưa gán được mẫu.",
          );
        }
      }

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
        setActiveTab("info");
        return;
      }
      setSubmitError(
        err instanceof Error ? err.message : "Có lỗi xảy ra, vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTemplate = HERO_PREVIEW_TEMPLATES.find((tpl) => tpl.id === templateId);
  const displayName = designerTemplateId
    ? designerName ?? "Mẫu Designer"
    : selectedTemplate?.name ?? "Chọn mẫu thiệp";

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

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#FAF8F5] text-[#1F1D1A]">
      {/* A. Top Editor Bar (Sticky h-14) */}
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-[#E8E2D9] bg-[#FAF8F5]/95 px-4 backdrop-blur-md sm:px-6">
        {/* Left: Back & Template Pill */}
        <div className="flex items-center gap-3">
          <Link
            href="/thiep-cuoi"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B655E] transition-colors hover:text-[#1F1D1A]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Mẫu thiệp</span>
          </Link>

          <span className="text-[#E8E2D9]" aria-hidden="true">|</span>

          <button
            type="button"
            onClick={() => setActiveTab("style")}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E2D9] bg-white px-3 py-1 text-xs font-semibold text-[#1F1D1A] shadow-2xs transition-colors hover:border-[#B89B72] hover:bg-[#F4EFEA]"
          >
            <Palette className="h-3.5 w-3.5 text-[#7A1C24]" />
            <span className="max-w-[130px] truncate sm:max-w-xs">{displayName}</span>
            <ChevronDown className="h-3 w-3 text-[#6B655E]" />
          </button>
        </div>

        {/* Center: Auto-save status (Desktop) */}
        <div className="hidden items-center gap-3 text-xs md:flex">
          <div className="flex items-center gap-1.5 text-[#6B655E]">
            {autoSaveStatus === "saving" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#B89B72]" />
                <span>Đang lưu nháp...</span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>Đã lưu nháp tự động</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="cursor-pointer text-[11px] text-[#6B655E] underline-offset-2 hover:underline"
          >
            Đặt lại mẫu gốc
          </button>
        </div>

        {/* Right: Publish CTA */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#7A1C24] px-5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#5E141B] disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <span>Lưu &amp; Xuất bản</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Split-Screen Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* B. Left Pane — Editor Form (5 cols on desktop, responsive) */}
        <div
          className={cn(
            "h-full w-full flex-col border-r border-[#E8E2D9] bg-[#FAF8F5] lg:flex lg:w-5/12 xl:w-5/12",
            mobileTab === "edit" ? "flex" : "hidden lg:flex",
          )}
        >
          {/* Section Tabs inside Left Pane */}
          <div className="sticky top-0 z-20 flex shrink-0 border-b border-[#E8E2D9] bg-white px-4 py-2 sm:px-6">
            <div className="grid w-full grid-cols-4 gap-1 rounded-xl bg-[#FAF8F5] p-1 border border-[#E8E2D9]">
              <button
                type="button"
                onClick={() => setActiveTab("info")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all",
                  activeTab === "info"
                    ? "bg-white text-[#7A1C24] shadow-xs font-semibold"
                    : "text-[#6B655E] hover:text-[#1F1D1A]",
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Thông tin</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("event")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all",
                  activeTab === "event"
                    ? "bg-white text-[#7A1C24] shadow-xs font-semibold"
                    : "text-[#6B655E] hover:text-[#1F1D1A]",
                )}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Sự kiện</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("photos")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all",
                  activeTab === "photos"
                    ? "bg-white text-[#7A1C24] shadow-xs font-semibold"
                    : "text-[#6B655E] hover:text-[#1F1D1A]",
                )}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>Hình ảnh</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("style")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all",
                  activeTab === "style"
                    ? "bg-white text-[#7A1C24] shadow-xs font-semibold"
                    : "text-[#6B655E] hover:text-[#1F1D1A]",
                )}
              >
                <Palette className="h-3.5 w-3.5" />
                <span>Mẫu thiệp</span>
              </button>
            </div>
          </div>

          {/* Form Scroll Viewport */}
          <div className="flex-1 overflow-y-auto px-4 py-6 pb-28 sm:px-6 lg:pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {submitError && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Tab 1: Info (Tên & Đường dẫn) */}
              {activeTab === "info" && (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-serif text-xl font-normal text-[#1F1D1A]">
                      Thông tin cô dâu &amp; chú rể
                    </h3>
                    <p className="mt-0.5 text-xs text-[#6B655E]">
                      Tên sẽ hiển thị trang trọng trên bìa và thiệp mời.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-[#1F1D1A]">
                        Tên Chú rể <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={groomName}
                        onChange={(e) => setGroomName(e.target.value)}
                        placeholder="Vd: Minh Khôi"
                        maxLength={NAME_MAX_LENGTH}
                        className={cn(
                          "mt-1.5 h-10 w-full rounded-xl border border-[#E8E2D9] bg-white px-3.5 text-sm text-[#1F1D1A] outline-none transition-colors focus:border-[#7A1C24] focus:ring-1 focus:ring-[#7A1C24]",
                          fieldErrors.groomName && "border-rose-400 bg-rose-50/50",
                        )}
                      />
                      {fieldErrors.groomName && (
                        <p className="mt-1 text-xs text-rose-600">{fieldErrors.groomName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#1F1D1A]">
                        Tên Cô dâu <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={brideName}
                        onChange={(e) => setBrideName(e.target.value)}
                        placeholder="Vd: Thảo Nguyên"
                        maxLength={NAME_MAX_LENGTH}
                        className={cn(
                          "mt-1.5 h-10 w-full rounded-xl border border-[#E8E2D9] bg-white px-3.5 text-sm text-[#1F1D1A] outline-none transition-colors focus:border-[#7A1C24] focus:ring-1 focus:ring-[#7A1C24]",
                          fieldErrors.brideName && "border-rose-400 bg-rose-50/50",
                        )}
                      />
                      {fieldErrors.brideName && (
                        <p className="mt-1 text-xs text-rose-600">{fieldErrors.brideName}</p>
                      )}
                    </div>
                  </div>

                  {/* Slug input */}
                  <div>
                    <label className="block text-xs font-medium text-[#1F1D1A]">
                      Đường dẫn thiệp cưới <span className="text-rose-600">*</span>
                    </label>
                    <div className="mt-1.5 flex rounded-xl border border-[#E8E2D9] bg-white px-3 text-sm focus-within:border-[#7A1C24] focus-within:ring-1 focus-within:ring-[#7A1C24]">
                      <span className="flex select-none items-center text-xs text-[#6B655E]">
                        inviwedd.com/w/
                      </span>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => {
                          setSlug(e.target.value);
                          setSlugManuallyEdited(true);
                        }}
                        placeholder="minhkhoi-thaonguyen"
                        className="h-10 flex-1 bg-transparent px-1 text-sm text-[#1F1D1A] outline-none"
                      />
                    </div>
                    {slugStatus.state === "checking" && (
                      <p className="mt-1 text-xs text-[#B89B72]">Đang kiểm tra đường dẫn...</p>
                    )}
                    {slugStatus.state === "available" && (
                      <p className="mt-1 text-xs text-emerald-600">✓ {slugStatus.message}</p>
                    )}
                    {slugStatus.state === "unavailable" && (
                      <p className="mt-1 text-xs text-rose-600">✕ {slugStatus.message}</p>
                    )}
                    {fieldErrors.slug && (
                      <p className="mt-1 text-xs text-rose-600">{fieldErrors.slug}</p>
                    )}
                  </div>

                  {/* Quote */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium text-[#1F1D1A]">
                      <label>Lời tựa / Lời chúc mừng</label>
                      <span className="text-[11px] text-[#6B655E]">
                        {quote.length}/{QUOTE_MAX_LENGTH}
                      </span>
                    </div>
                    <textarea
                      value={quote}
                      onChange={(e) => setQuote(e.target.value)}
                      maxLength={QUOTE_MAX_LENGTH}
                      rows={3}
                      placeholder="Một lời nhắn ấm áp gửi tới quan khách…"
                      className="mt-1.5 w-full rounded-xl border border-[#E8E2D9] bg-white p-3 text-sm text-[#1F1D1A] outline-none transition-colors focus:border-[#7A1C24] focus:ring-1 focus:ring-[#7A1C24]"
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Event (Ngày giờ) */}
              {activeTab === "event" && (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-serif text-xl font-normal text-[#1F1D1A]">
                      Thời gian &amp; Sự kiện
                    </h3>
                    <p className="mt-0.5 text-xs text-[#6B655E]">
                      Thời gian diễn ra lễ cưới chính thức.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#1F1D1A]">
                      Ngày &amp; giờ tổ chức tiệc <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={dateValue}
                      onChange={(e) => {
                        const iso = toIsoPlus07(e.target.value);
                        if (iso) setDate(iso);
                      }}
                      className="mt-1.5 h-10 w-full rounded-xl border border-[#E8E2D9] bg-white px-3.5 text-sm text-[#1F1D1A] outline-none focus:border-[#7A1C24] focus:ring-1 focus:ring-[#7A1C24]"
                    />
                    {fieldErrors.date && (
                      <p className="mt-1 text-xs text-rose-600">{fieldErrors.date}</p>
                    )}

                    <div className="mt-3 rounded-xl border border-[#E8E2D9] bg-white p-3.5">
                      <p className="text-[11px] font-semibold tracking-wider text-[#B89B72] uppercase">
                        Hiển thị trên thiệp
                      </p>
                      <p className="mt-1 font-serif text-lg text-[#1F1D1A]">
                        {datePreview.time} · {datePreview.weekday}, {datePreview.day}/{datePreview.month}/{datePreview.year}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Photos (Tải ảnh + Nén WebP) */}
              {activeTab === "photos" && (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-serif text-xl font-normal text-[#1F1D1A]">
                      Hình ảnh cưới
                    </h3>
                    <p className="mt-0.5 text-xs text-[#6B655E]">
                      Tự động tối ưu định dạng WebP siêu nhẹ giúp thiệp mở tức thì trên điện thoại.
                    </p>
                  </div>

                  {/* Compression Status Toast Banner */}
                  {compressionToast && (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800 animate-in fade-in">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{compressionToast}</span>
                    </div>
                  )}

                  {/* Cover Photo Upload Box */}
                  <div>
                    <label className="block text-xs font-medium text-[#1F1D1A]">
                      Ảnh bìa chính (Cover Photo)
                    </label>
                    <div className="mt-2 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E8E2D9] bg-white p-6 text-center transition-colors hover:border-[#B89B72]">
                      {coverPhotoUrl ? (
                        <div className="relative aspect-[3/4] w-48 overflow-hidden rounded-xl border border-[#E8E2D9] shadow-sm">
                          <img
                            src={coverPhotoUrl}
                            alt="Cover preview"
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setCoverPhotoUrl(null)}
                            className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FAF8F5] text-[#7A1C24]">
                            {compressing ? (
                              <Loader2 className="h-6 w-6 animate-spin text-[#B89B72]" />
                            ) : (
                              <Upload className="h-6 w-6" />
                            )}
                          </div>
                          <p className="mt-3 text-xs font-semibold text-[#1F1D1A]">
                            {compressing ? "Đang tối ưu & nén ảnh WebP..." : "Tải ảnh từ thiết bị"}
                          </p>
                          <p className="mt-1 text-[11px] text-[#6B655E]">
                            Hỗ trợ JPG, PNG, WebP hoặc HEIC (Tối đa 25MB)
                          </p>
                        </div>
                      )}

                      <label className="mt-4 inline-flex h-9 cursor-pointer items-center justify-center rounded-full bg-[#1F1D1A] px-5 text-xs font-semibold text-white transition-colors hover:bg-black">
                        <span>{coverPhotoUrl ? "Đổi ảnh khác" : "Chọn ảnh"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          disabled={compressing}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Style (Đổi mẫu thiệp) */}
              {activeTab === "style" && (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-serif text-xl font-normal text-[#1F1D1A]">
                      Chọn mẫu thiệp cưới
                    </h3>
                    <p className="mt-0.5 text-xs text-[#6B655E]">
                      Chuyển đổi giao diện ngay lập tức mà không làm mất thông tin đã điền.
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {THEME_FILTERS.map((theme) => (
                      <button
                        key={theme}
                        type="button"
                        onClick={() => setThemeFilter(theme)}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs transition-colors",
                          themeFilter === theme
                            ? "bg-[#7A1C24] text-white"
                            : "border border-[#E8E2D9] bg-white text-[#6B655E] hover:border-[#B89B72]",
                        )}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>

                  {/* Template Picker Grid */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {filteredTemplates.map((tpl) => {
                      const isSelected = templateId === tpl.id && !designerTemplateId;
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => {
                            setTemplateId(tpl.id);
                            setDesignerTemplateId(undefined);
                          }}
                          className={cn(
                            "group flex flex-col overflow-hidden rounded-xl border p-2 text-left transition-all",
                            isSelected
                              ? "border-[#7A1C24] bg-white ring-2 ring-[#7A1C24]/30 shadow-xs"
                              : "border-[#E8E2D9] bg-white hover:border-[#B89B72]",
                          )}
                        >
                          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-[#F4EFEA]">
                            <img
                              src={tpl.coverImage}
                              alt={tpl.name}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#7A1C24] text-white">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                          <p className="mt-1.5 truncate font-serif text-sm font-medium text-[#1F1D1A]">
                            {tpl.name}
                          </p>
                          <p className="truncate text-[10px] text-[#6B655E]">
                            {tpl.subtitle}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* C. Right Pane — Live Interactive Preview (7 cols on desktop, responsive) */}
        <div
          className={cn(
            "h-full w-full flex-col items-center justify-center bg-[#F4EFEA] p-4 lg:flex lg:w-7/12 xl:w-7/12 sm:p-6",
            mobileTab === "preview" ? "flex" : "hidden lg:flex",
          )}
        >
          {/* Top Preview Controls Toolbar */}
          <div className="mb-4 flex w-full max-w-[360px] items-center justify-between gap-2 rounded-2xl border border-[#E8E2D9] bg-white/90 px-3 py-2 shadow-2xs backdrop-blur-md">
            {/* Guest Role Preview Selector */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-medium text-[#6B655E]">Vai vế:</span>
              <div className="flex gap-1">
                {ROLE_PREVIEWS.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={cn(
                      "rounded-lg px-2 py-1 text-[11px] transition-colors",
                      selectedRole.id === role.id
                        ? "bg-[#1F1D1A] text-white font-medium"
                        : "text-[#6B655E] hover:bg-[#FAF8F5]",
                    )}
                  >
                    {role.id === "default" ? "Mặc định" : role.id === "elder" ? "Chú Bảy" : "Bạn thân"}
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Toggle Button */}
            <button
              type="button"
              onClick={() => setAudioMuted((prev) => !prev)}
              title={audioMuted ? "Bật âm thanh" : "Tắt âm thanh"}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E8E2D9] text-[#1F1D1A] transition-colors hover:bg-[#FAF8F5]"
            >
              {audioMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 text-[#7A1C24]" />}
            </button>
          </div>

          {/* Realistic Mobile Phone Frame */}
          <div className="relative flex aspect-[9/19.5] w-full max-w-[340px] flex-col overflow-hidden rounded-[2.8rem] border-[9px] border-[#1F1D1A] bg-white shadow-2xl sm:max-w-[360px] max-h-[80dvh]">
            {/* Dynamic Island / Notch */}
            <div
              aria-hidden="true"
              className="absolute top-0 left-1/2 z-30 h-4 w-24 -translate-x-1/2 rounded-b-xl bg-[#1F1D1A]"
            />

            {/* Live Iframe Viewport */}
            <iframe
              ref={iframeRef}
              src={iframeSrc}
              title="Xem trước thiệp cưới trực tiếp"
              className="h-full w-full border-0"
            />
          </div>

          <p className="mt-3 text-center text-[11px] text-[#6B655E]">
            Mọi thông tin chỉnh sửa ở khung bên trái được cập nhật theo thời gian thực.
          </p>
        </div>
      </div>

      {/* D. Sticky Bottom Bar on Mobile (< lg) */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between border-t border-[#E8E2D9] bg-white/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
        {/* Segmented Toggle: Chỉnh sửa | Xem trước */}
        <div className="flex rounded-full border border-[#E8E2D9] bg-[#FAF8F5] p-1">
          <button
            type="button"
            onClick={() => setMobileTab("edit")}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
              mobileTab === "edit"
                ? "bg-[#1F1D1A] text-white shadow-xs"
                : "text-[#6B655E]",
            )}
          >
            Chỉnh sửa
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
              mobileTab === "preview"
                ? "bg-[#1F1D1A] text-white shadow-xs"
                : "text-[#6B655E]",
            )}
          >
            Xem trước
          </button>
        </div>

        {/* Compact Publish Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#7A1C24] px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#5E141B] disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <span>Xuất bản</span>
              <ArrowRight className="h-3 w-3" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
