"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarHeart,
  Check,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  MessageSquareShare,
  Music,
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
  listGifts,
  listGuests,
  listGuestsPage,
  setGuestEvents,
  updateGuest,
} from "@/lib/api";
import {
  buildGuestExportRows,
  downloadGuestsCsv,
} from "@/lib/export-guests-csv";
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
  mealMode?: "meat" | "veg" | "both";
  onMealModeChange?: (mode: "meat" | "veg" | "both") => void;
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
  mealMode = "meat",
  onMealModeChange,
  onGuestsChanged,
}: GuestTableProps) {
  const { showToast } = useToast();
  const [guests, setGuests] = React.useState<Guest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | GuestStatus>("all");

  const [addOpen, setAddOpen] = React.useState(false);
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [copiedInviteId, setCopiedInviteId] = React.useState<string | null>(null);

  const [editingGuest, setEditingGuest] = React.useState<Guest | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editRelationship, setEditRelationship] = React.useState<
    NonNullable<Guest["relationshipGroup"]> | ""
  >("");
  const [editTableNumber, setEditTableNumber] = React.useState("");
  const [editDiet, setEditDiet] = React.useState<
    NonNullable<Guest["dietaryPreference"]> | ""
  >("");
  const [exporting, setExporting] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);
  const [savingEdit, setSavingEdit] = React.useState(false);

  const [assigningGuest, setAssigningGuest] = React.useState<Guest | null>(null);
  const [selectedEventIds, setSelectedEventIds] = React.useState<string[]>([]);
  const [assignError, setAssignError] = React.useState<string | null>(null);
  const [savingAssign, setSavingAssign] = React.useState(false);

  const [selectedGuestIds, setSelectedGuestIds] = React.useState<string[]>([]);
  const [bulkAssignOpen, setBulkAssignOpen] = React.useState(false);
  const [bulkEventIds, setBulkEventIds] = React.useState<string[]>([]);
  const [bulkAssignError, setBulkAssignError] = React.useState<string | null>(null);
  const [savingBulkAssign, setSavingBulkAssign] = React.useState(false);

  const [deletingGuest, setDeletingGuest] = React.useState<Guest | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const loadGuests = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listGuestsPage(weddingId, {
        page,
        pageSize: 50,
        q: debouncedSearch,
        status: statusFilter,
      });
      setGuests(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      if (page > data.totalPages) setPage(data.totalPages);
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
  }, [weddingId, page, debouncedSearch, statusFilter]);

  React.useEffect(() => {
    loadGuests();
  }, [loadGuests]);

  // Tìm kiếm phía server, debounce 300ms và quay về trang 1.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const eventMap = React.useMemo(
    () => new Map(events.map((evt) => [evt.id, evt])),
    [events],
  );

  const limits = getPlanLimits(plan);
  const guestLimit = limits.guests;
  const reachedGuestLimit =
    guestLimit !== null && !loading && total >= guestLimit;

  const getResolvedEvents = React.useCallback(
    (guest: Guest): WeddingEvent[] => {
      const ids = guest.eventIds ?? [];
      return ids
        .map((id) => eventMap.get(id))
        .filter((evt): evt is WeddingEvent => Boolean(evt));
    },
    [eventMap],
  );

  const songRequests = React.useMemo(() => {
    return guests
      .filter((g) => Boolean(g.songRequest && g.songRequest.trim()))
      .map((g) => ({
        guestName: g.name,
        song: g.songRequest!.trim(),
      }));
  }, [guests]);

  const toggleSelectAll = () => {
    if (selectedGuestIds.length === guests.length) {
      setSelectedGuestIds([]);
    } else {
      setSelectedGuestIds(guests.map((g) => g.id));
    }
  };

  const toggleSelectGuest = (guestId: string) => {
    setSelectedGuestIds((prev) =>
      prev.includes(guestId) ? prev.filter((id) => id !== guestId) : [...prev, guestId],
    );
  };

  const openBulkAssignModal = () => {
    setBulkEventIds([]);
    setBulkAssignError(null);
    setBulkAssignOpen(true);
  };

  const toggleBulkEventSelection = (eventId: string) => {
    setBulkEventIds((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId],
    );
  };

  const handleSaveBulkAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGuestIds.length === 0) return;
    setBulkAssignError(null);
    setSavingBulkAssign(true);
    try {
      await Promise.all(
        selectedGuestIds.map((guestId) =>
          setGuestEvents(weddingId, guestId, bulkEventIds),
        ),
      );
      setGuests((prev) =>
        prev.map((g) =>
          selectedGuestIds.includes(g.id) ? { ...g, eventIds: bulkEventIds } : g,
        ),
      );
      showToast(
        `Đã gán buổi lễ cho ${selectedGuestIds.length} khách mời đã chọn`,
        "success",
      );
      setBulkAssignOpen(false);
      setSelectedGuestIds([]);
      onGuestsChanged?.();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setBulkAssignOpen(false);
        window.location.assign("/auth/login");
        return;
      }
      setBulkAssignError(
        err instanceof Error ? err.message : "Không thể gán buổi lễ cho khách.",
      );
    } finally {
      setSavingBulkAssign(false);
    }
  };

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

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const allGuests = await listGuests(weddingId);
      let gifts: Awaited<ReturnType<typeof listGifts>>["items"] = [];
      if (plan !== "free") {
        try {
          gifts = (await listGifts(weddingId)).items;
        } catch {
          gifts = [];
        }
      }
      const rows = buildGuestExportRows(allGuests, {
        origin: window.location.origin,
        gifts,
      });
      downloadGuestsCsv(
        rows,
        `khach-moi-${new Date().toISOString().slice(0, 10)}.csv`,
      );
      showToast(`Đã xuất ${rows.length} khách mời ra CSV`, "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Không xuất được danh sách.",
        "error",
      );
    } finally {
      setExporting(false);
    }
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
    setEditRelationship(guest.relationshipGroup ?? "");
    setEditTableNumber(guest.tableNumber ?? "");
    setEditDiet(guest.dietaryPreference ?? "");
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
      const updated = await updateGuest(weddingId, editingGuest.id, {
        name: trimmed,
        relationshipGroup: editRelationship || null,
        tableNumber: editTableNumber.trim() || null,
        dietaryPreference: editDiet || null,
      });
      setGuests((prev) =>
        prev.map((item) =>
          item.id === updated.id
            ? { ...updated, eventIds: updated.eventIds ?? item.eventIds }
            : item,
        ),
      );
      showToast("Đã cập nhật thông tin khách mời", "success");
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
      setTotal((prev) => Math.max(0, prev - 1));
      showToast(`Đã xóa khách mời "${deletingGuest.name}"`, "success");
      setDeletingGuest(null);
      onGuestsChanged?.();
      // Nếu xoá khách cuối cùng của trang hiện tại thì lùi về trang trước.
      if (guests.length <= 1 && page > 1) {
        setPage((prev) => Math.max(1, prev - 1));
      } else {
        void loadGuests();
      }
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
              ? `Đang dùng ${total}/${guestLimit} khách mời (gói ${getPlanLabel(plan)}).`
              : `Tổng cộng ${total} khách mời.`}
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
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            loading={exporting}
            disabled={total === 0}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Xuất CSV</span>
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

      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-fg">Loại hình bữa ăn</p>
            <p className="mt-0.5 text-xs text-fg-muted">
              Khóa lựa chọn của khách trong form xác nhận tham dự.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              ["meat", "Mặn"],
              ["veg", "Chay"],
              ["both", "Chay và mặn"],
            ].map(([value, label]) => (
              <label key={value} className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-fg">
                <input
                  type="radio"
                  name="mealMode"
                  value={value}
                  checked={mealMode === value}
                  onChange={() => onMealModeChange?.(value as "meat" | "veg" | "both")}
                  className="h-3.5 w-3.5 accent-[var(--accent)]"
                />
                {label}
              </label>
            ))}
          </div>
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
                  onClick={() => {
                    setStatusFilter(opt.value);
                    setPage(1);
                  }}
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

      {/* Collapsible song requests */}
      {songRequests.length > 0 && (
        <details className="group rounded-xl border border-border bg-surface p-4">
          <summary className="flex cursor-pointer select-none items-center justify-between text-sm font-semibold text-fg">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-accent-text" aria-hidden="true" />
              <span>Bài hát yêu cầu ({songRequests.length})</span>
            </div>
            <ChevronDown className="h-4 w-4 text-accent-text transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-3 max-h-48 divide-y divide-border/60 overflow-y-auto">
            {songRequests.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 py-2 text-xs"
              >
                <span className="font-medium text-fg">{item.song}</span>
                <span className="shrink-0 text-[11px] text-fg-muted">
                  ({item.guestName})
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Bulk action bar */}
      {selectedGuestIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-accent/50 bg-accent-soft px-4 py-3">
          <span className="text-xs font-medium text-text sm:text-sm">
            Đã chọn <strong>{selectedGuestIds.length}</strong> khách mời
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedGuestIds([])}
            >
              Bỏ chọn
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={openBulkAssignModal}
            >
              <CalendarHeart className="h-4 w-4" aria-hidden="true" />
              <span>Gán buổi lễ cho khách đã chọn</span>
            </Button>
          </div>
        </div>
      )}

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
      ) : guests.length === 0 &&
        total === 0 &&
        !debouncedSearch &&
        statusFilter === "all" ? (
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
      ) : guests.length === 0 ? (
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
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={
                          guests.length > 0 &&
                          selectedGuestIds.length === guests.length
                        }
                        onChange={toggleSelectAll}
                        aria-label="Chọn tất cả khách"
                        className="h-4 w-4 rounded border-border accent-accent"
                      />
                    </th>
                    <th className="whitespace-nowrap px-4 py-3">Khách mời</th>
                    <th className="whitespace-nowrap px-4 py-3">Trạng thái</th>
                    <th className="whitespace-nowrap px-4 py-3">Bài hát yêu cầu</th>
                    <th className="whitespace-nowrap px-4 py-3">Các lễ được mời</th>
                    <th className="whitespace-nowrap px-4 py-3">Phản hồi lúc</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/80">
                  {guests.map((guest) => {
                    const isCopied = copiedId === guest.id;
                    const isInviteCopied = copiedInviteId === guest.id;
                    return (
                      <tr key={guest.id} className="hover:bg-surface-muted/45">
                        <td className="w-10 px-4 py-3.5">
                          <input
                            type="checkbox"
                            checked={selectedGuestIds.includes(guest.id)}
                            onChange={() => toggleSelectGuest(guest.id)}
                            aria-label={`Chọn ${guest.name}`}
                            className="h-4 w-4 rounded border-border accent-accent"
                          />
                        </td>
                        <td className="min-w-[160px] px-4 py-3.5">
                          <div className="font-medium text-fg">{guest.name}</div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <StatusBadge status={guest.status} />
                          {renderGuestExtras(guest)}
                        </td>
                        <td className="max-w-[150px] px-4 py-3.5 text-xs text-fg">
                          {guest.songRequest ? (
                            <span className="block truncate" title={guest.songRequest}>
                              {guest.songRequest}
                            </span>
                          ) : (
                            <span className="text-fg-muted">—</span>
                          )}
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
            {guests.map((guest) => {
              const isCopied = copiedId === guest.id;
              const isInviteCopied = copiedInviteId === guest.id;
              return (
                <Card key={guest.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedGuestIds.includes(guest.id)}
                        onChange={() => toggleSelectGuest(guest.id)}
                        aria-label={`Chọn ${guest.name}`}
                        className="mt-1 h-4 w-4 rounded border-border accent-accent"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-fg">{guest.name}</p>
                        {guest.songRequest && (
                          <p className="mt-0.5 text-[11px] text-fg-muted">
                            <span className="font-medium text-fg">Bài hát:</span>{" "}
                            {guest.songRequest}
                          </p>
                        )}
                      </div>
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

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
            <p className="text-xs text-fg-muted" aria-live="polite">
              Trang <strong className="font-semibold text-fg">{page}</strong> /{" "}
              {totalPages} · {total} khách mời
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Trang trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Trang sau
              </Button>
            </div>
          </div>
        </>
      )}

      <AddGuestDialog
        weddingId={weddingId}
        events={events}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(created) => {
          setGuests((prev) => [created, ...prev]);
          setTotal((prev) => prev + 1);
          onGuestsChanged?.();
        }}
      />

      <BulkImportDialog
        weddingId={weddingId}
        plan={plan}
        currentGuestCount={total}
        existingGuestNames={guests.map((g) => g.name)}
        events={events}
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onCreated={(created) => {
          setGuests((prev) => [...created, ...prev]);
          setTotal((prev) => prev + created.length);
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

              <p className="mt-2 text-xs text-fg-muted">
                Khách không được gán buổi lễ nào sẽ thấy tất cả buổi lễ của thiệp.
              </p>

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

      {/* Modal gán lễ hàng loạt */}
      <Dialog
        open={bulkAssignOpen}
        onClose={() => !savingBulkAssign && setBulkAssignOpen(false)}
        title="Gán buổi lễ cho khách đã chọn"
        description={`Chọn các buổi lễ áp dụng cho ${selectedGuestIds.length} khách mời đã chọn.`}
      >
        <form onSubmit={handleSaveBulkAssign} className="space-y-4">
          {events.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-5 text-center text-xs text-fg-muted">
              Thiệp chưa có lễ nào. Hãy thêm lễ ở mục &ldquo;Lễ &amp; địa điểm&rdquo; trước.
            </p>
          ) : (
            <div className="space-y-2">
              {events.map((evt) => {
                const checked = bulkEventIds.includes(evt.id);
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
                      onChange={() => toggleBulkEventSelection(evt.id)}
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

              <p className="mt-2 text-xs text-fg-muted">
                Khách không được gán buổi lễ nào sẽ thấy tất cả buổi lễ của thiệp.
              </p>

              {bulkEventIds.length > 0 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setBulkEventIds([])}
                    className="cursor-pointer text-xs font-medium text-accent-text underline underline-offset-4 hover:text-accent-hover"
                  >
                    Bỏ chọn tất cả (hiển thị mọi lễ)
                  </button>
                </div>
              )}
            </div>
          )}

          {bulkAssignError && (
            <p role="alert" className="text-xs text-danger-fg">
              {bulkAssignError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setBulkAssignOpen(false)}
              disabled={savingBulkAssign}
            >
              Hủy
            </Button>
            {events.length > 0 && (
              <Button type="submit" variant="primary" loading={savingBulkAssign}>
                Lưu phân bổ lễ
              </Button>
            )}
          </div>
        </form>
      </Dialog>

      <Dialog
        open={Boolean(editingGuest)}
        onClose={() => !savingEdit && setEditingGuest(null)}
        title="Sửa thông tin khách mời"
        description="Link thiệp đã tạo cho khách vẫn giữ nguyên; bạn có thể sửa tên, vai vế, số bàn và thực đơn."
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

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium text-fg">
              Vai vế / cách xưng hô
              <select
                value={editRelationship}
                onChange={(e) =>
                  setEditRelationship(
                    e.target.value as NonNullable<Guest["relationshipGroup"]> | "",
                  )
                }
                className="mt-1 h-10 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                <option value="">Tự động (bạn bè/đồng nghiệp)</option>
                <option value="elder">Bề trên / Họ hàng</option>
                <option value="family">Gia đình</option>
                <option value="close_friend">Bạn thân</option>
                <option value="peer_formal">Bạn bè / Đồng nghiệp</option>
              </select>
            </label>

            <Input
              label="Số bàn tiệc"
              value={editTableNumber}
              onChange={(e) => setEditTableNumber(e.target.value)}
              placeholder="Ví dụ: Bàn 08 - Khu VIP"
              maxLength={40}
            />
          </div>

          <label className="block text-xs font-medium text-fg">
            Thực đơn
            <select
              value={editDiet}
              onChange={(e) =>
                setEditDiet(
                  e.target.value as NonNullable<Guest["dietaryPreference"]> | "",
                )
              }
              className="mt-1 h-10 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              <option value="">Chưa chọn</option>
              <option value="standard">Mặn (standard)</option>
              <option value="vegetarian">Chay (vegetarian)</option>
            </select>
          </label>

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
