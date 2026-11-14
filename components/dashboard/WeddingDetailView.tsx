"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CalendarHeart,
  Check,
  Copy,
  ExternalLink,
  FileEdit,
  Image as ImageIcon,
  MailOpen,
  MessageSquareHeart,
  Smartphone,
  Users,
} from "lucide-react";
import { getPlanLabel } from "@/config/plans";
import { ApiError, buildWeddingLink, getWedding, updateContent } from "@/lib/api";
import type {
  DesignerTemplateAssignmentResult,
  WeddingContent,
  WeddingDetail,
  WeddingEvent,
  WeddingPhoto,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { normalizeWeddingContent, toTemplateData } from "@/lib/wedding-data";
import { weddingContentPatchSchema } from "@/lib/wedding-types";
import { TemplatePreviewRenderer } from "@/templates/TemplatePreviewRenderer";
import { PhoneFrame } from "@/components/landing/phone-frame";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { EventsManager } from "./EventsManager";
import { DesignerTemplateCard } from "./DesignerTemplateCard";
import { GuestTable } from "./GuestTable";
import { PhotosManager } from "./PhotosManager";
import { StatCards } from "./StatCards";
import { WeddingInfoEditor } from "./WeddingInfoEditor";
import { WishList } from "./WishList";

type DetailTab = "info" | "events" | "photos" | "guests" | "wishes" | "stats" | "preview";

interface WeddingDetailViewProps {
  weddingId: string;
}

const SIDEBAR_TABS: {
  id: Exclude<DetailTab, "preview">;
  label: string;
  Icon: typeof Users;
}[] = [
  { id: "info", label: "Thông tin cưới", Icon: FileEdit },
  { id: "events", label: "Lễ & địa điểm", Icon: CalendarHeart },
  { id: "photos", label: "Ảnh cưới", Icon: ImageIcon },
  { id: "guests", label: "Khách mời", Icon: Users },
  { id: "wishes", label: "Lời chúc", Icon: MessageSquareHeart },
  { id: "stats", label: "Thống kê", Icon: BarChart3 },
];

export function WeddingDetailView({ weddingId }: WeddingDetailViewProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [wedding, setWedding] = React.useState<WeddingDetail | null>(null);
  const [events, setEvents] = React.useState<WeddingEvent[]>([]);
  const [photos, setPhotos] = React.useState<WeddingPhoto[]>([]);

  const [draftTemplateId, setDraftTemplateId] = React.useState("basic-1");
  const [draftContent, setDraftContent] = React.useState<WeddingContent | null>(null);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<DetailTab>("info");
  const [copiedPublic, setCopiedPublic] = React.useState(false);

  const [savingInfo, setSavingInfo] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const [pendingTab, setPendingTab] = React.useState<DetailTab | null>(null);
  const [previewOpened, setPreviewOpened] = React.useState(false);
  const [statsRefreshSignal, setStatsRefreshSignal] = React.useState(0);
  const phoneScrollRef = React.useRef<HTMLDivElement | null>(null);

  const loadWedding = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWedding(weddingId);
      const normalized = normalizeWeddingContent(data.content);
      setWedding({ ...data, content: normalized });
      setEvents(data.events ?? []);
      setPhotos(data.photos ?? []);
      setDraftTemplateId(data.templateId);
      setDraftContent(normalized);
      setFieldErrors({});
      setSaveError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.assign("/auth/login");
        return;
      }
      setError(
        err instanceof Error ? err.message : "Không tìm thấy thông tin thiệp cưới.",
      );
    } finally {
      setLoading(false);
    }
  }, [weddingId]);

  React.useEffect(() => {
    loadWedding();
  }, [loadWedding]);

  const isDirty = React.useMemo(() => {
    if (!wedding || !draftContent) return false;
    if (draftTemplateId !== wedding.templateId) return true;
    return JSON.stringify(draftContent) !== JSON.stringify(wedding.content);
  }, [draftContent, draftTemplateId, wedding]);

  React.useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleSaveInfo = React.useCallback(async (): Promise<boolean> => {
    if (!wedding || !draftContent) return false;
    setFieldErrors({});
    setSaveError(null);

    const parsed = weddingContentPatchSchema.safeParse({
      templateId: draftTemplateId,
      content: draftContent,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const cleanPath = issue.path.filter((p) => p !== "content").join(".");
        if (cleanPath && !nextErrors[cleanPath]) {
          nextErrors[cleanPath] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      setSaveError(
        parsed.error.issues[0]?.message ?? "Vui lòng kiểm tra lại thông tin thiệp cưới.",
      );
      return false;
    }

    setSavingInfo(true);
    try {
      const updated = await updateContent(wedding.id, {
        templateId: parsed.data.templateId,
        content: parsed.data.content,
      });
      const normalized = normalizeWeddingContent(updated.content);
      setWedding((prev) =>
        prev
          ? {
              ...prev,
              ...updated,
              content: normalized,
              events,
              photos,
            }
          : null,
      );
      setDraftTemplateId(updated.templateId);
      setDraftContent(normalized);
      showToast("Đã lưu thông tin thiệp cưới", "success");
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.assign("/auth/login");
        return false;
      }
      if (err instanceof ApiError && err.field) {
        const cleanField = err.field.replace(/^content\./, "");
        setFieldErrors({ [cleanField]: err.message });
      }
      setSaveError(
        err instanceof Error ? err.message : "Không thể lưu thông tin thiệp.",
      );
      return false;
    } finally {
      setSavingInfo(false);
    }
  }, [draftContent, draftTemplateId, events, photos, showToast, wedding]);

  const handleResetDraft = () => {
    if (!wedding) return;
    setDraftTemplateId(wedding.templateId);
    setDraftContent(wedding.content);
    setFieldErrors({});
    setSaveError(null);
  };

  const handleDesignerAssignment = React.useCallback(
    (result: DesignerTemplateAssignmentResult) => {
      // Chỉ cập nhật phần gán mẫu; không đụng vào draft nội dung đang sửa.
      setWedding((prev) =>
        prev
          ? {
              ...prev,
              designerTemplateId: result.wedding.designerTemplateId,
              designerTemplateVersion: result.wedding.designerTemplateVersion,
              designerTemplate: result.designerTemplate,
            }
          : prev,
      );
    },
    [],
  );

  const handleSelectTab = (nextTab: DetailTab) => {
    if (nextTab === activeTab) return;
    if (activeTab === "info" && isDirty && nextTab !== "preview") {
      setPendingTab(nextTab);
      return;
    }
    setActiveTab(nextTab);
  };

  const handleEventsChange = (nextEvents: WeddingEvent[]) => {
    setEvents(nextEvents);
    setWedding((prev) => (prev ? { ...prev, events: nextEvents } : null));
    setStatsRefreshSignal((n) => n + 1);
  };

  const handlePhotosStateChange = (
    nextPhotos: WeddingPhoto[],
    serverContent?: WeddingContent,
  ) => {
    setPhotos(nextPhotos);
    if (serverContent) {
      const normalizedServer = normalizeWeddingContent(serverContent);
      setWedding((prev) =>
        prev
          ? {
              ...prev,
              photos: nextPhotos,
              content: {
                ...prev.content,
                heroPhotoId: normalizedServer.heroPhotoId,
                groomPhotoId: normalizedServer.groomPhotoId,
                bridePhotoId: normalizedServer.bridePhotoId,
              },
            }
          : null,
      );
      // Đồng bộ slot ảnh mà không làm mất các thay đổi chữ chưa lưu
      setDraftContent((prev) =>
        prev
          ? {
              ...prev,
              heroPhotoId: normalizedServer.heroPhotoId,
              groomPhotoId: normalizedServer.groomPhotoId,
              bridePhotoId: normalizedServer.bridePhotoId,
            }
          : normalizedServer,
      );
    } else {
      setWedding((prev) => (prev ? { ...prev, photos: nextPhotos } : null));
    }
  };

  const handleCopyPublic = async () => {
    if (!wedding) return;
    const url = buildWeddingLink(wedding.slug);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedPublic(true);
    showToast("Đã sao chép link thiệp chung", "success");
    window.setTimeout(() => setCopiedPublic(false), 1800);
  };

  const previewData = React.useMemo(() => {
    if (!wedding || !draftContent) return null;
    return toTemplateData({
      templateId: draftTemplateId,
      plan: wedding.plan,
      weddingSlug: wedding.slug,
      content: draftContent,
      events,
      photos,
    });
  }, [draftContent, draftTemplateId, events, photos, wedding]);

  const showLivePhoneAside =
    activeTab === "info" || activeTab === "events" || activeTab === "photos";

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-6 lg:grid-cols-12">
          <Skeleton className="h-64 lg:col-span-3" />
          <Skeleton className="h-96 lg:col-span-5" />
          <Skeleton className="h-[520px] lg:col-span-4" />
        </div>
      </div>
    );
  }

  if (error || !wedding || !draftContent || !previewData) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="mx-auto h-9 w-9 text-danger-fg" aria-hidden="true" />
        <h1 className="mt-3 font-display text-2xl font-semibold text-fg">
          {error ?? "Không tìm thấy thiệp cưới."}
        </h1>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-surface px-4 text-sm font-medium text-fg hover:bg-surface-muted"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Quay lại danh sách</span>
          </Link>
          <Button variant="outline" onClick={loadWedding}>
            Thử lại
          </Button>
        </div>
      </Card>
    );
  }

  const renderPhonePreviewCard = () => (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-surface px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-[0.14em] text-fg uppercase">
            Xem trước thiệp
          </span>
          {isDirty && (
            <span className="rounded-full border border-accent/45 bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-text">
              Chưa lưu
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setPreviewOpened((prev) => !prev);
            phoneScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
          }}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-bg px-2.5 py-1 text-xs font-medium text-fg transition-colors hover:border-accent hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          <MailOpen className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{previewOpened ? "Đóng bì thư" : "Mở xem nội dung"}</span>
        </button>
      </div>

      <div className="mx-auto w-full">
        <PhoneFrame
          scrollRef={phoneScrollRef}
          enableFloat={false}
          lockedScroll={!previewOpened}
          desktopOffsetPx={164}
          className="lg:w-full lg:max-w-[356px]"
        >
          <TemplatePreviewRenderer
            key={draftTemplateId}
            templateId={draftTemplateId}
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
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-fg-muted transition-colors hover:text-accent-text sm:text-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Tất cả thiệp cưới</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-2xl font-semibold text-fg sm:text-3xl">
              {draftContent.couple.groomName} &amp; {draftContent.couple.brideName}
            </h1>
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                wedding.plan === "free" && "border-sage bg-surface text-text",
                wedding.plan === "pro" &&
                  "border-accent bg-accent text-accent-fg font-semibold",
                wedding.plan === "vip" &&
                  "border-vip-border bg-vip-bg text-vip-fg font-semibold",
              )}
            >
              Gói {getPlanLabel(wedding.plan)}
            </span>
            {isDirty && (
              <span className="rounded-full border border-accent/50 bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-text">
                Chưa lưu thay đổi
              </span>
            )}
          </div>
          <p className="text-xs text-fg-muted sm:text-sm">
            Mã link thiệp:{" "}
            <span className="rounded-md border border-border bg-surface px-2 py-0.5 font-medium text-accent-text">
              {wedding.slug}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyPublic}>
            {copiedPublic ? (
              <Check className="h-3.5 w-3.5 text-success-fg" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{copiedPublic ? "Đã chép link chung" : "Sao chép link chung"}</span>
          </Button>
          <a
            href={`/w/${wedding.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-fg transition-colors hover:border-accent/60 hover:bg-surface-muted hover:text-accent-text"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Mở trang thiệp</span>
          </a>
        </div>
      </div>

      {/* Thanh tab ngang trên màn hình nhỏ / tablet */}
      <nav
        aria-label="Mục quản lý thiệp (di động)"
        className="-mx-4 overflow-x-auto border-b border-border px-4 lg:hidden"
      >
        <div className="flex min-w-max gap-1">
          {[...SIDEBAR_TABS, { id: "preview" as const, label: "Xem trước", Icon: Smartphone }].map(
            ({ id, label, Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelectTab(id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-2 border-b-2 px-3.5 py-3 text-xs font-medium whitespace-nowrap transition-colors sm:text-sm",
                    active
                      ? "border-accent text-accent-text"
                      : "border-transparent text-fg-muted hover:border-border hover:text-fg",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{label}</span>
                  {id === "info" && isDirty && (
                    <span
                      className="h-2 w-2 rounded-full bg-accent"
                      aria-label="Có thay đổi chưa lưu"
                    />
                  )}
                </button>
              );
            },
          )}
        </div>
      </nav>

      {/* Bố cục desktop: Menu trái | Nội dung chính | Xem trước cố định phải (khi chỉnh nội dung) */}
      <div
        className={cn(
          "grid grid-cols-1 gap-6 lg:items-start",
          showLivePhoneAside
            ? "lg:grid-cols-[204px_minmax(0,1fr)_316px] xl:grid-cols-[216px_minmax(0,1fr)_356px]"
            : "lg:grid-cols-[204px_minmax(0,1fr)] xl:grid-cols-[216px_minmax(0,1fr)]",
        )}
      >
        <aside className="hidden lg:block">
          <nav
            aria-label="Mục quản lý thiệp"
            className="sticky top-16 space-y-1.5 rounded-2xl border border-border bg-surface p-2"
          >
            {SIDEBAR_TABS.map(({ id, label, Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelectTab(id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-accent-fg font-semibold"
                      : "text-fg-muted hover:bg-surface-muted hover:text-fg",
                  )}
                >
                  <span className="flex items-center gap-2.5 whitespace-nowrap">
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{label}</span>
                  </span>
                  {id === "info" && isDirty && (
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        active ? "bg-accent-fg" : "bg-accent",
                      )}
                      aria-label="Chưa lưu"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0">
          {activeTab === "info" && (
            <div className="space-y-6">
              <WeddingInfoEditor
                wedding={wedding}
                draftContent={draftContent}
                draftTemplateId={draftTemplateId}
                photos={photos}
                isDirty={isDirty}
                saving={savingInfo}
                saveError={saveError}
                fieldErrors={fieldErrors}
                onDraftChange={setDraftContent}
                onTemplateChange={(tplId) => {
                  setDraftTemplateId(tplId);
                  setPreviewOpened(false);
                }}
                onPhotosStateChange={handlePhotosStateChange}
                onSave={handleSaveInfo}
                onResetDraft={handleResetDraft}
                onDeleted={() => router.replace("/dashboard")}
              />
              <DesignerTemplateCard
                wedding={wedding}
                current={wedding.designerTemplate ?? null}
                onChanged={handleDesignerAssignment}
              />
            </div>
          )}

          {activeTab === "events" && (
            <EventsManager
              weddingId={wedding.id}
              plan={wedding.plan}
              events={events}
              defaultDateIso={draftContent.date}
              onEventsChange={handleEventsChange}
            />
          )}

          {activeTab === "photos" && (
            <PhotosManager
              weddingId={wedding.id}
              weddingSlug={wedding.slug}
              plan={wedding.plan}
              content={draftContent}
              photos={photos}
              onPhotosStateChange={handlePhotosStateChange}
            />
          )}

          {activeTab === "guests" && (
            <GuestTable
              weddingId={wedding.id}
              plan={wedding.plan}
              events={events}
              onGuestsChanged={() => setStatsRefreshSignal((n) => n + 1)}
            />
          )}

          {activeTab === "wishes" && <WishList weddingId={wedding.id} />}

          {activeTab === "stats" && (
            <StatCards weddingId={wedding.id} refreshSignal={statsRefreshSignal} />
          )}

          {activeTab === "preview" && (
            <div className="lg:hidden">{renderPhonePreviewCard()}</div>
          )}
        </section>

        <aside className={cn("hidden", showLivePhoneAside && "lg:block")}>
          <div className="sticky top-16">{renderPhonePreviewCard()}</div>
        </aside>
      </div>

      {/* Hộp thoại xác nhận khi có thay đổi chưa lưu ở tab Thông tin cưới */}
      <Dialog
        open={Boolean(pendingTab)}
        onClose={() => !savingInfo && setPendingTab(null)}
        title="Bạn có thay đổi chưa lưu"
        description="Thông tin cưới bạn vừa chỉnh sửa chưa được lưu lên máy chủ. Bạn muốn lưu trước khi chuyển mục không?"
      >
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            disabled={savingInfo}
            onClick={() => setPendingTab(null)}
          >
            Ở lại
          </Button>
          <Button
            variant="outline"
            disabled={savingInfo}
            onClick={() => {
              const dest = pendingTab;
              handleResetDraft();
              setPendingTab(null);
              if (dest) setActiveTab(dest);
            }}
          >
            Bỏ thay đổi
          </Button>
          <Button
            variant="primary"
            loading={savingInfo}
            onClick={async () => {
              const dest = pendingTab;
              const ok = await handleSaveInfo();
              if (ok) {
                setPendingTab(null);
                if (dest) setActiveTab(dest);
              } else {
                setPendingTab(null);
              }
            }}
          >
            Lưu &amp; chuyển
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
