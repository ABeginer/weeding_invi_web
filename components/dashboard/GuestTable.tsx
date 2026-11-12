"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarHeart,
  Check,
  Copy,
  ExternalLink,
  MessageSquareShare,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { getPlanLabel, getPlanLimits } from "@/config/plans";
import { buildInviteShareMessage } from "@/config/share-templates";
import {
  ApiError,
  buildGuestLink,
  deleteGuest,
  listGuests,
  setGuestEvents,
  updateGuest,
} from "@/lib/api";
import type { Guest, GuestStatus, WeddingEvent, WeddingPlan } from "@/lib/types";
import { cn, formatDateTimeVi, formatWeddingDateParts } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { AddGuestDialog } from "./AddGuestDialog";
import { BulkImportDialog } from "./BulkImportDialog";
import { StatusBadge } from "./StatusBadge";

interface GuestTableProps {
  weddingId: string;
  plan: WeddingPlan;
  events: WeddingEvent[];
  onGuestsChanged?: () => void;
}

const FILTER_OPTIONS: { value: "all" | GuestStatus; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "accepted", label: "Chấp nhận" },
  { value: "declined", label: "Từ chối" },
  { value: "pending", label: "Chưa phản hồi" },
];

export function GuestTable({
  weddingId,
  plan,
  events,
  onGuestsChanged,
}: GuestTableProps) {
  const { showToast } = useToast();
  const [guests, setGuests] = React.useState<Guest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | GuestStatus>("all");

  const [addOpen, setAddOpen] = React.useState(false);
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [copiedInviteId, setCopiedInviteId] = React.useState<string | null>(null);

  const [editingGuest, setEditingGuest] = React.useState<Guest | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editError, setEditError] = React.useState<string | null>(null);
  const [savingEdit, setSavingEdit] = React.useState(false);

  const [assigningGuest, setAssigningGuest] = React.useState<Guest | null>(null);
  const [selectedEventIds, setSelectedEventIds] = React.useState<string[]>([]);
  const [assignError, setAssignError] = React.useState<string | null>(null);
  const [savingAssign, setSavingAssign] = React.useState(false);

  const [deletingGuest, setDeletingGuest] = React.useState<Guest | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const loadGuests = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listGuests(weddingId);
      setGuests(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.assign("/auth/login");
        return;
      }
      setError(
        err instanceof Error ? err.message : "Không thể tải danh sách khách mời.",
      );
    } finally {
      setLoading(false);
    }
  }, [weddingId]);

  React.useEffect(() => {
    loadGuests();
  }, [loadGuests]);

  const eventMap = React.useMemo(
    () => new Map(events.map((evt) => [evt.id, evt])),
    [events],
  );

  const filteredGuests = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return guests.filter((guest) => {
      if (statusFilter !== "all" && guest.status !== statusFilter) {
        return false;
      }
      if (
        keyword &&
        !guest.name.toLowerCase().includes(keyword) &&
        !guest.slug.toLowerCase().includes(keyword)
      ) {
        return false;
      }
      return true;
    });
  }, [guests, search, statusFilter]);

  const limits = getPlanLimits(plan);
  const guestLimit = limits.guests;
  const reachedGuestLimit =
    guestLimit !== null && !loading && guests.length >= guestLimit;

  const getResolvedEvents = React.useCallback(
    (guest: Guest): WeddingEvent[] => {
      const ids = guest.eventIds ?? [];
      return ids
        .map((id) => eventMap.get(id))
        .filter((evt): evt is WeddingEvent => Boolean(evt));
    },
    [eventMap],
  );

  const handleCopyLink = async (guest: Guest) => {
    const url = buildGuestLink(guest.slug);
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
    setCopiedId(guest.id);
    showToast(`Đã sao chép link thiệp cho "${guest.name}"`, "success");
    window.setTimeout(() => {
      setCopiedId((prev) => (prev === guest.id ? null : prev));
    }, 1800);
  };

  const handleCopyInvite = async (guest: Guest) => {
    const message = buildInviteShareMessage(guest.name, buildGuestLink(guest.slug));
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = message;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedInviteId(guest.id);
    showToast(`Đã sao chép lời mời cho "${guest.name}"`, "success");
    window.setTimeout(() => {
      setCopiedInviteId((prev) => (prev === guest.id ? null : prev));
    }, 1800);
  };

  const renderGuestExtras = (guest: Guest) => {
    if (guest.status !== "accepted") return null;
    const plusOnes = typeof guest.plusOnes === "number" ? guest.plusOnes : 0;
    const dietLabel =
      guest.diet === "veg" ? "Chay" : guest.diet === "meat" ? "Mặn" : null;
    if (plusOnes <= 0 && !dietLabel) return null;

    return (
      <div className="mt-1 flex flex-wrap items-center gap-1">
        {plusOnes > 0 && (
          <span className="rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[10px] font-medium text-fg">
            +{plusOnes} người
          </span>
        )}
        {dietLabel && (
          <span className="rounded-full border border-sage bg-surface px-2 py-0.5 text-[10px] font-medium text-fg">
            {dietLabel}
          </span>
        )}
      </div>
    );
  };

  const openEditDialog = (guest: Guest) => {
    setEditingGuest(guest);
    setEditName(guest.name);
    setEditError(null);
  };

  const openAssignDialog = (guest: Guest) => {
    const validIds = (guest.eventIds ?? []).filter((id) => eventMap.has(id));
    setAssigningGuest(guest);
    setSelectedEventIds(validIds);
    setAssignError(null);
  };

  const toggleEventSelection = (eventId: string) => {
    setSelectedEventIds((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId],
    );
  };

  const handleSaveAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningGuest) return;
    setAssignError(null);
    setSavingAssign(true);
    try {
      const res = await setGuestEvents(
        weddingId,
        assigningGuest.id,
        selectedEventIds,
      );
      setGuests((prev) =>
        prev.map((item) =>
          item.id === assigningGuest.id ? { ...item, eventIds: res.eventIds } : item,
        ),
      );
      showToast(
        res.eventIds.length > 0
          ? `Đã cập nhật lễ mời cho "${assigningGuest.name}"`
          : `"${assigningGuest.name}" sẽ xem tất cả các lễ`,
        "success",
      );
      setAssigningGuest(null);
      onGuestsChanged?.();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setAssigningGuest(null);
        window.location.assign("/auth/login");
        return;
      }
      setAssignError(
        err instanceof Error ? err.message : "Không thể cập nhật lễ mời cho khách.",
      );
    } finally {
      setSavingAssign(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuest) return;
    setEditError(null);

    const trimmed = editName.trim();
    if (!trimmed) {
      setEditError("Vui lòng nhập tên khách mời.");
      return;
    }

    setSavingEdit(true);
    try {
      const updated = await updateGuest(weddingId, editingGuest.id, { name: trimmed });
      setGuests((prev) =>
        prev.map((item) =>
          item.id === updated.id
            ? { ...updated, eventIds: updated.eventIds ?? item.eventIds }
            : item,
        ),
      );
      showToast("Đã cập nhật tên khách mời", "success");
      setEditingGuest(null);
      onGuestsChanged?.();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setEditingGuest(null);
        window.location.assign("/auth/login");
        return;
      }
      setEditError(
        err instanceof Error ? err.message : "Không thể cập nhật khách mời.",
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingGuest) return;
    setDeleting(true);
    try {
      await deleteGuest(weddingId, deletingGuest.id);
      setGuests((prev) => prev.filter((item) => item.id !== deletingGuest.id));
      showToast(`Đã xóa khách mời "${deletingGuest.name}"`, "success");
      setDeletingGuest(null);
      onGuestsChanged?.();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setDeletingGuest(null);
        window.location.assign("/auth/login");
        return;
      }
      showToast(
        err instanceof Error ? err.message : "Không thể xóa khách mời.",
        "error",
      );
    } finally {
      setDeleting(false);
    }
  };

  const renderAssignedEventsSummary = (guest: Guest) => {
    const resolved = getResolvedEvents(guest);
    return (
      <button
        type="button"
        onClick={() => openAssignDialog(guest)}
        className="group inline-flex cursor-pointer flex-wrap items-center gap-1 rounded-lg border border-transparent p-1 text-left transition-colors hover:border-border hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        title="Nhấn để phân bổ lễ mời"
      >
        {resolved.length === 0 ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-neutral-border bg-neutral-bg px-2.5 py-1 text-[11px] font-medium text-neutral-fg group-hover:border-accent/40 group-hover:text-text">
            <CalendarHeart className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span>Tất cả lễ</span>
          </span>
        ) : (
          resolved.map((evt) => (
            <span
              key={evt.id}
              className="shrink-0 whitespace-nowrap rounded-full border border-accent/40 bg-accent-soft px-2.5 py-0.5 text-[11px] font-medium text-text"
            >
              {evt.title}
            </span>
          ))
        )}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-fg">
            Danh sách khách mời
          </h2>
          <p className="text-xs text-fg-muted sm:text-sm">
            {guestLimit !== null
              ? `Đang dùng ${guests.length}/${guestLimit} khách mời (gói ${getPlanLabel(plan)}).`
              : `Tổng cộng ${guests.length} khách mời.`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBulkOpen(true)}
            disabled={reachedGuestLimit}
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            <span>Dán danh sách</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setAddOpen(true)}
            disabled={reachedGuestLimit}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Thêm khách</span>
          </Button>
        </div>
      </div>

      {reachedGuestLimit && guestLimit !== null && (
        <div className="rounded-xl border border-accent/40 bg-accent-soft px-4 py-3 text-xs text-text sm:text-sm">
          Gói {getPlanLabel(plan)} giới hạn tối đa{" "}
          <strong className="font-semibold text-text">{guestLimit} khách mời</strong>.
          Xóa bớt khách cũ hoặc{" "}
          <Link href="/#bang-gia" className="font-semibold text-text underline">
            nâng cấp gói
          </Link>
          .
        </div>
      )}

      <Card className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative min-w-[220px] flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-fg-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm khách theo tên..."
              aria-label="Tìm khách mời"
              className="h-10 w-full rounded-xl border border-border bg-bg pr-3.5 pl-10 text-sm text-fg placeholder:text-fg-muted/70 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            />
          </div>

          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label="Lọc theo trạng thái"
          >
            {FILTER_OPTIONS.map((opt) => {
              const active = statusFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatusFilter(opt.value)}
                  className={cn(
                    "cursor-pointer whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-accent bg-accent font-semibold text-accent-fg"
                      : "border-border bg-surface text-fg-muted hover:bg-surface-muted hover:text-fg",
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="space-y-3 p-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-12 w-full" />
          ))}
        </Card>
      ) : error ? (
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto h-9 w-9 text-danger-fg" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-fg">{error}</p>
          <Button variant="outline" className="mt-4" onClick={loadGuests}>
            Thử lại
          </Button>
        </Card>
      ) : guests.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/35 bg-accent-soft text-accent-text">
            <Users className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="mt-4 font-display text-xl font-semibold text-fg">
            Chưa có khách mời nào
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-fg-muted">
            Thêm từng khách hoặc dán danh sách để tạo link thiệp mang tên riêng cho từng người.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => setBulkOpen(true)}>
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span>Dán danh sách</span>
            </Button>
            <Button variant="primary" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Thêm khách đầu tiên</span>
            </Button>
          </div>
        </Card>
      ) : filteredGuests.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-fg-muted">
            Không tìm thấy khách mời phù hợp với bộ lọc hiện tại.
          </p>
        </Card>
      ) : (
        <>
          {/* Bảng trên màn hình vừa/lớn */}
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-muted text-xs font-semibold uppercase tracking-wide text-fg-muted">
                    <th className="whitespace-nowrap px-4 py-3">Khách mời</th>
                    <th className="whitespace-nowrap px-4 py-3">Trạng thái</th>
                    <th className="whitespace-nowrap px-4 py-3">Các lễ được mời</th>
                    <th className="whitespace-nowrap px-4 py-3">Phản hồi lúc</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/80">
                  {filteredGuests.map((guest) => {
                    const isCopied = copiedId === guest.id;
                    const isInviteCopied = copiedInviteId === guest.id;
                    return (
                      <tr key={guest.id} className="hover:bg-surface-muted/45">
                        <td className="min-w-[160px] px-4 py-3.5">
                          <div className="font-medium text-fg">{guest.name}</div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <StatusBadge status={guest.status} />
                          {renderGuestExtras(guest)}
                        </td>
                        <td className="px-4 py-3.5">
                          {renderAssignedEventsSummary(guest)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-xs text-fg-muted">
                          {formatDateTimeVi(guest.respondedAt)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyLink(guest)}
                            >
                              {isCopied ? (
                                <Check
                                  className="h-3.5 w-3.5 text-success-fg"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                              )}
                              <span>{isCopied ? "Đã chép" : "Chép link"}</span>
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleCopyInvite(guest)}
                            >
                              {isInviteCopied ? (
                                <Check
                                  className="h-3.5 w-3.5 text-success-fg"
                                  aria-hidden="true"
                                />
                              ) : (
                                <MessageSquareShare
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              )}
                              <span>{isInviteCopied ? "Đã chép" : "Chép lời mời"}</span>
                            </Button>
                            <a
                              href={`/m/${guest.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Mở thiệp của ${guest.name}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-fg-muted transition-colors hover:bg-surface-muted hover:text-accent-text"
                            >
                              <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            </a>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(guest)}
                              aria-label={`Sửa tên ${guest.name}`}
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingGuest(guest)}
                              aria-label={`Xóa ${guest.name}`}
                              className="text-danger-fg hover:bg-danger-bg"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Danh sách thẻ trên điện thoại */}
          <div className="space-y-3 md:hidden">
            {filteredGuests.map((guest) => {
              const isCopied = copiedId === guest.id;
              const isInviteCopied = copiedInviteId === guest.id;
              return (
                <Card key={guest.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-fg">{guest.name}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end">
                      <StatusBadge status={guest.status} />
                      {renderGuestExtras(guest)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-fg-muted">Lễ mời:</span>
                    {renderAssignedEventsSummary(guest)}
                  </div>

                  <p className="text-xs text-fg-muted">
                    Phản hồi lúc:{" "}
                    <span className="font-medium text-fg">
                      {formatDateTimeVi(guest.respondedAt)}
                    </span>
                  </p>

                  <div className="flex flex-wrap items-center gap-2 border-t border-border/80 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleCopyLink(guest)}
                    >
                      {isCopied ? (
                        <Check
                          className="h-3.5 w-3.5 text-success-fg"
                          aria-hidden="true"
                        />
                      ) : (
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      <span>{isCopied ? "Đã chép" : "Chép link"}</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleCopyInvite(guest)}
                    >
                      {isInviteCopied ? (
                        <Check
                          className="h-3.5 w-3.5 text-success-fg"
                          aria-hidden="true"
                        />
                      ) : (
                        <MessageSquareShare
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                      )}
                      <span>{isInviteCopied ? "Đã chép" : "Chép lời mời"}</span>
                    </Button>
                    <a
                      href={`/m/${guest.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Mở thiệp của ${guest.name}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-fg-muted hover:bg-surface-muted hover:text-accent-text"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(guest)}
                      aria-label={`Sửa ${guest.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingGuest(guest)}
                      aria-label={`Xóa ${guest.name}`}
                      className="text-danger-fg hover:bg-danger-bg"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <AddGuestDialog
        weddingId={weddingId}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(created) => {
          setGuests((prev) => [created, ...prev]);
          onGuestsChanged?.();
        }}
      />

      <BulkImportDialog
        weddingId={weddingId}
        plan={plan}
        currentGuestCount={guests.length}
        existingGuestNames={guests.map((g) => g.name)}
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onCreated={(created) => {
          setGuests((prev) => [...created, ...prev]);
          onGuestsChanged?.();
        }}
      />

      <Dialog
        open={Boolean(assigningGuest)}
        onClose={() => !savingAssign && setAssigningGuest(null)}
        title={
          assigningGuest
            ? `Các lễ mời cho "${assigningGuest.name}"`
            : "Phân bổ lễ cho khách mời"
        }
        description="Nếu không chọn lễ nào, khách sẽ nhìn thấy tất cả các lễ trên thiệp mời riêng của mình."
      >
        <form onSubmit={handleSaveAssign} className="space-y-4">
          {events.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-5 text-center text-xs text-fg-muted">
              Thiệp chưa có lễ nào. Hãy thêm lễ ở mục &ldquo;Lễ &amp; địa điểm&rdquo; trước.
            </p>
          ) : (
            <div className="space-y-2">
              {events.map((evt) => {
                const checked = selectedEventIds.includes(evt.id);
                const dateParts = formatWeddingDateParts(evt.startsAt);
                return (
                  <label
                    key={evt.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                      checked
                        ? "border-accent bg-accent-soft"
                        : "border-border bg-bg hover:border-accent/45",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleEventSelection(evt.id)}
                      className="mt-1 h-4 w-4 rounded border-border accent-accent"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-fg">{evt.title}</p>
                      <p className="mt-0.5 text-xs text-fg-muted">
                        {dateParts.time} · {dateParts.dotDate} · {evt.venueName}
                      </p>
                    </div>
                  </label>
                );
              })}

              {selectedEventIds.length > 0 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedEventIds([])}
                    className="cursor-pointer text-xs font-medium text-accent-text underline underline-offset-4 hover:text-accent-hover"
                  >
                    Bỏ chọn tất cả (hiển thị mọi lễ)
                  </button>
                </div>
              )}
            </div>
          )}

          {assignError && (
            <p role="alert" className="text-xs text-danger-fg">
              {assignError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setAssigningGuest(null)}
              disabled={savingAssign}
            >
              Hủy
            </Button>
            {events.length > 0 && (
              <Button type="submit" variant="primary" loading={savingAssign}>
                Lưu phân bổ lễ
              </Button>
            )}
          </div>
        </form>
      </Dialog>

      <Dialog
        open={Boolean(editingGuest)}
        onClose={() => !savingEdit && setEditingGuest(null)}
        title="Sửa tên khách mời"
        description="Link thiệp đã tạo cho khách vẫn giữ nguyên, bạn có thể yên tâm sửa tên hiển thị."
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <Input
            label="Tên hiển thị trên thiệp"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            error={editError ?? undefined}
            maxLength={100}
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setEditingGuest(null)}
              disabled={savingEdit}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" loading={savingEdit}>
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={Boolean(deletingGuest)}
        onClose={() => !deleting && setDeletingGuest(null)}
        title="Xác nhận xóa khách mời"
        description={
          deletingGuest
            ? `Bạn có chắc muốn xóa "${deletingGuest.name}"? Link thiệp riêng đã gửi cho khách này sẽ không còn mở được nữa.`
            : undefined
        }
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => setDeletingGuest(null)}
            disabled={deleting}
          >
            Hủy
          </Button>
          <Button
            variant="danger"
            loading={deleting}
            onClick={handleConfirmDelete}
          >
            Xóa khách mời
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
