"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  CalendarHeart,
  ExternalLink,
  GripVertical,
  HelpCircle,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  getEventLimitMessage,
  getPlanLabel,
  getPlanLimits,
} from "@/config/plans";
import {
  ApiError,
  createEvent,
  deleteEvent,
  reorderEvents,
  updateEvent,
} from "@/lib/api";
import {
  EVENT_ADDRESS_MAX_LENGTH,
  EVENT_LUNAR_MAX_LENGTH,
  EVENT_TITLE_MAX_LENGTH,
  EVENT_URL_MAX_LENGTH,
  EVENT_VENUE_MAX_LENGTH,
  extractMapEmbedSrc,
  toIsoPlus07,
  weddingEventInputSchema,
  type WeddingEvent,
  type WeddingPlan,
} from "@/lib/types";
import { cn, formatWeddingDateParts } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { toDatetimeLocalVn } from "./WeddingInfoEditor";

interface EventsManagerProps {
  weddingId: string;
  plan: WeddingPlan;
  events: WeddingEvent[];
  defaultDateIso: string;
  onEventsChange: (events: WeddingEvent[]) => void;
}

interface EventFormState {
  title: string;
  startsAtLocal: string;
  lunarDate: string;
  venueName: string;
  venueAddress: string;
  mapEmbedUrl: string;
  mapDirectionsUrl: string;
}

function createEmptyEventForm(defaultDateIso: string): EventFormState {
  return {
    title: "",
    startsAtLocal: toDatetimeLocalVn(defaultDateIso) || "2027-01-01T10:00",
    lunarDate: "",
    venueName: "",
    venueAddress: "",
    mapEmbedUrl: "",
    mapDirectionsUrl: "",
  };
}

function toEventFormState(event: WeddingEvent): EventFormState {
  return {
    title: event.title,
    startsAtLocal: toDatetimeLocalVn(event.startsAt),
    lunarDate: event.lunarDate,
    venueName: event.venueName,
    venueAddress: event.venueAddress,
    mapEmbedUrl: event.mapEmbedUrl ?? "",
    mapDirectionsUrl: event.mapDirectionsUrl ?? "",
  };
}

export function EventsManager({
  weddingId,
  plan,
  events,
  defaultDateIso,
  onEventsChange,
}: EventsManagerProps) {
  const { showToast } = useToast();
  const limits = getPlanLimits(plan);
  const reachedLimit = events.length >= limits.events;

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<WeddingEvent | null>(null);
  const [form, setForm] = React.useState<EventFormState>(() =>
    createEmptyEventForm(defaultDateIso),
  );
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const [mapGuideOpen, setMapGuideOpen] = React.useState(false);
  const [deletingEvent, setDeletingEvent] = React.useState<WeddingEvent | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const [reordering, setReordering] = React.useState(false);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);

  const openCreateModal = () => {
    setEditingEvent(null);
    setForm(createEmptyEventForm(defaultDateIso));
    setFieldErrors({});
    setFormError(null);
    setFormOpen(true);
  };

  const openEditModal = (evt: WeddingEvent) => {
    setEditingEvent(evt);
    setForm(toEventFormState(evt));
    setFieldErrors({});
    setFormError(null);
    setFormOpen(true);
  };

  const handleMapEmbedChange = (value: string) => {
    const processed = /<iframe\b/i.test(value)
      ? extractMapEmbedSrc(value)
      : value;
    setForm((prev) => ({ ...prev, mapEmbedUrl: processed }));
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const payloadCandidate = {
      title: form.title,
      startsAt: toIsoPlus07(form.startsAtLocal),
      lunarDate: form.lunarDate,
      venueName: form.venueName,
      venueAddress: form.venueAddress,
      mapEmbedUrl: extractMapEmbedSrc(form.mapEmbedUrl) || null,
      mapDirectionsUrl: form.mapDirectionsUrl.trim() || null,
    };

    const parsed = weddingEventInputSchema.safeParse(payloadCandidate);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] ? String(issue.path[0]) : "_form";
        if (!nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      setFormError(parsed.error.issues[0]?.message ?? "Vui lòng kiểm tra lại thông tin lễ.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingEvent) {
        const updated = await updateEvent(weddingId, editingEvent.id, parsed.data);
        onEventsChange(
          events.map((item) => (item.id === updated.id ? updated : item)),
        );
        showToast(`Đã cập nhật "${updated.title}"`, "success");
      } else {
        const created = await createEvent(weddingId, parsed.data);
        onEventsChange([...events, created]);
        showToast(`Đã thêm "${created.title}"`, "success");
      }
      setFormOpen(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setFormOpen(false);
        window.location.assign("/auth/login");
        return;
      }
      if (err instanceof ApiError && err.field) {
        setFieldErrors({ [err.field]: err.message });
      }
      setFormError(
        err instanceof Error ? err.message : "Không thể lưu thông tin lễ.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingEvent) return;
    setDeleting(true);
    try {
      await deleteEvent(weddingId, deletingEvent.id);
      onEventsChange(events.filter((item) => item.id !== deletingEvent.id));
      showToast(`Đã xóa lễ "${deletingEvent.title}"`, "success");
      setDeletingEvent(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setDeletingEvent(null);
        window.location.assign("/auth/login");
        return;
      }
      showToast(
        err instanceof Error ? err.message : "Không thể xóa lễ.",
        "error",
      );
    } finally {
      setDeleting(false);
    }
  };

  const applyReorder = async (nextList: WeddingEvent[]) => {
    const previous = events;
    const normalized = nextList.map((evt, index) => ({
      ...evt,
      position: index,
    }));
    onEventsChange(normalized);
    setReordering(true);
    try {
      const saved = await reorderEvents(
        weddingId,
        normalized.map((evt, index) => ({ id: evt.id, position: index })),
      );
      onEventsChange(saved);
    } catch (err) {
      onEventsChange(previous);
      if (err instanceof ApiError && err.status === 401) {
        window.location.assign("/auth/login");
        return;
      }
      showToast(
        err instanceof Error ? err.message : "Không thể sắp xếp lại thứ tự lễ.",
        "error",
      );
    } finally {
      setReordering(false);
    }
  };

  const moveByOffset = (index: number, offset: -1 | 1) => {
    const target = index + offset;
    if (target < 0 || target >= events.length || reordering) return;
    const copy = [...events];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    applyReorder(copy);
  };

  const handleDropOnEvent = (targetId: string) => {
    if (!draggingId || draggingId === targetId || reordering) {
      setDraggingId(null);
      return;
    }
    const fromIndex = events.findIndex((e) => e.id === draggingId);
    const toIndex = events.findIndex((e) => e.id === targetId);
    setDraggingId(null);
    if (fromIndex < 0 || toIndex < 0) return;
    const copy = [...events];
    const [moved] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, moved);
    applyReorder(copy);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-fg">
            Lễ &amp; địa điểm tổ chức
          </h2>
          <p className="text-xs text-fg-muted sm:text-sm">
            Đang có {events.length}/{limits.events} lễ (gói {getPlanLabel(plan)}). Lễ đầu
            tiên được dùng cho đồng hồ đếm ngược.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={openCreateModal}
          disabled={reachedLimit}
          title={reachedLimit ? getEventLimitMessage(plan) : undefined}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Thêm lễ mới</span>
        </Button>
      </div>

      {reachedLimit && (
        <div className="rounded-xl border border-accent/40 bg-accent-soft px-4 py-3 text-xs text-text sm:text-sm">
          {getEventLimitMessage(plan)}{" "}
          <Link href="/#bang-gia" className="font-semibold text-text underline">
            Xem bảng giá
          </Link>
        </div>
      )}

      {events.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/35 bg-accent-soft text-accent-text">
            <CalendarHeart className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="mt-4 font-display text-xl font-semibold text-fg">
            Chưa có lễ hoặc tiệc cưới nào
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-fg-muted">
            Thêm Lễ Gia Tiên, Lễ Thành Hôn hoặc Tiệc Mừng để hiển thị lịch trình, bản đồ và chỉ đường trên thiệp.
          </p>
          <Button variant="primary" className="mt-5" onClick={openCreateModal}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Thêm lễ đầu tiên</span>
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((evt, index) => {
            const dateParts = formatWeddingDateParts(evt.startsAt);
            const isDragging = draggingId === evt.id;

            return (
              <Card
                key={evt.id}
                draggable={!reordering && events.length > 1}
                onDragStart={() => setDraggingId(evt.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropOnEvent(evt.id)}
                onDragEnd={() => setDraggingId(null)}
                className={cn(
                  "p-4 transition-all sm:p-5",
                  isDragging && "border-accent opacity-60",
                )}
              >
                <div className="flex items-start gap-3">
                  {events.length > 1 && (
                    <div
                      className="hidden shrink-0 cursor-grab pt-1 text-fg-muted active:cursor-grabbing sm:block"
                      title="Kéo thả để đổi thứ tự hiển thị"
                    >
                      <GripVertical className="h-4 w-4" aria-hidden="true" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-accent/40 bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-text">
                            #{index + 1}
                          </span>
                          <h3 className="truncate font-display text-xl font-semibold text-fg">
                            {evt.title}
                          </h3>
                        </div>
                        <p className="mt-1 text-xs font-medium text-accent-text">
                          {dateParts.time} · {dateParts.weekday} · {dateParts.dotDate}
                          {evt.lunarDate ? ` (${evt.lunarDate})` : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        {events.length > 1 && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={index === 0 || reordering}
                              onClick={() => moveByOffset(index, -1)}
                              aria-label={`Di chuyển "${evt.title}" lên`}
                            >
                              <ArrowUp className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={index === events.length - 1 || reordering}
                              onClick={() => moveByOffset(index, 1)}
                              aria-label={`Di chuyển "${evt.title}" xuống`}
                            >
                              <ArrowDown className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(evt)}
                          aria-label={`Sửa "${evt.title}"`}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingEvent(evt)}
                          aria-label={`Xóa "${evt.title}"`}
                          className="text-danger-fg hover:bg-danger-bg"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-bg p-3 text-xs">
                      <p className="font-semibold text-fg">{evt.venueName}</p>
                      {evt.venueAddress && (
                        <p className="mt-0.5 text-fg-muted">{evt.venueAddress}</p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[11px]",
                            evt.mapEmbedUrl ? "text-success-fg" : "text-fg-muted",
                          )}
                        >
                          <MapPin className="h-3 w-3" aria-hidden="true" />
                          <span>
                            {evt.mapEmbedUrl
                              ? "Đã gắn bản đồ nhúng"
                              : "Chưa gắn bản đồ nhúng"}
                          </span>
                        </span>
                        {evt.mapDirectionsUrl && (
                          <a
                            href={evt.mapDirectionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-accent-text underline underline-offset-4 hover:text-accent-hover"
                          >
                            <span>Mở link chỉ đường</span>
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal tạo / sửa lễ */}
      <Dialog
        open={formOpen}
        onClose={() => !submitting && setFormOpen(false)}
        title={editingEvent ? `Chỉnh sửa "${editingEvent.title}"` : "Thêm lễ cưới mới"}
        description="Thông tin ngày giờ, địa điểm và Google Maps sẽ hiển thị ngay trên thiệp cưới."
        className="max-w-lg"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4" noValidate>
          <Input
            label="Tên lễ *"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            maxLength={EVENT_TITLE_MAX_LENGTH}
            placeholder="Ví dụ: Lễ Thành Hôn / Tiệc Mừng Nhà Gái"
            error={fieldErrors.title}
            autoFocus
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              type="datetime-local"
              label="Ngày giờ bắt đầu (+07:00) *"
              value={form.startsAtLocal}
              onChange={(e) =>
                setForm((p) => ({ ...p, startsAtLocal: e.target.value }))
              }
              error={fieldErrors.startsAt}
            />
            <Input
              label="Ngày âm lịch"
              value={form.lunarDate}
              onChange={(e) => setForm((p) => ({ ...p, lunarDate: e.target.value }))}
              maxLength={EVENT_LUNAR_MAX_LENGTH}
              placeholder="Ngày 24 tháng 11 năm Bính Ngọ"
              error={fieldErrors.lunarDate}
            />
          </div>

          <Input
            label="Tên địa điểm / sảnh tiệc *"
            value={form.venueName}
            onChange={(e) => setForm((p) => ({ ...p, venueName: e.target.value }))}
            maxLength={EVENT_VENUE_MAX_LENGTH}
            placeholder="Ví dụ: Trung tâm Tiệc cưới White Palace"
            error={fieldErrors.venueName}
          />

          <Input
            label="Địa chỉ chi tiết"
            value={form.venueAddress}
            onChange={(e) => setForm((p) => ({ ...p, venueAddress: e.target.value }))}
            maxLength={EVENT_ADDRESS_MAX_LENGTH}
            placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
            error={fieldErrors.venueAddress}
          />

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="event-map-embed"
                className="block text-sm font-medium text-fg"
              >
                Link nhúng Google Maps (tùy chọn)
              </label>
              <button
                type="button"
                onClick={() => setMapGuideOpen(true)}
                className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-accent-text underline underline-offset-4 hover:text-accent-hover"
              >
                <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Lấy link nhúng từ Google Maps</span>
              </button>
            </div>
            <Input
              id="event-map-embed"
              value={form.mapEmbedUrl}
              onChange={(e) => handleMapEmbedChange(e.target.value)}
              onBlur={(e) =>
                setForm((p) => ({
                  ...p,
                  mapEmbedUrl: extractMapEmbedSrc(e.target.value),
                }))
              }
              maxLength={EVENT_URL_MAX_LENGTH}
              placeholder="https://www.google.com/maps/embed?pb=... hoặc dán nguyên thẻ <iframe>"
              hint="Dán nguyên thẻ <iframe> hoặc URL bắt đầu bằng https://."
              error={fieldErrors.mapEmbedUrl}
            />
          </div>

          <Input
            label="Link chỉ đường Google Maps (tùy chọn)"
            value={form.mapDirectionsUrl}
            onChange={(e) =>
              setForm((p) => ({ ...p, mapDirectionsUrl: e.target.value }))
            }
            maxLength={EVENT_URL_MAX_LENGTH}
            placeholder="https://maps.app.goo.gl/... hoặc https://www.google.com/maps/..."
            error={fieldErrors.mapDirectionsUrl}
          />

          {formError && (
            <p
              role="alert"
              className="rounded-xl border border-danger-border bg-danger-bg px-3.5 py-2.5 text-xs text-danger-fg"
            >
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {editingEvent ? "Lưu thay đổi" : "Thêm lễ"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal hướng dẫn lấy link nhúng Google Maps */}
      <Dialog
        open={mapGuideOpen}
        onClose={() => setMapGuideOpen(false)}
        title="Cách lấy link nhúng Google Maps"
        description="Bản đồ tương tác sẽ hiển thị trực tiếp bên trong thiệp cưới."
      >
        <ol className="list-decimal space-y-2.5 pl-4 text-sm leading-relaxed text-fg">
          <li>
            Mở{" "}
            <a
              href="https://maps.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent-text underline"
            >
              Google Maps
            </a>{" "}
            trên máy tính và tìm tên nhà hàng / địa điểm tổ chức.
          </li>
          <li>
            Bấm nút <strong>Chia sẻ (Share)</strong>, sau đó chọn thẻ{" "}
            <strong>Nhúng bản đồ (Embed a map)</strong>.
          </li>
          <li>
            Bấm <strong>Sao chép HTML (Copy HTML)</strong>.
          </li>
          <li>
            Dán trực tiếp đoạn mã vừa sao chép vào ô{" "}
            <strong>Link nhúng Google Maps</strong> — hệ thống sẽ tự trích xuất đúng liên kết{" "}
            <code className="rounded bg-surface-muted px-1 py-0.5 text-xs text-text">
              https://...
            </code>
            .
          </li>
        </ol>
        <div className="mt-5 flex justify-end">
          <Button variant="primary" onClick={() => setMapGuideOpen(false)}>
            Đã hiểu
          </Button>
        </div>
      </Dialog>

      {/* Modal xác nhận xóa lễ */}
      <Dialog
        open={Boolean(deletingEvent)}
        onClose={() => !deleting && setDeletingEvent(null)}
        title="Xác nhận xóa lễ cưới"
        description={
          deletingEvent
            ? `Bạn có chắc muốn xóa "${deletingEvent.title}"? Khách mời đang được gán riêng vào lễ này cũng sẽ được gỡ khỏi lễ.`
            : undefined
        }
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => setDeletingEvent(null)}
            disabled={deleting}
          >
            Hủy
          </Button>
          <Button
            variant="danger"
            loading={deleting}
            onClick={handleConfirmDelete}
          >
            Xóa lễ
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

