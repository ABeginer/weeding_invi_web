"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarHeart,
  Check,
  CheckCheck,
  ChevronDown,
  Clock,
  Copy,
  Download,
  ExternalLink,
  MessageSquareShare,
  Music,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  Upload,
  Users,
  Utensils,
  X,
} from "lucide-react";
import { getPlanLabel, getPlanLimits } from "@/config/plans";
import { buildInviteShareMessage } from "@/config/share-templates";
import {
  ApiError,
  buildGuestLink,
  bulkAssignTable,
  deleteGuest,
  deleteGuests,
  getStats,
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
import type {
  Guest,
  GuestStatus,
  Stats,
  WeddingEvent,
  WeddingPlan,
} from "@/lib/types";
import { cn, formatDateTimeVi, formatWeddingDateParts } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { AddGuestDialog } from "./AddGuestDialog";
import { BulkImportDialog } from "./BulkImportDialog";
import { SentBadge, StatusBadge } from "./StatusBadge";

interface GuestTableProps {
  weddingId: string;
  plan: WeddingPlan;
  events: WeddingEvent[];
  mealMode?: "meat" | "veg" | "both";
  onMealModeChange?: (mode: "meat" | "veg" | "both") => void;
  onGuestsChanged?: () => void;
}

// TODO: Persist 'is_sent' and 'sent_at' column directly in Supabase guests table when migration is applied.
const SENT_STORAGE_KEY_PREFIX = "inviwedd_sent_guests_";

function getSentGuestIds(weddingId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(`${SENT_STORAGE_KEY_PREFIX}${weddingId}`);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveSentGuestIds(weddingId: string, ids: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `${SENT_STORAGE_KEY_PREFIX}${weddingId}`,
      JSON.stringify(Array.from(ids)),
    );
  } catch {}
}

type QuickFilter =
  | "all"
  | "unsent"
  | "sent"
  | "accepted"
  | "pending"
  | "declined"
  | "veg"
  | "unassigned"
  | "checkedIn";

function getRelationshipLabel(group?: Guest["relationshipGroup"]): string | null {
  if (!group) return null;
  switch (group) {
    case "elder":
      return "Họ hàng";
    case "family":
      return "Gia đình";
    case "close_friend":
      return "Bạn thân";
    case "peer_formal":
      return "Đồng nghiệp";
    default:
      return null;
  }
}

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
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Pagination & Search
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [filterTab, setFilterTab] = React.useState<QuickFilter>("all");

  // Sent status tracking in localStorage (with DB migration TODO)
  const [sentGuestIds, setSentGuestIds] = React.useState<Set<string>>(() =>
    getSentGuestIds(weddingId),
  );

  // Dialog states
  const [addOpen, setAddOpen] = React.useState(false);
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [copiedInviteId, setCopiedInviteId] = React.useState<string | null>(null);

  // Edit dialog state
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

  // Inline table assignment state
  const [editingTableGuestId, setEditingTableGuestId] = React.useState<string | null>(null);
  const [inlineTableValue, setInlineTableValue] = React.useState("");

  // Bulk table assignment state
  const [bulkTableValue, setBulkTableValue] = React.useState("");
  const [bulkAssigningTable, setBulkAssigningTable] = React.useState(false);

  // Assign events dialog state
  const [assigningGuest, setAssigningGuest] = React.useState<Guest | null>(null);
  const [selectedEventIds, setSelectedEventIds] = React.useState<string[]>([]);
  const [assignError, setAssignError] = React.useState<string | null>(null);
  const [savingAssign, setSavingAssign] = React.useState(false);

  // Bulk actions state
  const [selectedGuestIds, setSelectedGuestIds] = React.useState<string[]>([]);
  const [bulkAssignOpen, setBulkAssignOpen] = React.useState(false);
  const [bulkEventIds, setBulkEventIds] = React.useState<string[]>([]);
  const [bulkAssignError, setBulkAssignError] = React.useState<string | null>(null);
  const [savingBulkAssign, setSavingBulkAssign] = React.useState(false);

  const [deletingGuest, setDeletingGuest] = React.useState<Guest | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const [bulkDeleting, setBulkDeleting] = React.useState(false);

  // Load guests & stats
  const loadGuests = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Map API status for accepted/declined/pending
      const apiStatus =
        filterTab === "accepted" || filterTab === "declined" || filterTab === "pending"
          ? filterTab
          : "all";

      const [paged, statsData] = await Promise.all([
        listGuestsPage(weddingId, {
          page,
          pageSize: 50,
          q: debouncedSearch,
          status: apiStatus,
        }),
        getStats(weddingId).catch(() => null),
      ]);

      setGuests(paged.items);
      setTotal(paged.total);
      setTotalPages(paged.totalPages);
      if (statsData) setStats(statsData);
      if (page > paged.totalPages) setPage(paged.totalPages);
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
  }, [weddingId, page, debouncedSearch, filterTab]);

  React.useEffect(() => {
    loadGuests();
  }, [loadGuests]);

  // Synchronize localStorage sent IDs on weddingId change
  React.useEffect(() => {
    setSentGuestIds(getSentGuestIds(weddingId));
  }, [weddingId]);

  // Search debounce
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 250);
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

  // Toggle Sent Status manually
  const toggleSentStatus = React.useCallback(
    (guestId: string, guestName?: string) => {
      setSentGuestIds((prev) => {
        const next = new Set(prev);
        const isSent = next.has(guestId);
        if (isSent) {
          next.delete(guestId);
          showToast(
            `Đã chuyển ${guestName ? `"${guestName}"` : "khách"} về "Chưa gửi"`,
            "info",
          );
        } else {
          next.add(guestId);
          showToast(
            `Đã đánh dấu ${guestName ? `"${guestName}"` : "khách"} là "Đã gửi"`,
            "success",
          );
        }
        saveSentGuestIds(weddingId, next);
        return next;
      });
    },
    [showToast, weddingId],
  );

  // 1-Tap Copy Invitation & Link + Auto-mark Sent
  const handleCopyInvite = async (guest: Guest) => {
    const url = buildGuestLink(guest.slug);
    const message = buildInviteShareMessage(guest.name, url);

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

    const wasSent = sentGuestIds.has(guest.id);
    if (!wasSent) {
      setSentGuestIds((prev) => {
        const next = new Set(prev);
        next.add(guest.id);
        saveSentGuestIds(weddingId, next);
        return next;
      });
    }

    setCopiedInviteId(guest.id);
    window.setTimeout(() => {
      setCopiedInviteId((prev) => (prev === guest.id ? null : prev));
    }, 2000);

    showToast(
      wasSent
        ? `Đã sao chép lời mời cho "${guest.name}"`
        : `Đã sao chép lời mời và đánh dấu "Đã gửi" cho "${guest.name}"`,
      "success",
      !wasSent
        ? {
            label: "Hoàn tác",
            onClick: () => {
              setSentGuestIds((prev) => {
                const next = new Set(prev);
                next.delete(guest.id);
                saveSentGuestIds(weddingId, next);
                return next;
              });
              showToast(`Đã hoàn tác: chuyển "${guest.name}" về Chưa gửi`, "info");
            },
          }
        : undefined,
    );
  };

  // Copy raw URL only
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
    showToast(`Đã sao chép liên kết thiệp cho "${guest.name}"`, "info");
    window.setTimeout(() => {
      setCopiedId((prev) => (prev === guest.id ? null : prev));
    }, 1800);
  };

  // Bulk mark sent/unsent
  const handleBulkMarkSent = (markAsSent: boolean) => {
    if (selectedGuestIds.length === 0) return;
    setSentGuestIds((prev) => {
      const next = new Set(prev);
      for (const id of selectedGuestIds) {
        if (markAsSent) next.add(id);
        else next.delete(id);
      }
      saveSentGuestIds(weddingId, next);
      return next;
    });
    showToast(
      `Đã đánh dấu ${selectedGuestIds.length} khách mời là "${markAsSent ? "Đã gửi" : "Chưa gửi"}"`,
      "success",
    );
    setSelectedGuestIds([]);
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
      showToast(`Đã xuất ${rows.length} khách mời ra CSV (UTF-8 BOM)`, "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Không xuất được danh sách.",
        "error",
      );
    } finally {
      setExporting(false);
    }
  };

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

  const handleStartEditTable = (guest: Guest) => {
    setEditingTableGuestId(guest.id);
    setInlineTableValue(guest.tableNumber ?? "");
  };

  const handleSaveInlineTable = async (guest: Guest) => {
    if (editingTableGuestId !== guest.id) return;
    const trimmed = inlineTableValue.trim() || null;
    const previousTable = guest.tableNumber ?? null;
    setEditingTableGuestId(null);

    if (trimmed === previousTable) return;

    // Optimistic local state update
    setGuests((prev) =>
      prev.map((g) => (g.id === guest.id ? { ...g, tableNumber: trimmed } : g)),
    );

    try {
      await updateGuest(weddingId, guest.id, {
        name: guest.name,
        tableNumber: trimmed,
      });
      showToast(
        trimmed
          ? `Đã xếp "${guest.name}" vào ${trimmed}`
          : `Đã hủy xếp bàn cho "${guest.name}"`,
        "success",
      );
      onGuestsChanged?.();
    } catch (err) {
      // Rollback on error
      setGuests((prev) =>
        prev.map((g) =>
          g.id === guest.id ? { ...g, tableNumber: previousTable } : g,
        ),
      );
      showToast(
        err instanceof Error ? err.message : "Không thể cập nhật số bàn.",
        "error",
      );
    }
  };

  const handleApplyBulkTable = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (selectedGuestIds.length === 0) return;
    const trimmed = bulkTableValue.trim() || null;
    setBulkAssigningTable(true);

    const originalGuests = [...guests];
    setGuests((prev) =>
      prev.map((g) =>
        selectedGuestIds.includes(g.id) ? { ...g, tableNumber: trimmed } : g,
      ),
    );

    try {
      await bulkAssignTable(weddingId, selectedGuestIds, trimmed);
      showToast(
        trimmed
          ? `Đã xếp ${selectedGuestIds.length} khách vào "${trimmed}"`
          : `Đã xóa số bàn cho ${selectedGuestIds.length} khách`,
        "success",
      );
      setSelectedGuestIds([]);
      setBulkTableValue("");
      onGuestsChanged?.();
    } catch (err) {
      setGuests(originalGuests);
      showToast(
        err instanceof Error ? err.message : "Không thể gán số bàn hàng loạt.",
        "error",
      );
    } finally {
      setBulkAssigningTable(false);
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

  const handleConfirmBulkDelete = async () => {
    if (selectedGuestIds.length === 0) return;
    const ids = selectedGuestIds;
    setBulkDeleting(true);
    try {
      const { deleted } = await deleteGuests(weddingId, ids);
      setGuests((prev) => prev.filter((item) => !ids.includes(item.id)));
      setTotal((prev) => Math.max(0, prev - deleted));
      setSelectedGuestIds([]);
      setBulkDeleteOpen(false);
      showToast(`Đã xóa ${deleted} khách mời`, "success");
      onGuestsChanged?.();
      if (guests.length <= deleted && page > 1) {
        setPage((prev) => Math.max(1, prev - 1));
      } else {
        void loadGuests();
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setBulkDeleteOpen(false);
        window.location.assign("/auth/login");
        return;
      }
      showToast(
        err instanceof Error ? err.message : "Không thể xóa khách mời.",
        "error",
      );
    } finally {
      setBulkDeleting(false);
    }
  };

  // Instant client-side filtering + search
  const filteredGuests = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return guests.filter((g) => {
      if (q) {
        const matchName = g.name.toLowerCase().includes(q);
        const matchTable = (g.tableNumber ?? "").toLowerCase().includes(q);
        const matchSong = (g.songRequest ?? "").toLowerCase().includes(q);
        if (!matchName && !matchTable && !matchSong) return false;
      }

      const isSent = sentGuestIds.has(g.id);
      if (filterTab === "unsent") return !isSent;
      if (filterTab === "sent") return isSent;
      if (filterTab === "accepted") return g.status === "accepted";
      if (filterTab === "pending") return g.status === "pending";
      if (filterTab === "declined") return g.status === "declined";
      if (filterTab === "veg") {
        return (
          g.diet === "veg" ||
          g.dietaryPreference === "vegetarian"
        );
      }
      if (filterTab === "unassigned") {
        return !g.tableNumber || !g.tableNumber.trim();
      }
      if (filterTab === "checkedIn") {
        return Boolean(g.checkedInAt);
      }
      return true;
    });
  }, [guests, search, filterTab, sentGuestIds]);

  // Derived KPI numbers
  const totalCount = stats?.total ?? total;
  const sentCount = Math.min(sentGuestIds.size, totalCount);
  const unsentCount = Math.max(0, totalCount - sentCount);
  const unassignedCount = React.useMemo(
    () => guests.filter((g) => !g.tableNumber || !g.tableNumber.trim()).length,
    [guests],
  );
  const checkedInCount = React.useMemo(
    () => guests.filter((g) => Boolean(g.checkedInAt)).length,
    [guests],
  );
  const sentPercent = totalCount > 0 ? Math.round((sentCount / totalCount) * 100) : 0;
  const acceptedCount = stats?.accepted ?? 0;
  const acceptedHeadcount = stats?.acceptedHeadcount ?? stats?.accepted ?? 0;
  const pendingCount = stats?.pending ?? 0;
  const declinedCount = stats?.declined ?? 0;
  const meatCount = stats?.meatCount ?? 0;
  const vegCount = stats?.vegCount ?? 0;

  const getResolvedEvents = React.useCallback(
    (guest: Guest): WeddingEvent[] => {
      const ids = guest.eventIds ?? [];
      return ids
        .map((id) => eventMap.get(id))
        .filter((evt): evt is WeddingEvent => Boolean(evt));
    },
    [eventMap],
  );

  return (
    <div className="space-y-6 text-[#1F1D1A]">
      {/* A. Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-3xl font-semibold text-[#1F1D1A]">
            Quản lý khách mời
          </h2>
          <p className="mt-1 text-xs text-[#6B655E] sm:text-sm">
            {guestLimit !== null
              ? `Đang sử dụng ${total}/${guestLimit} khách mời (Gói ${getPlanLabel(plan)}).`
              : `Tổng cộng ${total} khách mời trên hệ thống.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setBulkOpen(true)}
            disabled={reachedGuestLimit}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#E8E2D9] bg-white px-4 py-2 text-xs font-semibold text-[#1F1D1A] shadow-2xs transition-colors hover:border-[#B89B72] hover:bg-[#FAF8F5] disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5 text-[#B89B72]" aria-hidden="true" />
            <span>Nhập Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={total === 0 || exporting}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#E8E2D9] bg-white px-4 py-2 text-xs font-semibold text-[#1F1D1A] shadow-2xs transition-colors hover:border-[#B89B72] hover:bg-[#FAF8F5] disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5 text-[#6B655E]" aria-hidden="true" />
            <span>{exporting ? "Đang xuất..." : "Xuất CSV"}</span>
          </button>

          <button
            type="button"
            onClick={() => setAddOpen(true)}
            disabled={reachedGuestLimit}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#7A1C24] px-5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#5E141B] disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>+ Thêm khách</span>
          </button>
        </div>
      </div>

      {/* 4-Card KPI Strip */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4 sm:gap-4">
        {/* Card 1: Tổng khách mời & Tiến độ gửi */}
        <div className="rounded-2xl border border-[#E8E2D9] bg-white p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B655E]">Tổng khách mời</span>
            <Users className="h-4 w-4 text-[#7A1C24]" />
          </div>
          <div className="my-2">
            <span className="font-serif text-3xl font-semibold text-[#1F1D1A]">
              {totalCount}
            </span>
          </div>
          <div>
            <div className="flex items-center justify-between text-[11px] text-[#6B655E]">
              <span>Đã gửi {sentCount}/{totalCount} thiệp</span>
              <span className="font-semibold text-[#2F6F4E]">{sentPercent}%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#FAF8F5] border border-[#E8E2D9]">
              <div
                className="h-full rounded-full bg-[#2F6F4E] transition-all duration-500"
                style={{ width: `${sentPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Đã xác nhận (RSVP) */}
        <div className="rounded-2xl border border-[#E8E2D9] bg-white p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B655E]">Đã xác nhận (RSVP)</span>
            <CheckCheck className="h-4 w-4 text-[#2F6F4E]" />
          </div>
          <div className="my-2">
            <span className="font-serif text-3xl font-semibold text-[#2F6F4E]">
              {acceptedCount}
            </span>
            <span className="ml-1 text-xs text-[#6B655E]">khách</span>
          </div>
          <div className="text-[11px] text-[#6B655E]">
            {acceptedHeadcount > acceptedCount ? (
              <span>+{acceptedHeadcount - acceptedCount} người đi cùng · <strong className="font-semibold text-[#1F1D1A]">{acceptedHeadcount} người</strong></span>
            ) : (
              <span>Tổng cộng <strong className="font-semibold text-[#1F1D1A]">{acceptedHeadcount} người</strong> tham dự</span>
            )}
          </div>
        </div>

        {/* Card 3: Chờ phản hồi / Từ chối */}
        <div className="rounded-2xl border border-[#E8E2D9] bg-white p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B655E]">Chờ phản hồi / Từ chối</span>
            <Clock className="h-4 w-4 text-[#8A6D3B]" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-semibold text-[#8A6D3B]">
              {pendingCount}
            </span>
            <span className="text-xs text-[#6B655E]">chờ</span>
            <span className="text-[#E8E2D9]" aria-hidden="true">/</span>
            <span className="font-serif text-2xl font-semibold text-[#9E3B3B]">
              {declinedCount}
            </span>
            <span className="text-xs text-[#6B655E]">từ chối</span>
          </div>
          <p className="text-[11px] text-[#6B655E]">
            {declinedCount > 0 ? "Đã cập nhật danh sách bàn tiệc" : "Chưa có khách từ chối"}
          </p>
        </div>

        {/* Card 4: Thực đơn tiệc */}
        <div className="rounded-2xl border border-[#E8E2D9] bg-white p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B655E]">Thực đơn tiệc cưới</span>
            <Utensils className="h-4 w-4 text-[#B89B72]" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-semibold text-[#1F1D1A]">
              {meatCount}
            </span>
            <span className="text-xs font-medium text-[#6B655E]">Mặn</span>
            <span className="text-[#E8E2D9]" aria-hidden="true">·</span>
            <span className="font-serif text-3xl font-semibold text-[#2F6F4E]">
              {vegCount}
            </span>
            <span className="text-xs font-medium text-[#2F6F4E]">Chay</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#6B655E]">
            <span>Khẩu phần cỗ</span>
            <span className="font-medium text-[#1F1D1A]">
              {mealMode === "both" ? "Mặn & Chay" : mealMode === "veg" ? "Chỉ ăn chay" : "Ăn mặn"}
            </span>
          </div>
        </div>
      </div>

      {/* B. Sticky Quick Filter & Search Bar */}
      <div className="sticky top-14 z-20 rounded-2xl border border-[#E8E2D9] bg-white p-3 sm:p-4 shadow-xs backdrop-blur-md">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search input */}
          <div className="relative min-w-[240px] flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#6B655E]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên khách, số bàn (vd: Bàn 08)..."
              className="h-10 w-full rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] pr-8 pl-10 text-xs text-[#1F1D1A] placeholder:text-[#6B655E]/70 outline-none transition-colors focus:border-[#7A1C24] focus:bg-white focus:ring-1 focus:ring-[#7A1C24]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-[#6B655E] hover:text-[#1F1D1A]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar sm:pb-0">
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                filterTab === "all"
                  ? "bg-[#1F1D1A] text-[#FAF8F5] shadow-xs"
                  : "border border-[#E8E2D9] bg-[#FAF8F5] text-[#6B655E] hover:border-[#1F1D1A]/30",
              )}
            >
              <span>Tất cả</span>
              <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px]">
                {totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("unsent")}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                filterTab === "unsent"
                  ? "bg-[#8A6D3B] text-white shadow-xs font-semibold"
                  : "border border-[#E8DAC0] bg-[#FAF3E3] text-[#8A6D3B] hover:bg-[#f5e9d0]",
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#8A6D3B] animate-pulse" />
              <span>Chưa gửi</span>
              <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px] font-bold">
                {unsentCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("sent")}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                filterTab === "sent"
                  ? "bg-[#2F6F4E] text-white shadow-xs font-semibold"
                  : "border border-[#BBDBC9] bg-[#ECF5F0] text-[#2F6F4E] hover:bg-[#d8ece0]",
              )}
            >
              <span>Đã gửi</span>
              <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px]">
                {sentCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("accepted")}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                filterTab === "accepted"
                  ? "bg-[#1F1D1A] text-[#FAF8F5] shadow-xs"
                  : "border border-[#E8E2D9] bg-[#FAF8F5] text-[#6B655E] hover:border-[#1F1D1A]/30",
              )}
            >
              <span>Đã xác nhận</span>
              <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px]">
                {acceptedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("pending")}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                filterTab === "pending"
                  ? "bg-[#1F1D1A] text-[#FAF8F5] shadow-xs"
                  : "border border-[#E8E2D9] bg-[#FAF8F5] text-[#6B655E] hover:border-[#1F1D1A]/30",
              )}
            >
              <span>Chờ phản hồi</span>
              <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px]">
                {pendingCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("declined")}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                filterTab === "declined"
                  ? "bg-[#9E3B3B] text-white shadow-xs"
                  : "border border-[#ECCFCF] bg-[#FBEFEF] text-[#9E3B3B] hover:bg-[#f6dfdf]",
              )}
            >
              <span>Từ chối</span>
              <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px]">
                {declinedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("veg")}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                filterTab === "veg"
                  ? "bg-[#2F6F4E] text-white shadow-xs"
                  : "border border-[#E8E2D9] bg-[#FAF8F5] text-[#6B655E] hover:border-[#1F1D1A]/30",
              )}
            >
              <span>Ăn chay</span>
              <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px]">
                {vegCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("unassigned")}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                filterTab === "unassigned"
                  ? "bg-[#7A1C24] text-white shadow-xs font-semibold"
                  : "border border-[#E8E2D9] bg-[#FAF8F5] text-[#6B655E] hover:border-[#7A1C24]/30",
              )}
            >
              <span>Chưa xếp bàn</span>
              <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px]">
                {unassignedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("checkedIn")}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                filterTab === "checkedIn"
                  ? "bg-[#2F6F4E] text-white shadow-xs font-semibold"
                  : "border border-[#BBDBC9] bg-[#ECF5F0] text-[#2F6F4E] hover:bg-[#d8ece0]",
              )}
            >
              <Check className="h-3 w-3" />
              <span>Đã đến</span>
              <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px]">
                {checkedInCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar (When selected) */}
      {selectedGuestIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-[#B89B72]/50 bg-[#F4EFEA] px-4 py-3 shadow-sm animate-in fade-in">
          <span className="text-xs font-semibold text-[#1F1D1A]">
            Đã chọn <strong>{selectedGuestIds.length}</strong> khách mời
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleBulkMarkSent(true)}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[#BBDBC9] bg-[#ECF5F0] px-3 py-1 text-xs font-semibold text-[#2F6F4E] hover:bg-[#d8ece0]"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Đánh dấu đã gửi</span>
            </button>
            <button
              type="button"
              onClick={() => handleBulkMarkSent(false)}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[#E8DAC0] bg-[#FAF3E3] px-3 py-1 text-xs font-semibold text-[#8A6D3B] hover:bg-[#f5e9d0]"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Đánh dấu chưa gửi</span>
            </button>
            <button
              type="button"
              onClick={openBulkAssignModal}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[#E8E2D9] bg-white px-3 py-1 text-xs font-medium text-[#1F1D1A] hover:bg-[#FAF8F5]"
            >
              <CalendarHeart className="h-3.5 w-3.5 text-[#B89B72]" />
              <span>Gán buổi lễ</span>
            </button>

            {/* Gán số bàn hàng loạt */}
            <form
              onSubmit={handleApplyBulkTable}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E2D9] bg-white px-2.5 py-1 shadow-2xs"
            >
              <span className="text-[11px] font-medium text-[#6B655E]">Gán vào bàn:</span>
              <input
                type="text"
                value={bulkTableValue}
                onChange={(e) => setBulkTableValue(e.target.value)}
                placeholder="Bàn 08..."
                className="h-5 w-20 bg-transparent text-xs text-[#1F1D1A] outline-none placeholder:text-[#6B655E]/60"
              />
              <button
                type="submit"
                disabled={bulkAssigningTable || !bulkTableValue.trim()}
                className="cursor-pointer rounded-full bg-[#7A1C24] px-2.5 py-0.5 text-[11px] font-semibold text-white hover:bg-[#5E141B] disabled:opacity-40"
              >
                {bulkAssigningTable ? "..." : "Áp dụng"}
              </button>
            </form>
            <button
              type="button"
              onClick={() => setBulkDeleteOpen(true)}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[#ECCFCF] bg-[#FBEFEF] px-3 py-1 text-xs font-medium text-[#9E3B3B] hover:bg-[#f6dfdf]"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Xóa</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedGuestIds([])}
              className="cursor-pointer text-xs text-[#6B655E] underline underline-offset-2 hover:text-[#1F1D1A]"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Main Guest List Content */}
      {loading ? (
        <div className="space-y-3 rounded-2xl border border-[#E8E2D9] bg-white p-6 shadow-2xs">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton key={idx} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-800">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
          <p className="mt-2 text-sm font-medium">{error}</p>
          <button
            type="button"
            onClick={loadGuests}
            className="mt-4 rounded-full border border-rose-300 bg-white px-4 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-50"
          >
            Thử lại
          </button>
        </div>
      ) : filteredGuests.length === 0 ? (
        <div className="rounded-2xl border border-[#E8E2D9] bg-white p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FAF8F5] text-[#7A1C24] border border-[#E8E2D9]">
            <Users className="h-7 w-7" />
          </div>
          <h3 className="mt-4 font-serif text-2xl font-normal text-[#1F1D1A]">
            {search || filterTab !== "all"
              ? "Không có khách mời nào khớp với bộ lọc"
              : "Chưa có khách mời nào trong danh sách"}
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-xs text-[#6B655E]">
            {search || filterTab !== "all"
              ? "Hãy thử tìm kiếm với từ khóa khác hoặc xóa bớt tiêu chí lọc."
              : "Thêm từng khách hoặc nhập file Excel để Inviwedd tạo thiệp kèm xưng hô riêng biệt."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            {search || filterTab !== "all" ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilterTab("all");
                }}
                className="rounded-full bg-[#1F1D1A] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-black"
              >
                Xóa bộ lọc
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setBulkOpen(true)}
                  className="rounded-full border border-[#E8E2D9] bg-white px-5 py-2 text-xs font-semibold text-[#1F1D1A] shadow-2xs hover:bg-[#FAF8F5]"
                >
                  Nhập file Excel
                </button>
                <button
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="rounded-full bg-[#7A1C24] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#5E141B]"
                >
                  + Thêm khách đầu tiên
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* D. Desktop View (Table on Desktop) */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-[#E8E2D9] bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E8E2D9] bg-[#FAF8F5] text-[11px] font-semibold uppercase tracking-wider text-[#6B655E]">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={
                          filteredGuests.length > 0 &&
                          selectedGuestIds.length === filteredGuests.length
                        }
                        onChange={toggleSelectAll}
                        aria-label="Chọn tất cả khách"
                        className="h-4 w-4 rounded border-[#E8E2D9] accent-[#7A1C24]"
                      />
                    </th>
                    <th className="px-3 py-3 font-semibold">Khách mời &amp; Vai vế</th>
                    <th className="px-3 py-3 font-semibold">Gửi thiệp</th>
                    <th className="px-3 py-3 font-semibold">RSVP &amp; Bàn tiệc</th>
                    <th className="px-3 py-3 font-semibold">Lễ mời</th>
                    <th className="sticky right-0 z-10 border-l border-[#E8E2D9] bg-[#FAF8F5] px-4 py-3 text-right font-semibold">
                      Thao tác gửi nhanh
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D9]/70">
                  {filteredGuests.map((guest) => {
                    const isSent = sentGuestIds.has(guest.id);
                    const isInviteCopied = copiedInviteId === guest.id;
                    const isCopied = copiedId === guest.id;
                    const relLabel = getRelationshipLabel(guest.relationshipGroup);
                    const plusOnes = typeof guest.plusOnes === "number" ? guest.plusOnes : 0;
                    const isVeg =
                      guest.diet === "veg" ||
                      guest.dietaryPreference === "vegetarian";

                    return (
                      <tr
                        key={guest.id}
                        className={cn(
                          "transition-colors group",
                          isSent
                            ? "bg-[#FAF8F5]/50 hover:bg-[#FAF8F5]"
                            : "bg-white hover:bg-[#FAF8F5]/40",
                        )}
                      >
                        {/* Checkbox */}
                        <td className="w-10 px-4 py-3.5">
                          <input
                            type="checkbox"
                            checked={selectedGuestIds.includes(guest.id)}
                            onChange={() => toggleSelectGuest(guest.id)}
                            aria-label={`Chọn ${guest.name}`}
                            className="h-4 w-4 rounded border-[#E8E2D9] accent-[#7A1C24]"
                          />
                        </td>

                        {/* Guest name & relationship */}
                        <td className="min-w-[160px] px-3 py-3.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="font-semibold text-sm text-[#1F1D1A]"
                              title={guest.name}
                            >
                              {guest.name}
                            </span>
                            {relLabel && (
                              <span className="rounded-full border border-[#E8E2D9] bg-[#FAF8F5] px-2 py-0.5 text-[10px] font-medium text-[#6B655E]">
                                {relLabel}
                              </span>
                            )}
                          </div>
                          {guest.songRequest && (
                            <p className="mt-0.5 max-w-[200px] truncate text-[11px] text-[#6B655E]">
                              🎵 {guest.songRequest}
                            </p>
                          )}
                        </td>

                        {/* Sent status badge (clickable toggle) */}
                        <td className="whitespace-nowrap px-3 py-3.5">
                          <SentBadge
                            isSent={isSent}
                            onClick={() => toggleSentStatus(guest.id, guest.name)}
                          />
                        </td>

                        {/* RSVP & Table */}
                        <td className="whitespace-nowrap px-3 py-3.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <StatusBadge status={guest.status} />
                            {plusOnes > 0 && (
                              <span className="rounded-full border border-[#E8E2D9] bg-[#FAF8F5] px-2 py-0.5 text-[10px] font-medium text-[#1F1D1A]">
                                +{plusOnes} người
                              </span>
                            )}
                            {guest.status === "accepted" && (
                              <span
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-[10px] font-medium border",
                                  isVeg
                                    ? "border-[#BBDBC9] bg-[#ECF5F0] text-[#2F6F4E]"
                                    : "border-[#E8E2D9] bg-white text-[#6B655E]",
                                )}
                              >
                                {isVeg ? "Chay" : "Mặn"}
                              </span>
                            )}
                            {guest.checkedInAt && (
                              <span
                                title="Khách đã check-in tại sảnh cưới"
                                className="inline-flex items-center gap-0.5 rounded-full border border-[#BBDBC9] bg-[#ECF5F0] px-2 py-0.5 text-[10px] font-semibold text-[#2F6F4E]"
                              >
                                <Check className="h-2.5 w-2.5" />
                                <span>Đã đến</span>
                              </span>
                            )}
                            {editingTableGuestId === guest.id ? (
                              <div className="inline-flex items-center gap-1">
                                <input
                                  autoFocus
                                  type="text"
                                  value={inlineTableValue}
                                  onChange={(e) => setInlineTableValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveInlineTable(guest);
                                    if (e.key === "Escape") setEditingTableGuestId(null);
                                  }}
                                  onBlur={() => handleSaveInlineTable(guest)}
                                  placeholder="Số bàn..."
                                  className="h-6 w-20 rounded border border-[#7A1C24] bg-white px-1.5 text-[11px] font-medium text-[#1F1D1A] outline-none shadow-xs"
                                />
                              </div>
                            ) : guest.tableNumber ? (
                              <button
                                type="button"
                                onClick={() => handleStartEditTable(guest)}
                                title="Nhấn để đổi bàn"
                                className="inline-flex cursor-pointer items-center gap-0.5 rounded-full border border-[#B89B72]/40 bg-[#FAF8F5] px-2 py-0.5 text-[10px] font-medium text-[#B89B72] hover:border-[#7A1C24] hover:text-[#7A1C24]"
                              >
                                <span>📍 {guest.tableNumber}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleStartEditTable(guest)}
                                title="Nhấn để xếp bàn nhanh"
                                className="inline-flex cursor-pointer items-center gap-0.5 rounded-full border border-dashed border-[#E8E2D9] bg-white px-2 py-0.5 text-[10px] text-[#6B655E] hover:border-[#7A1C24] hover:text-[#7A1C24]"
                              >
                                <span>+ Xếp bàn</span>
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Ceremony Assignment */}
                        <td className="px-3 py-3.5">
                          <button
                            type="button"
                            onClick={() => openAssignDialog(guest)}
                            className="inline-flex max-w-[180px] cursor-pointer flex-wrap items-center gap-1 rounded-lg border border-transparent p-1 text-left transition-colors hover:border-[#E8E2D9] hover:bg-white"
                          >
                            {getResolvedEvents(guest).length === 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-[#E8E2D9] bg-[#FAF8F5] px-2 py-0.5 text-[10px] text-[#6B655E]">
                                <CalendarHeart className="h-3 w-3" />
                                <span>Tất cả lễ</span>
                              </span>
                            ) : (
                              getResolvedEvents(guest).map((evt) => (
                                <span
                                  key={evt.id}
                                  className="truncate rounded-full border border-[#B89B72]/40 bg-[#F4EFEA] px-2 py-0.5 text-[10px] font-medium text-[#1F1D1A]"
                                >
                                  {evt.title}
                                </span>
                              ))
                            )}
                          </button>
                        </td>

                        {/* Primary Action Button (1-Tap Copy) + Secondary Icons */}
                        <td className="sticky right-0 z-10 border-l border-[#E8E2D9] bg-inherit px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* 1-Tap Copy & Auto-mark sent */}
                            <button
                              type="button"
                              onClick={() => handleCopyInvite(guest)}
                              className={cn(
                                "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-2xs transition-all whitespace-nowrap",
                                isInviteCopied
                                  ? "border border-[#BBDBC9] bg-[#ECF5F0] text-[#2F6F4E]"
                                  : isSent
                                    ? "border border-[#E8E2D9] bg-white text-[#1F1D1A] hover:border-[#B89B72] hover:bg-[#FAF8F5]"
                                    : "bg-[#7A1C24] text-white hover:bg-[#5E141B]",
                              )}
                            >
                              {isInviteCopied ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-[#2F6F4E]" />
                                  <span>✓ Đã copy &amp; Đã gửi</span>
                                </>
                              ) : (
                                <>
                                  <MessageSquareShare className="h-3.5 w-3.5" />
                                  <span>{isSent ? "Copy lại lời mời" : "Copy lời mời"}</span>
                                </>
                              )}
                            </button>

                            {/* Chỉ copy link */}
                            <button
                              type="button"
                              onClick={() => handleCopyLink(guest)}
                              title={isCopied ? "Đã chép link thiệp" : "Chỉ sao chép liên kết"}
                              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#E8E2D9] bg-white text-[#6B655E] transition-colors hover:border-[#B89B72] hover:bg-[#FAF8F5] hover:text-[#1F1D1A]"
                            >
                              {isCopied ? (
                                <Check className="h-3.5 w-3.5 text-[#2F6F4E]" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>

                            {/* Xem thiệp riêng */}
                            <a
                              href={buildGuestLink(guest.slug)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Xem thiệp riêng của khách này"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E8E2D9] bg-white text-[#6B655E] transition-colors hover:border-[#7A1C24] hover:bg-[#FAF8F5] hover:text-[#7A1C24]"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>

                            {/* Sửa thông tin */}
                            <button
                              type="button"
                              onClick={() => openEditDialog(guest)}
                              title="Sửa tên / vai vế / số bàn"
                              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#E8E2D9] bg-white text-[#6B655E] transition-colors hover:border-[#B89B72] hover:bg-[#FAF8F5] hover:text-[#1F1D1A]"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>

                            {/* Xóa khách */}
                            <button
                              type="button"
                              onClick={() => setDeletingGuest(guest)}
                              title="Xóa khách mời"
                              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#ECCFCF] bg-white text-[#9E3B3B] transition-colors hover:bg-[#FBEFEF]"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* D. Mobile View (Action Cards on Mobile) */}
          <div className="space-y-3.5 md:hidden">
            {filteredGuests.map((guest) => {
              const isSent = sentGuestIds.has(guest.id);
              const isInviteCopied = copiedInviteId === guest.id;
              const isCopied = copiedId === guest.id;
              const relLabel = getRelationshipLabel(guest.relationshipGroup);
              const plusOnes = typeof guest.plusOnes === "number" ? guest.plusOnes : 0;
              const isVeg =
                guest.diet === "veg" ||
                guest.dietaryPreference === "vegetarian";

              return (
                <div
                  key={guest.id}
                  className={cn(
                    "rounded-2xl border p-4 shadow-2xs transition-all space-y-3",
                    isSent
                      ? "border-[#E8E2D9] bg-[#FAF8F5]/70"
                      : "border-[#E8E2D9] bg-white",
                  )}
                >
                  {/* Top row: Name + Role pill + SentBadge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedGuestIds.includes(guest.id)}
                        onChange={() => toggleSelectGuest(guest.id)}
                        aria-label={`Chọn ${guest.name}`}
                        className="mt-1 h-4 w-4 rounded border-[#E8E2D9] accent-[#7A1C24]"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-semibold text-base text-[#1F1D1A] truncate">
                            {guest.name}
                          </p>
                          {relLabel && (
                            <span className="rounded-full border border-[#E8E2D9] bg-[#FAF8F5] px-2 py-0.5 text-[10px] font-medium text-[#6B655E]">
                              {relLabel}
                            </span>
                          )}
                        </div>
                        {editingTableGuestId === guest.id ? (
                          <div className="mt-1 inline-flex items-center gap-1">
                            <input
                              autoFocus
                              type="text"
                              value={inlineTableValue}
                              onChange={(e) => setInlineTableValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveInlineTable(guest);
                                if (e.key === "Escape") setEditingTableGuestId(null);
                              }}
                              onBlur={() => handleSaveInlineTable(guest)}
                              placeholder="Nhập số bàn..."
                              className="h-6 w-24 rounded border border-[#7A1C24] bg-white px-1.5 text-xs text-[#1F1D1A] outline-none shadow-xs"
                            />
                          </div>
                        ) : guest.tableNumber ? (
                          <button
                            type="button"
                            onClick={() => handleStartEditTable(guest)}
                            className="mt-0.5 inline-flex cursor-pointer items-center gap-1 text-xs text-[#B89B72] font-medium hover:text-[#7A1C24]"
                          >
                            <span>📍 {guest.tableNumber}</span>
                            <span className="text-[10px] text-[#6B655E]">(đổi)</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartEditTable(guest)}
                            className="mt-0.5 inline-flex cursor-pointer items-center gap-0.5 text-xs text-[#6B655E] underline underline-offset-2 hover:text-[#7A1C24]"
                          >
                            + Xếp bàn
                          </button>
                        )}
                      </div>
                    </div>

                    <SentBadge
                      isSent={isSent}
                      onClick={() => toggleSentStatus(guest.id, guest.name)}
                    />
                  </div>

                  {/* Middle row: RSVP status, headcount, menu type */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-y border-[#E8E2D9]/60 py-2.5 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <StatusBadge status={guest.status} />
                      {plusOnes > 0 && (
                        <span className="rounded-full border border-[#E8E2D9] bg-[#FAF8F5] px-2 py-0.5 text-[10px] text-[#1F1D1A]">
                          +{plusOnes} người
                        </span>
                      )}
                      {guest.status === "accepted" && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium border",
                            isVeg
                              ? "border-[#BBDBC9] bg-[#ECF5F0] text-[#2F6F4E]"
                              : "border-[#E8E2D9] bg-white text-[#6B655E]",
                          )}
                        >
                          {isVeg ? "Ăn Chay" : "Ăn Mặn"}
                        </span>
                      )}
                      {guest.checkedInAt && (
                        <span
                          title="Khách đã check-in tại sảnh cưới"
                          className="inline-flex items-center gap-0.5 rounded-full border border-[#BBDBC9] bg-[#ECF5F0] px-2 py-0.5 text-[10px] font-semibold text-[#2F6F4E]"
                        >
                          <Check className="h-2.5 w-2.5" />
                          <span>Đã đến</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => openAssignDialog(guest)}
                      className="cursor-pointer text-[11px] text-[#B89B72] underline underline-offset-2"
                    >
                      {getResolvedEvents(guest).length === 0
                        ? "Tất cả lễ"
                        : `${getResolvedEvents(guest).length} lễ mời`}
                    </button>
                  </div>

                  {/* Bottom row: Full-width prominent Copy button */}
                  <div>
                    <button
                      type="button"
                      onClick={() => handleCopyInvite(guest)}
                      className={cn(
                        "flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold shadow-xs transition-all",
                        isInviteCopied
                          ? "border border-[#BBDBC9] bg-[#ECF5F0] text-[#2F6F4E]"
                          : isSent
                            ? "border border-[#E8E2D9] bg-[#FAF8F5] text-[#1F1D1A] hover:bg-white"
                            : "bg-[#7A1C24] text-white hover:bg-[#5E141B]",
                      )}
                    >
                      {isInviteCopied ? (
                        <>
                          <Check className="h-4 w-4 text-[#2F6F4E]" />
                          <span>✓ Đã copy lời mời &amp; Đã gửi</span>
                        </>
                      ) : (
                        <>
                          <MessageSquareShare className="h-4 w-4" />
                          <span>{isSent ? "Copy lại lời mời (Zalo)" : "Copy lời mời + Link (Zalo)"}</span>
                        </>
                      )}
                    </button>

                    {/* Secondary icon buttons below */}
                    <div className="mt-2 flex items-center justify-end gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(guest)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#E8E2D9] bg-white px-2.5 py-1 text-[11px] text-[#6B655E] hover:bg-[#FAF8F5]"
                      >
                        <Copy className="h-3 w-3" />
                        <span>{isCopied ? "Đã copy link" : "Chỉ copy link"}</span>
                      </button>

                      <a
                        href={buildGuestLink(guest.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-[#E8E2D9] bg-white px-2.5 py-1 text-[11px] text-[#6B655E] hover:text-[#7A1C24]"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Xem thiệp</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => openEditDialog(guest)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#E8E2D9] bg-white px-2.5 py-1 text-[11px] text-[#6B655E]"
                      >
                        <Pencil className="h-3 w-3" />
                        <span>Sửa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingGuest(guest)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#ECCFCF] bg-white px-2.5 py-1 text-[11px] text-[#9E3B3B]"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E8E2D9] bg-white px-4 py-3 shadow-2xs">
            <p className="text-xs text-[#6B655E]">
              Trang <strong className="font-semibold text-[#1F1D1A]">{page}</strong> /{" "}
              {totalPages} · {total} khách mời
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="cursor-pointer rounded-full border border-[#E8E2D9] bg-white px-3.5 py-1 text-xs font-medium text-[#1F1D1A] hover:bg-[#FAF8F5] disabled:opacity-40"
              >
                Trang trước
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="cursor-pointer rounded-full border border-[#E8E2D9] bg-white px-3.5 py-1 text-xs font-medium text-[#1F1D1A] hover:bg-[#FAF8F5] disabled:opacity-40"
              >
                Trang sau
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add Guest Dialog */}
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

      {/* Bulk Import Dialog */}
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

      {/* Edit Guest Dialog */}
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
            <label className="block text-xs font-medium text-[#1F1D1A]">
              Vai vế / cách xưng hô
              <select
                value={editRelationship}
                onChange={(e) =>
                  setEditRelationship(
                    e.target.value as NonNullable<Guest["relationshipGroup"]> | "",
                  )
                }
                className="mt-1 h-10 w-full rounded-xl border border-[#E8E2D9] bg-white px-3 text-xs text-[#1F1D1A] outline-none focus:border-[#7A1C24]"
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

          <label className="block text-xs font-medium text-[#1F1D1A]">
            Thực đơn
            <select
              value={editDiet}
              onChange={(e) =>
                setEditDiet(
                  e.target.value as NonNullable<Guest["dietaryPreference"]> | "",
                )
              }
              className="mt-1 h-10 w-full rounded-xl border border-[#E8E2D9] bg-white px-3 text-xs text-[#1F1D1A] outline-none focus:border-[#7A1C24]"
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

      {/* Assign Events Dialog */}
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
            <p className="rounded-xl border border-dashed border-[#E8E2D9] px-4 py-5 text-center text-xs text-[#6B655E]">
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
                        ? "border-[#7A1C24] bg-[#FAF8F5]"
                        : "border-[#E8E2D9] bg-white hover:border-[#B89B72]",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleEventSelection(evt.id)}
                      className="mt-1 h-4 w-4 rounded border-[#E8E2D9] accent-[#7A1C24]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#1F1D1A]">{evt.title}</p>
                      <p className="mt-0.5 text-xs text-[#6B655E]">
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
                    className="cursor-pointer text-xs font-medium text-[#7A1C24] underline underline-offset-4 hover:text-[#5E141B]"
                  >
                    Bỏ chọn tất cả (hiển thị mọi lễ)
                  </button>
                </div>
              )}
            </div>
          )}

          {assignError && (
            <p role="alert" className="text-xs text-rose-600">
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

      {/* Bulk Assign Modal */}
      <Dialog
        open={bulkAssignOpen}
        onClose={() => !savingBulkAssign && setBulkAssignOpen(false)}
        title="Gán buổi lễ cho khách đã chọn"
        description={`Chọn các buổi lễ áp dụng cho ${selectedGuestIds.length} khách mời đã chọn.`}
      >
        <form onSubmit={handleSaveBulkAssign} className="space-y-4">
          {events.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#E8E2D9] px-4 py-5 text-center text-xs text-[#6B655E]">
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
                        ? "border-[#7A1C24] bg-[#FAF8F5]"
                        : "border-[#E8E2D9] bg-white hover:border-[#B89B72]",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleBulkEventSelection(evt.id)}
                      className="mt-1 h-4 w-4 rounded border-[#E8E2D9] accent-[#7A1C24]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#1F1D1A]">{evt.title}</p>
                      <p className="mt-0.5 text-xs text-[#6B655E]">
                        {dateParts.time} · {dateParts.dotDate} · {evt.venueName}
                      </p>
                    </div>
                  </label>
                );
              })}

              {bulkEventIds.length > 0 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setBulkEventIds([])}
                    className="cursor-pointer text-xs font-medium text-[#7A1C24] underline underline-offset-4 hover:text-[#5E141B]"
                  >
                    Bỏ chọn tất cả (hiển thị mọi lễ)
                  </button>
                </div>
              )}
            </div>
          )}

          {bulkAssignError && (
            <p role="alert" className="text-xs text-rose-600">
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

      {/* Delete Confirmation Dialog */}
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

      {/* Bulk Delete Dialog */}
      <Dialog
        open={bulkDeleteOpen}
        onClose={() => !bulkDeleting && setBulkDeleteOpen(false)}
        title="Xác nhận xóa khách mời"
        description={
          selectedGuestIds.length > 0
            ? `Bạn có chắc muốn xóa ${selectedGuestIds.length} khách mời đã chọn? Link thiệp riêng của những khách này sẽ không còn mở được nữa.`
            : undefined
        }
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => setBulkDeleteOpen(false)}
            disabled={bulkDeleting}
          >
            Hủy
          </Button>
          <Button
            variant="danger"
            loading={bulkDeleting}
            onClick={handleConfirmBulkDelete}
          >
            Xóa {selectedGuestIds.length} khách mời
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
