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
  CreditCard,
  FileText,
  Image as ImageIcon,
  Loader2,
  Lock,
  MapPin,
  Music,
  Palette,
  Pause,
  Play,
  Trash2,
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
  createEvent,
  createWedding,
  listWeddings,
  syncMe,
} from "@/lib/api";
import {
  compressImageToWebP,
  formatFileSize,
  validateImageFile,
} from "@/lib/image-compress";
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
  initialDate?: string;
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

const MUSIC_TRACKS = [
  {
    id: "priority1",
    name: "Giai điệu tình yêu",
    genre: "Wedding Romance · Sang trọng",
    src: "/media/priority1.mp3",
  },
  {
    id: "prio2",
    name: "Khúc ca ngọt ngào",
    genre: "Acoustic Pop · Lãng mạn",
    src: "/media/prio2.mp3",
  },
  {
    id: "classic",
    name: "Giai điệu cổ điển",
    genre: "Classical · Trang nghiêm",
    src: "/media/co-dien.mp3",
  },
  {
    id: "garden",
    name: "Sân vườn tự nhiên",
    genre: "Acoustic Guitar · Mộc mạc",
    src: "/media/san-vuon.mp3",
  },
  {
    id: "cheerful",
    name: "Ngày mới bình yên",
    genre: "Pop Acoustic · We'll Be Okay",
    src: "/media/well-be-okay.mp3",
  },
  {
    id: "moonlight",
    name: "Dạ khúc ánh trăng",
    genre: "Piano Romance · Sâu lắng",
    src: "/media/moonlight.mp3",
  },
  {
    id: "default",
    name: "Giai điệu ngày cưới",
    genre: "Acoustic Romantic",
    src: "/media/audio-1.mp3",
  },
  {
    id: "calm",
    name: "Bình yên bên nhau",
    genre: "Piano Wedding",
    src: "/media/audio-2.mp3",
  },
  {
    id: "beginning",
    name: "Khởi đầu dịu dàng",
    genre: "Classical Strings",
    src: "/media/audio-3.mp3",
  },
  {
    id: "sweet",
    name: "Ngày chung đôi",
    genre: "Sweet Romance",
    src: "/media/audio-4.mp3",
  },
] as const;

function resolveFreeTemplateId(candidate?: string): string {
  if (candidate) {
    const matched = HERO_PREVIEW_TEMPLATES.find(
      (tpl) => tpl.id === candidate && isTemplateAllowedForPlan("free", tpl.plan),
    );
    if (matched) return matched.id;
  }
  return "nau-toi-gian";
}

export function CreateWeddingBuilder({
  isAuthenticated,
  userEmail,
  initialTemplateId,
  initialDesignerTemplateId,
  initialDate,
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

  // Tab 1: Info inputs
  const [groomName, setGroomName] = React.useState("");
  const [brideName, setBrideName] = React.useState("");
  const [groomParents, setGroomParents] = React.useState("");
  const [brideParents, setBrideParents] = React.useState("");
  const [quote, setQuote] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false);

  // Parse initialDate param if provided (YYYY-MM-DD)
  const parsedInitialDateIso = React.useMemo(() => {
    if (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)) {
      return toIsoPlus07(`${initialDate}T10:00:00+07:00`) || null;
    }
    return null;
  }, [initialDate]);

  // Tab 2: Event inputs
  const [date, setDate] = React.useState(
    () => parsedInitialDateIso || DEFAULT_WEDDING_DATE_ISO,
  );
  const [eventLocation, setEventLocation] = React.useState("");
  const [eventAddress, setEventAddress] = React.useState("");
  const [mapUrl, setMapUrl] = React.useState("");

  // Tab 3: Photos & WebP compression state
  const [coverPhotoUrl, setCoverPhotoUrl] = React.useState<string | null>(null);
  const [albumPhotos, setAlbumPhotos] = React.useState<string[]>([]);
  const [compressing, setCompressing] = React.useState(false);
  const [compressionToast, setCompressionToast] = React.useState<string | null>(null);

  // Tab 4: Style & Music & QR gift info
  const [selectedMusic, setSelectedMusic] = React.useState("priority1");
  const [playingTrackId, setPlayingTrackId] = React.useState<string | null>(null);
  const audioPreviewRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    return () => {
      audioPreviewRef.current?.pause();
    };
  }, []);

  const toggleAudioPreview = React.useCallback(
    (track: (typeof MUSIC_TRACKS)[number], e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (playingTrackId === track.id) {
        audioPreviewRef.current?.pause();
        setPlayingTrackId(null);
      } else {
        if (audioPreviewRef.current) {
          audioPreviewRef.current.pause();
        }
        const audio = new Audio(track.src);
        audio.onended = () => setPlayingTrackId(null);
        audio.onerror = () => setPlayingTrackId(null);
        audio.play().catch(() => setPlayingTrackId(null));
        audioPreviewRef.current = audio;
        setPlayingTrackId(track.id);
      }
    },
    [playingTrackId],
  );

  const [bank, setBank] = React.useState("");
  const [accountNumber, setAccountNumber] = React.useState("");
  const [accountName, setAccountName] = React.useState("");

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
  const [showPreviewNudge, setShowPreviewNudge] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("inviwedd_seen_mobile_preview_hint") === "1") return;
    if (!groomName.trim() && !brideName.trim()) return;

    const timer = window.setTimeout(() => {
      if (localStorage.getItem("inviwedd_seen_mobile_preview_hint") !== "1") {
        setShowPreviewNudge(true);
      }
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [groomName, brideName]);

  const handleMobilePreviewClick = () => {
    setMobileTab("preview");
    if (showPreviewNudge) {
      setShowPreviewNudge(false);
      try {
        localStorage.setItem("inviwedd_seen_mobile_preview_hint", "1");
      } catch {}
    }
  };

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
    const saved = readWeddingDraft(initialTemplateId);
    if (!saved) return;

    if (!initialTemplateId) {
      setTemplateId(resolveFreeTemplateId(saved.templateId));
    }
    if (saved.groomName) setGroomName(saved.groomName);
    if (saved.brideName) setBrideName(saved.brideName);
    if (saved.date) {
      setDate(toIsoPlus07(saved.date) || parsedInitialDateIso || DEFAULT_WEDDING_DATE_ISO);
    } else if (parsedInitialDateIso) {
      setDate(parsedInitialDateIso);
    }
    if (saved.quote) setQuote(saved.quote);
    if (saved.slug) {
      setSlug(saved.slug);
      setSlugManuallyEdited(true);
    }
    if (saved.groomParents) setGroomParents(saved.groomParents);
    if (saved.brideParents) setBrideParents(saved.brideParents);
    if (saved.eventLocation) setEventLocation(saved.eventLocation);
    if (saved.eventAddress) setEventAddress(saved.eventAddress);
    if (saved.mapUrl) setMapUrl(saved.mapUrl);
    if (saved.musicTrack) setSelectedMusic(saved.musicTrack);
    if (saved.bank) setBank(saved.bank);
    if (saved.accountNumber) setAccountNumber(saved.accountNumber);
    if (saved.accountName) setAccountName(saved.accountName);
  }, [initialTemplateId, parsedInitialDateIso]);

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
          groomParents: groomParents.trim(),
          brideParents: brideParents.trim(),
          eventLocation: eventLocation.trim(),
          eventAddress: eventAddress.trim(),
          mapUrl: mapUrl.trim(),
          musicTrack: selectedMusic,
          bank: bank.trim(),
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim(),
        };
        writeWeddingDraft(draft);
      }
      setAutoSaveStatus("saved");
    }, 800);

    return () => window.clearTimeout(timer);
  }, [
    accountName,
    accountNumber,
    bank,
    brideName,
    brideParents,
    date,
    designerTemplateId,
    eventAddress,
    eventLocation,
    groomName,
    groomParents,
    mapUrl,
    quote,
    selectedMusic,
    slug,
    templateId,
  ]);

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
              message: "Đường dẫn này đã được sử dụng.",
            });
          }
        })
        .catch(() => {
          if (slugCheckSeqRef.current !== seq) return;
          setSlugStatus({ state: "idle" });
        });
    }, 400);

    return () => window.clearTimeout(timer);
  }, [slug]);

  // Iframe URL: Chỉ thay đổi khi chọn mẫu thiệp mới (templateId hoặc designerTemplateId).
  // Toàn bộ nội dung chữ (tên, ngày, lời tựa) được đồng bộ thời gian thực qua postMessage, KHÔNG reload iframe.
  const previewKey = designerTemplateId ?? templateId;
  const [iframeSrc, setIframeSrc] = React.useState(() =>
    designerTemplateId
      ? `/ops/designer/${designerTemplateId}/preview`
      : `/tao-thiep/preview?template=${encodeURIComponent(templateId)}`,
  );

  React.useEffect(() => {
    setIframeSrc(
      designerTemplateId
        ? `/ops/designer/${designerTemplateId}/preview`
        : `/tao-thiep/preview?template=${encodeURIComponent(templateId)}`,
    );
  }, [previewKey, designerTemplateId, templateId]);

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
          audioMuted,
          groomParents: groomParents.trim(),
          brideParents: brideParents.trim(),
          eventLocation: eventLocation.trim(),
          eventAddress: eventAddress.trim(),
          mapUrl: mapUrl.trim(),
          bank: bank.trim(),
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim(),
          musicTrack: selectedMusic,
        },
      },
      window.location.origin,
    );
  }, [
    accountName,
    accountNumber,
    audioMuted,
    bank,
    brideName,
    brideParents,
    date,
    eventAddress,
    eventLocation,
    groomName,
    groomParents,
    mapUrl,
    previewOpened,
    quote,
    selectedMusic,
    selectedRole.name,
    templateId,
  ]);

  React.useEffect(() => {
    const timer = window.setTimeout(sendPreview, 120);
    return () => window.clearTimeout(timer);
  }, [sendPreview]);

  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string } | null;
      if (
        data?.type === "inviwedd:preview:ready" ||
        data?.type === "PREVIEW_READY"
      ) {
        sendPreview();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [sendPreview]);

  // Cover photo upload handler with WebP compression
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCompressing(true);
      const validationError = validateImageFile(file);
      if (validationError) {
        setSubmitError(validationError);
        return;
      }
      const result = await compressImageToWebP(file);
      const url = URL.createObjectURL(result.file);
      setCoverPhotoUrl(url);
      setCompressionToast(result.savedText);
      setTimeout(() => setCompressionToast(null), 4000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Không thể nén ảnh.");
    } finally {
      setCompressing(false);
    }
  };

  // Album photos upload handler with WebP compression
  const handleAlbumUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setCompressing(true);
      const newUrls: string[] = [];
      let totalSaved = 0;
      let totalOriginal = 0;

      for (let i = 0; i < Math.min(files.length, 6); i++) {
        const file = files[i];
        const validationError = validateImageFile(file);
        if (validationError) continue;
        const res = await compressImageToWebP(file);
        newUrls.push(URL.createObjectURL(res.file));
        totalOriginal += res.originalSize;
        totalSaved += res.compressedSize;
      }

      if (newUrls.length > 0) {
        setAlbumPhotos((prev) => [...prev, ...newUrls].slice(0, 10));
        setCompressionToast(
          `${newUrls.length} ảnh đã sẵn sàng hiển thị sắc nét`,
        );
        setTimeout(() => setCompressionToast(null), 4000);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Lỗi khi xử lý album ảnh.");
    } finally {
      setCompressing(false);
    }
  };

  const handleResetDefaults = () => {
    if (!confirm("Bạn có chắc muốn đặt lại toàn bộ thông tin về mặc định?")) return;
    setGroomName("");
    setBrideName("");
    setDate(DEFAULT_WEDDING_DATE_ISO);
    setQuote("");
    setSlug("");
    setSlugManuallyEdited(false);
    setCoverPhotoUrl(null);
    setAlbumPhotos([]);
    setGroomParents("");
    setBrideParents("");
    setEventLocation("");
    setEventAddress("");
    setMapUrl("");
    setSelectedMusic("default");
    setBank("");
    setAccountNumber("");
    setAccountName("");
    setFieldErrors({});
    setSubmitError(null);
    clearWeddingDraft(templateId);
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
      groomParents: groomParents.trim(),
      brideParents: brideParents.trim(),
      eventLocation: eventLocation.trim(),
      eventAddress: eventAddress.trim(),
      mapUrl: mapUrl.trim(),
      musicTrack: selectedMusic,
      bank: bank.trim(),
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim(),
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
            groomParents: draft.groomParents,
            brideParents: draft.brideParents,
          },
          date: draft.date,
          quote: draft.quote,
          musicPreset:
            draft.musicTrack && draft.musicTrack !== "custom"
              ? (draft.musicTrack as
                  | "default"
                  | "priority1"
                  | "prio2"
                  | "classic"
                  | "garden"
                  | "cheerful"
                  | "moonlight"
                  | "calm"
                  | "beginning"
                  | "sweet")
              : "priority1",
          heroPhotoId: null,
          groomPhotoId: null,
          bridePhotoId: null,
          gift: {
            ...emptyGiftInfo(),
            groomBankName: draft.bank,
            groomAccountNumber: draft.accountNumber,
            groomAccountName: draft.accountName,
          },
        },
      });

      if (draft.eventLocation) {
        try {
          await createEvent(created.id, {
            title: "Lễ Thành Hôn & Tiệc Cưới",
            startsAt: draft.date,
            venueName: draft.eventLocation,
            venueAddress: draft.eventAddress || undefined,
            mapDirectionsUrl: draft.mapUrl || undefined,
          });
        } catch {
          // Event creation optional on first step
        }
      }

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

      clearWeddingDraft(templateId);
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

  const dateValue = toDatetimeLocalVn(date);
  const datePreview = formatWeddingDateParts(date);

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
                <span className="truncate">Thông tin</span>
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
                <span className="truncate">Sự kiện</span>
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
                <span className="truncate">Hình ảnh</span>
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
                <span className="truncate">Giao diện</span>
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

              {/* Tab 1: Info (Tên & Gia đình & Lời mời & Đường dẫn) */}
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

                  {/* Gia đình hai bên */}
                  <div className="rounded-2xl border border-[#E8E2D9] bg-white p-4 space-y-4">
                    <p className="text-xs font-semibold text-[#1F1D1A]">
                      Thông tin phụ mẫu hai bên (Tùy chọn)
                    </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-[#6B655E]">
                          Nhà trai (Phụ mẫu chú rể)
                        </label>
                        <input
                          type="text"
                          value={groomParents}
                          onChange={(e) => setGroomParents(e.target.value)}
                          placeholder="Ông Nguyễn Văn A & Bà Trần Thị B"
                          className="mt-1.5 h-10 w-full rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] px-3.5 text-xs text-[#1F1D1A] outline-none focus:bg-white focus:border-[#7A1C24] focus:ring-1 focus:ring-[#7A1C24]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#6B655E]">
                          Nhà gái (Phụ mẫu cô dâu)
                        </label>
                        <input
                          type="text"
                          value={brideParents}
                          onChange={(e) => setBrideParents(e.target.value)}
                          placeholder="Ông Lê Văn C & Bà Phạm Thị D"
                          className="mt-1.5 h-10 w-full rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] px-3.5 text-xs text-[#1F1D1A] outline-none focus:bg-white focus:border-[#7A1C24] focus:ring-1 focus:ring-[#7A1C24]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Slug input */}
                  <div>
                    <label className="block text-xs font-medium text-[#1F1D1A]">
                      Đường dẫn thiệp cưới <span className="text-rose-600">*</span>
                    </label>
                    <div className="mt-1.5 flex rounded-xl border border-[#E8E2D9] bg-white px-3 text-sm focus-within:border-[#7A1C24] focus-within:ring-1 focus-within:ring-[#7A1C24]">
                      <span className="flex select-none items-center text-xs text-[#6B655E]">
                        inviwedd.date/w/
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

              {/* Tab 2: Event (Ngày giờ & Địa điểm tiệc) */}
              {activeTab === "event" && (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-serif text-xl font-normal text-[#1F1D1A]">
                      Thời gian &amp; Địa điểm
                    </h3>
                    <p className="mt-0.5 text-xs text-[#6B655E]">
                      Thông tin sự kiện tổ chức lễ cưới chính thức.
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

                  {/* Tên địa điểm */}
                  <div>
                    <label className="block text-xs font-medium text-[#1F1D1A]">
                      Tên địa điểm / Nhà hàng
                    </label>
                    <input
                      type="text"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      placeholder="Trung tâm Hội nghị Tiệc cưới The Grand Palace"
                      className="mt-1.5 h-10 w-full rounded-xl border border-[#E8E2D9] bg-white px-3.5 text-sm text-[#1F1D1A] outline-none focus:border-[#7A1C24] focus:ring-1 focus:ring-[#7A1C24]"
                    />
                  </div>

                  {/* Địa chỉ chi tiết */}
                  <div>
                    <label className="block text-xs font-medium text-[#1F1D1A]">
                      Địa chỉ chi tiết
                    </label>
                    <input
                      type="text"
                      value={eventAddress}
                      onChange={(e) => setEventAddress(e.target.value)}
                      placeholder="142/18 Cộng Hòa, Phường 4, Quận Tân Bình, TP. HCM"
                      className="mt-1.5 h-10 w-full rounded-xl border border-[#E8E2D9] bg-white px-3.5 text-sm text-[#1F1D1A] outline-none focus:border-[#7A1C24] focus:ring-1 focus:ring-[#7A1C24]"
                    />
                  </div>

                  {/* Link Google Maps */}
                  <div>
                    <label className="block text-xs font-medium text-[#1F1D1A]">
                      Đường dẫn Google Maps (Chỉ đường)
                    </label>
                    <div className="mt-1.5 flex rounded-xl border border-[#E8E2D9] bg-white px-3 text-sm focus-within:border-[#7A1C24] focus-within:ring-1 focus-within:ring-[#7A1C24]">
                      <MapPin className="my-auto h-4 w-4 text-[#B89B72]" />
                      <input
                        type="url"
                        value={mapUrl}
                        onChange={(e) => setMapUrl(e.target.value)}
                        placeholder="https://maps.app.goo.gl/..."
                        className="h-10 flex-1 bg-transparent px-2 text-sm text-[#1F1D1A] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Photos (Tải ảnh + Nén WebP tự động) */}
              {activeTab === "photos" && (
                <div className="space-y-6">
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
                            className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-[#151412]"
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
                            {compressing ? "Đang chuẩn bị ảnh sắc nét..." : "Tải ảnh từ thiết bị"}
                          </p>
                          <p className="mt-1 text-[11px] text-[#6B655E]">
                            Hỗ trợ JPG, PNG, WebP hoặc HEIC (Tối đa 25MB)
                          </p>
                        </div>
                      )}

                      <label className="mt-4 inline-flex h-9 cursor-pointer items-center justify-center rounded-full bg-[#1F1D1A] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#151412]">
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

                  {/* Album ảnh cưới */}
                  <div>
                    <label className="block text-xs font-medium text-[#1F1D1A]">
                      Album ảnh kỷ niệm ({albumPhotos.length}/10)
                    </label>
                    <p className="mt-0.5 text-[11px] text-[#6B655E]">
                      Chọn nhiều ảnh cùng lúc, hệ thống sẽ tự động nén tối ưu.
                    </p>

                    <div className="mt-2 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                      {albumPhotos.map((url, index) => (
                        <div
                          key={index}
                          className="group relative aspect-square overflow-hidden rounded-xl border border-[#E8E2D9] bg-[#F4EFEA]"
                        >
                          <img
                            src={url}
                            alt={`Album ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setAlbumPhotos((prev) => prev.filter((_, i) => i !== index))
                            }
                            className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}

                      {albumPhotos.length < 10 && (
                        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E8E2D9] bg-white text-[#6B655E] transition-colors hover:border-[#B89B72] hover:text-[#7A1C24]">
                          <Upload className="h-5 w-5" />
                          <span className="mt-1 text-[10px] font-medium">+ Thêm ảnh</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleAlbumUpload}
                            disabled={compressing}
                            className="sr-only"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Style & Music & QR gift info */}
              {activeTab === "style" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-serif text-xl font-normal text-[#1F1D1A]">
                      Giao diện &amp; Âm nhạc
                    </h3>
                    <p className="mt-0.5 text-xs text-[#6B655E]">
                      Tùy biến mẫu thiệp, bài hát và tài khoản nhận mừng cưới.
                    </p>
                  </div>

                  {/* Section 4.1: Template Picker */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#1F1D1A]">
                        Chọn mẫu thiệp cưới
                      </label>
                      <span className="text-[11px] text-[#6B655E]">
                        {filteredTemplates.length} mẫu
                      </span>
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
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 max-h-[340px] overflow-y-auto p-1 border border-[#E8E2D9] rounded-2xl bg-[#FAF8F5]">
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
                                className="h-full w-full object-cover transition-transform duration-500 ease-luxury group-hover:scale-105"
                              />
                              {isSelected && (
                                <div className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#7A1C24] text-white">
                                  <Check className="h-3 w-3" />
                                </div>
                              )}
                            </div>
                            <p className="mt-1.5 truncate font-sans text-sm font-semibold text-[#1F1D1A]">
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

                  {/* Section 4.2: Wedding Music */}
                  <div className="space-y-3 rounded-2xl border border-[#E8E2D9] bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Music className="h-4 w-4 text-[#7A1C24]" />
                        <label className="text-xs font-semibold text-[#1F1D1A]">
                          Nhạc nền tiệc cưới (10 bản miễn phí)
                        </label>
                      </div>
                      <span className="text-[11px] text-[#6B655E]">
                        {MUSIC_TRACKS.find((t) => t.id === selectedMusic)?.name ??
                          "Giai điệu ngày cưới"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {MUSIC_TRACKS.map((track) => (
                        <div
                          key={track.id}
                          onClick={() => setSelectedMusic(track.id)}
                          className={cn(
                            "flex cursor-pointer items-center justify-between rounded-xl border p-3 text-xs transition-colors",
                            selectedMusic === track.id
                              ? "border-[#7A1C24] bg-[#FAF8F5] text-[#7A1C24] font-medium"
                              : "border-[#E8E2D9] hover:bg-[#FAF8F5] text-[#1F1D1A]",
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="musicTrack"
                              value={track.id}
                              checked={selectedMusic === track.id}
                              onChange={() => setSelectedMusic(track.id)}
                              className="text-[#7A1C24] focus:ring-[#7A1C24]"
                            />
                            <div>
                              <p className="font-medium text-[#1F1D1A]">{track.name}</p>
                              <p className="text-[10px] text-[#6B655E]">{track.genre}</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => toggleAudioPreview(track, e)}
                            className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors",
                              playingTrackId === track.id
                                ? "border-[#7A1C24] bg-[#7A1C24] text-white shadow-xs"
                                : "border-[#E8E2D9] bg-white text-[#B89B72] hover:border-[#7A1C24] hover:text-[#7A1C24]",
                            )}
                            title={
                              playingTrackId === track.id
                                ? "Tạm dừng nghe thử"
                                : `Nghe thử: ${track.name}`
                            }
                            aria-label={
                              playingTrackId === track.id
                                ? "Tạm dừng nghe thử"
                                : `Nghe thử: ${track.name}`
                            }
                          >
                            {playingTrackId === track.id ? (
                              <Pause className="h-3.5 w-3.5" />
                            ) : (
                              <Play className="h-3.5 w-3.5 translate-x-0.5" />
                            )}
                          </button>
                        </div>
                      ))}

                      {/* Locked Pro/VIP custom music upload */}
                      <div className="mt-2 flex items-center justify-between rounded-xl border border-dashed border-[#E8E2D9] bg-[#FAF8F5]/80 p-3 text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E8E2D9]/60 text-[#8C827A]">
                            <Lock className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-[#1F1D1A]">
                                Chọn file nhạc riêng (.mp3)
                              </p>
                              <span className="rounded bg-[#B89B72]/15 px-1.5 py-0.5 text-[9px] font-semibold text-[#8C704B]">
                                Gói Standard &amp; Pro
                              </span>
                            </div>
                            <p className="text-[10px] text-[#6B655E]">
                              Tải lên bài hát kỷ niệm riêng của hai bạn trong Dashboard quản lý thiệp
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 4.3: Gift QR / Bank Info */}
                  <div className="space-y-3 rounded-2xl border border-[#E8E2D9] bg-white p-4">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-[#7A1C24]" />
                      <label className="text-xs font-semibold text-[#1F1D1A]">
                        Mừng cưới &amp; VietQR (Tùy chọn)
                      </label>
                    </div>
                    <p className="text-[11px] text-[#6B655E]">
                      Hỗ trợ khách quét mã VietQR tự động hoặc sao chép nhanh số tài khoản.
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-[#6B655E]">
                          Ngân hàng
                        </label>
                        <input
                          type="text"
                          value={bank}
                          onChange={(e) => setBank(e.target.value)}
                          placeholder="Vd: Vietcombank, MB Bank, Techcombank..."
                          className="mt-1 h-9 w-full rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] px-3 text-xs text-[#1F1D1A] outline-none focus:bg-white focus:border-[#7A1C24]"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-medium text-[#6B655E]">
                            Số tài khoản
                          </label>
                          <input
                            type="text"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            placeholder="Vd: 1029384756"
                            className="mt-1 h-9 w-full rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] px-3 text-xs text-[#1F1D1A] outline-none focus:bg-white focus:border-[#7A1C24]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#6B655E]">
                            Chủ tài khoản
                          </label>
                          <input
                            type="text"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            placeholder="Vd: NGUYEN MINH KHOI"
                            className="mt-1 h-9 w-full rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] px-3 text-xs text-[#1F1D1A] outline-none focus:bg-white focus:border-[#7A1C24]"
                          />
                        </div>
                      </div>
                    </div>
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
              onLoad={() => {
                sendPreview();
              }}
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
        <div className="relative flex rounded-full border border-[#E8E2D9] bg-[#FAF8F5] p-1">
          {/* First-Time "Xem trước" Floating Nudge */}
          {showPreviewNudge && (
            <div
              onClick={handleMobilePreviewClick}
              className="absolute -top-11 left-1/2 z-50 flex -translate-x-1/2 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full bg-[#1F1D1A] px-3.5 py-1.5 text-xs text-[#FAF8F5] shadow-lg backdrop-blur-xs"
            >
              <span>Xem tên hai bạn trên thiệp ngay</span>
              <span className="text-[#B89B72]" aria-hidden="true">→</span>
              <span
                aria-hidden="true"
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0 w-0 border-x-4 border-x-transparent border-t-4 border-t-[#1F1D1A]"
              />
            </div>
          )}

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
            onClick={handleMobilePreviewClick}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
              mobileTab === "preview"
                ? "bg-[#1F1D1A] text-white shadow-xs"
                : "text-[#6B655E]",
              showPreviewNudge && "animate-luxury-shimmer text-[#7A1C24] font-bold ring-1 ring-[#B89B72]",
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
