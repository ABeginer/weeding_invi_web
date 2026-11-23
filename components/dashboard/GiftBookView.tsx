"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  Banknote,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Lock,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { getPlanLabel } from "@/config/plans";
import {
  ApiError,
  createGift,
  deleteGift,
  listGifts,
  listGuests,
  listWeddings,
  updateGift,
} from "@/lib/api";
import type { Gift, GiftMethod, GiftTotals, Guest, Wedding } from "@/lib/types";
import { cn, formatDateTimeVi } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Textarea } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

const METHOD_LABELS: Record<GiftMethod, string> = {
  cash: "Tiền mặt",
  bank: "Chuyển khoản",
  other: "Khác",
};

const MAX_GIFT_AMOUNT = 100_000_000_000; // 100 tỷ VNĐ

function formatDots(value: number): string {
  if (value === 0) return "0";
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parseDots(str: string): number {
  const digitsOnly = str.replace(/[^\d]/g, "");
  if (!digitsOnly) return 0;
  const num = parseInt(digitsOnly, 10);
  return Number.isNaN(num) ? 0 : Math.min(num, MAX_GIFT_AMOUNT);
}

interface GiftFormState {
  giverName: string;
  amountStr: string;
  method: GiftMethod;
  note: string;
  guestId: string | null;
}

const EMPTY_FORM: GiftFormState = {
  giverName: "",
  amountStr: "",
  method: "cash",
  note: "",
  guestId: null,
};

export function GiftBookView() {
  const { showToast } = useToast();

  const [weddings, setWeddings] = React.useState<Wedding[]>([]);
  const [selectedWeddingId, setSelectedWeddingId] = React.useState<string | null>(null);
  const [loadingWeddings, setLoadingWeddings] = React.useState(true);

  const [gifts, setGifts] = React.useState<Gift[]>([]);
  const [totals, setTotals] = React.useState<GiftTotals>({
    totalVnd: 0,
    count: 0,
    unthankedCount: 0,
  });
  const [guests, setGuests] = React.useState<Guest[]>([]);
  const [loadingData, setLoadingData] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPlanLocked, setIsPlanLocked] = React.useState(false);

  // Form & modal states
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingGift, setEditingGift] = React.useState<Gift | null>(null);
  const [form, setForm] = React.useState<GiftFormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);

  // Delete modal states
  const [deletingGift, setDeletingGift] = React.useState<Gift | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Toggling thank-you state per gift
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  // 1. Load user weddings
  React.useEffect(() => {
    let cancelled = false;
    setLoadingWeddings(true);

    listWeddings()
      .then((data) => {
        if (cancelled) return;
        setWeddings(data);
        if (data.length > 0) {
          setSelectedWeddingId(data[0].id);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          window.location.assign("/auth/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Không thể tải danh sách thiệp cưới.");
      })
      .finally(() => {
        if (!cancelled) setLoadingWeddings(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeWedding = React.useMemo(() => {
    return weddings.find((w) => w.id === selectedWeddingId) ?? null;
  }, [weddings, selectedWeddingId]);

  // 2. Load gifts and guests when active wedding changes
  const loadGiftsAndGuests = React.useCallback(async () => {
    if (!activeWedding) return;

    if (activeWedding.plan === "free") {
      setIsPlanLocked(true);
      return;
    }

    setIsPlanLocked(false);
    setLoadingData(true);
    setError(null);

    try {
      const [giftsRes, guestsRes] = await Promise.all([
        listGifts(activeWedding.id),
        listGuests(activeWedding.id).catch(() => []),
      ]);
      setGifts(giftsRes.items);
      setTotals(giftsRes.totals);
      setGuests(guestsRes);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.assign("/auth/login");
        return;
      }
      if (err instanceof ApiError && (err.code === "PLAN_LIMIT" || err.status === 403)) {
        setIsPlanLocked(true);
        return;
      }
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu sổ mừng.");
    } finally {
      setLoadingData(false);
    }
  }, [activeWedding]);

  React.useEffect(() => {
    loadGiftsAndGuests();
  }, [loadGiftsAndGuests]);

  const openAddModal = () => {
    setEditingGift(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setModalOpen(true);
  };

  const openEditModal = (gift: Gift) => {
    setEditingGift(gift);
    setForm({
      giverName: gift.giverName,
      amountStr: formatDots(gift.amountVnd),
      method: gift.method,
      note: gift.note ?? "",
      guestId: gift.guestId,
    });
    setFieldErrors({});
    setModalOpen(true);
  };

  const handleGuestSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setForm((p) => ({ ...p, guestId: null }));
      return;
    }
    const found = guests.find((g) => g.id === selectedId);
    if (found) {
      setForm((p) => ({
        ...p,
        guestId: found.id,
        giverName: found.name,
      }));
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseDots(e.target.value);
    setForm((p) => ({
      ...p,
      amountStr: num > 0 ? formatDots(num) : e.target.value.replace(/[^\d]/g, ""),
    }));
    if (fieldErrors.amount) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.amount;
        return next;
      });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWedding) return;

    const errors: Record<string, string> = {};
    const trimmedName = form.giverName.trim();
    if (!trimmedName) {
      errors.giverName = "Vui lòng nhập tên người mừng.";
    } else if (trimmedName.length > 100) {
      errors.giverName = "Tên người mừng tối đa 100 ký tự.";
    }

    const amountNum = parseDots(form.amountStr);
    if (!form.amountStr.trim() || amountNum < 0) {
      errors.amount = "Vui lòng nhập số tiền hợp lệ.";
    } else if (amountNum > MAX_GIFT_AMOUNT) {
      errors.amount = "Số tiền tối đa 100 tỷ VNĐ.";
    }

    if (form.note.length > 300) {
      errors.note = "Ghi chú tối đa 300 ký tự.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      if (editingGift) {
        const updated = await updateGift(activeWedding.id, editingGift.id, {
          giverName: trimmedName,
          amountVnd: amountNum,
          method: form.method,
          note: form.note.trim() || null,
          guestId: form.guestId,
        });

        setGifts((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
        showToast(`Đã cập nhật khoản mừng của "${updated.giverName}"`, "success");
      } else {
        const created = await createGift(activeWedding.id, {
          giverName: trimmedName,
          amountVnd: amountNum,
          method: form.method,
          note: form.note.trim() || null,
          guestId: form.guestId,
        });

        setGifts((prev) => [created, ...prev]);
        setTotals((prev) => ({
          ...prev,
          totalVnd: prev.totalVnd + created.amountVnd,
          count: prev.count + 1,
          unthankedCount: prev.unthankedCount + 1,
        }));
        showToast(`Đã thêm khoản mừng từ "${created.giverName}"`, "success");
      }
      setModalOpen(false);
      // Reload totals to ensure 100% server sync
      listGifts(activeWedding.id).then((res) => {
        setGifts(res.items);
        setTotals(res.totals);
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setModalOpen(false);
        window.location.assign("/auth/login");
        return;
      }
      if (err instanceof ApiError && err.code === "PLAN_LIMIT") {
        setFieldErrors({
          _form: "Tính năng Sổ mừng yêu cầu gói Standard hoặc Pro. Vui lòng nâng cấp gói.",
        });
        return;
      }
      setFieldErrors({
        _form: err instanceof Error ? err.message : "Không thể lưu khoản mừng.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleThanked = async (gift: Gift) => {
    if (!activeWedding || togglingId === gift.id) return;
    setTogglingId(gift.id);

    const willBeThanked = !gift.thankedAt;
    try {
      const updated = await updateGift(activeWedding.id, gift.id, {
        thanked: willBeThanked,
      });

      setGifts((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      setTotals((prev) => ({
        ...prev,
        unthankedCount: willBeThanked
          ? Math.max(0, prev.unthankedCount - 1)
          : prev.unthankedCount + 1,
      }));
      showToast(
        willBeThanked
          ? `Đã ghi nhận cảm ơn "${gift.giverName}"`
          : `Đã chuyển "${gift.giverName}" về chưa cảm ơn`,
        "success",
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.assign("/auth/login");
        return;
      }
      showToast(
        err instanceof Error ? err.message : "Không thể cập nhật trạng thái cảm ơn.",
        "error",
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!activeWedding || !deletingGift) return;
    setDeleting(true);
    try {
      await deleteGift(activeWedding.id, deletingGift.id);
      setGifts((prev) => prev.filter((g) => g.id !== deletingGift.id));
      setTotals((prev) => ({
        ...prev,
        totalVnd: Math.max(0, prev.totalVnd - deletingGift.amountVnd),
        count: Math.max(0, prev.count - 1),
        unthankedCount: deletingGift.thankedAt
          ? prev.unthankedCount
          : Math.max(0, prev.unthankedCount - 1),
      }));
      showToast(`Đã xóa khoản mừng của "${deletingGift.giverName}"`, "success");
      setDeletingGift(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setDeletingGift(null);
        window.location.assign("/auth/login");
        return;
      }
      showToast(err instanceof Error ? err.message : "Không thể xóa khoản mừng.", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Loading initial weddings
  if (loadingWeddings) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // No weddings created
  if (weddings.length === 0) {
    return (
      <Card className="p-10 text-center">
        <BookOpen className="mx-auto h-12 w-12 text-accent-text" />
        <h2 className="mt-4 font-display text-2xl font-semibold text-fg">
          Chưa có thiệp cưới nào
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
          Bạn cần tạo một thiệp cưới trước để bắt đầu sử dụng sổ mừng điện tử.
        </p>
        <Link href="/dashboard" className="mt-5 inline-block">
          <Button variant="primary">Về Dashboard tạo thiệp</Button>
        </Link>
      </Card>
    );
  }

  // Plan gating: Free users see locked state with "Nâng cấp Pro"
  if (isPlanLocked || (activeWedding && activeWedding.plan === "free")) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-fg sm:text-3xl">
              Sổ mừng cưới
            </h1>
            <p className="mt-1 text-xs text-fg-muted sm:text-sm">
              Theo dõi và quản lý tiền mừng cưới minh bạch, chính xác.
            </p>
          </div>

          {weddings.length > 1 && (
            <div className="flex items-center gap-2">
              <label htmlFor="wedding-picker" className="text-xs text-fg-muted">
                Thiệp cưới:
              </label>
              <select
                id="wedding-picker"
                value={selectedWeddingId ?? ""}
                onChange={(e) => setSelectedWeddingId(e.target.value)}
                className="h-9 rounded-lg border border-border bg-surface px-3 text-xs text-fg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {weddings.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.slug} ({getPlanLabel(w.plan)})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <Card className="p-8 text-center sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/40 bg-accent-soft text-accent-text">
            <Lock className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-semibold text-fg">
            Tính năng dành cho gói Standard và Pro
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-fg-muted">
            Sổ mừng cưới giúp bạn ghi chép mọi khoản mừng quà từ bạn bè, người thân, phân
            loại tiền mặt hoặc chuyển khoản và đánh dấu trạng thái đã cảm ơn.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/#bang-gia">
              <Button variant="primary" size="lg">
                Nâng cấp Standard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-fg sm:text-3xl">
            Sổ mừng cưới
          </h1>
          <p className="mt-1 text-xs text-fg-muted sm:text-sm">
            Ghi chép và theo dõi quà mừng cho thiệp{" "}
            <strong className="text-fg">{activeWedding?.slug}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {weddings.length > 1 && (
            <select
              value={selectedWeddingId ?? ""}
              onChange={(e) => setSelectedWeddingId(e.target.value)}
              aria-label="Chọn thiệp cưới"
              className="h-9 rounded-lg border border-border bg-surface px-3 text-xs text-fg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {weddings.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.slug} ({getPlanLabel(w.plan)})
                </option>
              ))}
            </select>
          )}

          <Button
            variant="outline"
            size="sm"
            disabled
            title="Tính năng xuất file Excel sắp ra mắt"
            className="cursor-not-allowed opacity-75"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Xuất Excel</span>
            <span className="ml-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-fg">
              Pro
            </span>
            <span className="text-[10px] text-fg-muted">(Sắp có)</span>
          </Button>

          <Button variant="primary" size="sm" onClick={openAddModal}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Thêm khoản mừng</span>
          </Button>
        </div>
      </div>

      {/* Summary bar from GET response totals */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="flex items-center justify-between p-4 sm:p-5">
          <div>
            <p className="text-xs font-medium text-fg-muted">Tổng số tiền</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-accent-text sm:text-3xl">
              {formatDots(totals.totalVnd)} đ
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-accent/35 bg-accent-soft text-accent-text">
            <Banknote className="h-6 w-6" aria-hidden="true" />
          </div>
        </Card>

        <Card className="flex items-center justify-between p-4 sm:p-5">
          <div>
            <p className="text-xs font-medium text-fg-muted">Tổng số lượt mừng</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-fg sm:text-3xl">
              {totals.count} lượt
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface text-fg-muted">
            <Users className="h-6 w-6" aria-hidden="true" />
          </div>
        </Card>

        <Card className="flex items-center justify-between p-4 sm:p-5">
          <div>
            <p className="text-xs font-medium text-fg-muted">Chưa cảm ơn</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-fg sm:text-3xl">
              {totals.unthankedCount} lượt
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface text-fg-muted">
            <Clock className="h-6 w-6" aria-hidden="true" />
          </div>
        </Card>
      </div>

      {/* Main Content: Table on desktop, Stacked cards on mobile (<640px) */}
      {loadingData ? (
        <Card className="space-y-3 p-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-14 w-full" />
          ))}
        </Card>
      ) : error ? (
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto h-9 w-9 text-danger-fg" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-fg">{error}</p>
          <Button variant="outline" className="mt-4" onClick={loadGiftsAndGuests}>
            Thử lại
          </Button>
        </Card>
      ) : gifts.length === 0 ? (
        <Card className="p-10 text-center sm:p-14">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/35 bg-accent-soft text-accent-text">
            <Banknote className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="mt-4 font-display text-xl font-semibold text-fg">
            Chưa có khoản mừng nào
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-fg-muted">
            Chưa có khoản mừng nào. Thêm khoản mừng đầu tiên khi khách gửi quà.
          </p>
          <Button variant="primary" className="mt-5" onClick={openAddModal}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Thêm khoản mừng</span>
          </Button>
        </Card>
      ) : (
        <>
          {/* Desktop Table (hidden below 640px) */}
          <Card className="hidden overflow-hidden sm:block">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-muted text-xs font-semibold uppercase tracking-wide text-fg-muted">
                    <th className="whitespace-nowrap px-4 py-3">Người mừng</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right">Số tiền</th>
                    <th className="whitespace-nowrap px-4 py-3">Hình thức</th>
                    <th className="px-4 py-3">Ghi chú</th>
                    <th className="whitespace-nowrap px-4 py-3">Ngày ghi</th>
                    <th className="whitespace-nowrap px-4 py-3 text-center">Đã cảm ơn</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/80">
                  {gifts.map((gift) => {
                    const isThanked = Boolean(gift.thankedAt);
                    return (
                      <tr key={gift.id} className="hover:bg-surface-muted/45">
                        <td className="px-4 py-3.5 font-medium text-fg">
                          {gift.giverName}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-right font-display font-semibold tabular-nums text-accent-text">
                          {formatDots(gift.amountVnd)} đ
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <span className="inline-flex rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs text-fg">
                            {METHOD_LABELS[gift.method]}
                          </span>
                        </td>
                        <td className="max-w-[200px] truncate px-4 py-3.5 text-xs text-fg-muted" title={gift.note ?? ""}>
                          {gift.note || "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-xs text-fg-muted">
                          {formatDateTimeVi(gift.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleThanked(gift)}
                            disabled={togglingId === gift.id}
                            className={cn(
                              "inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                              isThanked
                                ? "border-success-border bg-success-bg text-success-fg hover:opacity-80"
                                : "border-neutral-border bg-neutral-bg text-neutral-fg hover:border-accent hover:text-fg",
                            )}
                            title={isThanked ? "Nhấn để chuyển về chưa cảm ơn" : "Nhấn để đánh dấu đã cảm ơn"}
                          >
                            {isThanked ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Đã cảm ơn</span>
                              </>
                            ) : (
                              <span>Chưa cảm ơn</span>
                            )}
                          </button>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditModal(gift)}
                              aria-label={`Sửa khoản mừng của ${gift.giverName}`}
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingGift(gift)}
                              aria-label={`Xóa khoản mừng của ${gift.giverName}`}
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

          {/* Stacked Cards for Mobile (screen < 640px) */}
          <div className="space-y-3 sm:hidden">
            {gifts.map((gift) => {
              const isThanked = Boolean(gift.thankedAt);
              return (
                <Card key={gift.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-fg">{gift.giverName}</p>
                      <span className="mt-1 inline-block rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] text-fg-muted">
                        {METHOD_LABELS[gift.method]}
                      </span>
                    </div>
                    <p className="font-display text-lg font-bold tabular-nums text-accent-text">
                      {formatDots(gift.amountVnd)} đ
                    </p>
                  </div>

                  {gift.note && (
                    <p className="rounded-lg bg-surface-muted p-2 text-xs text-fg-muted">
                      {gift.note}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-fg-muted">
                    <span>{formatDateTimeVi(gift.createdAt)}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleThanked(gift)}
                      disabled={togglingId === gift.id}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                        isThanked
                          ? "border-success-border bg-success-bg text-success-fg"
                          : "border-neutral-border bg-neutral-bg text-neutral-fg",
                      )}
                    >
                      {isThanked ? (
                        <>
                          <Check className="h-3 w-3" />
                          <span>Đã cảm ơn</span>
                        </>
                      ) : (
                        <span>Chưa cảm ơn</span>
                      )}
                    </button>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-border/70 pt-2.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(gift)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Sửa</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingGift(gift)}
                      className="text-danger-fg hover:bg-danger-bg"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Xóa</span>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Modal Thêm / Sửa khoản mừng */}
      <Dialog
        open={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        title={editingGift ? "Chỉnh sửa khoản mừng" : "Thêm khoản mừng mới"}
        description="Ghi nhận thông tin người mừng, số tiền và hình thức trao quà."
        className="max-w-md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
          {guests.length > 0 && !editingGift && (
            <div>
              <label htmlFor="guest-picker-select" className="mb-1 block text-xs font-semibold text-fg">
                Chọn từ danh sách khách mời (tùy chọn)
              </label>
              <select
                id="guest-picker-select"
                value={form.guestId ?? ""}
                onChange={handleGuestSelect}
                disabled={submitting}
                className="h-10 w-full rounded-xl border border-border bg-bg px-3 text-xs text-fg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">-- Nhập tên tự do hoặc chọn từ danh sách --</option>
                {guests.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Input
              label="Tên người mừng *"
              value={form.giverName}
              onChange={(e) => setForm((p) => ({ ...p, giverName: e.target.value }))}
              placeholder="Ví dụ: Anh Tuấn / Gia đình bác Hùng"
              maxLength={100}
              error={fieldErrors.giverName}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="gift-amount-input" className="mb-1 block text-xs font-semibold text-fg">
              Số tiền (VNĐ) *
            </label>
            <div className="relative">
              <input
                id="gift-amount-input"
                type="text"
                inputMode="numeric"
                value={form.amountStr}
                onChange={handleAmountChange}
                placeholder="500.000"
                className="h-10 w-full rounded-xl border border-border bg-bg pr-10 pl-3.5 text-sm tabular-nums text-fg placeholder:text-fg-muted/70 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium text-fg-muted">
                đ
              </span>
            </div>
            {fieldErrors.amount && (
              <p role="alert" className="mt-1 text-xs text-danger-fg">
                {fieldErrors.amount}
              </p>
            )}
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-semibold text-fg">
              Hình thức trao quà
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(["cash", "bank", "other"] as GiftMethod[]).map((m) => {
                const active = form.method === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, method: m }))}
                    className={cn(
                      "h-9 cursor-pointer rounded-lg border text-xs font-medium transition-colors",
                      active
                        ? "border-accent bg-accent font-semibold text-accent-fg"
                        : "border-border bg-surface text-fg-muted hover:bg-surface-muted hover:text-fg",
                    )}
                  >
                    {METHOD_LABELS[m]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Textarea
              label="Ghi chú (tùy chọn)"
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              placeholder="Ví dụ: Mừng tại bàn / chuyển khoản kèm lời chúc..."
              maxLength={300}
              rows={2}
              error={fieldErrors.note}
            />
          </div>

          {fieldErrors._form && (
            <p role="alert" className="rounded-xl border border-danger-border bg-danger-bg p-3 text-xs text-danger-fg">
              {fieldErrors._form}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {editingGift ? "Lưu thay đổi" : "Thêm khoản mừng"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal xác nhận xóa khoản mừng */}
      <Dialog
        open={Boolean(deletingGift)}
        onClose={() => !deleting && setDeletingGift(null)}
        title="Xác nhận xóa khoản mừng"
        description={
          deletingGift
            ? `Bạn có chắc muốn xóa khoản mừng "${formatDots(deletingGift.amountVnd)} đ" của "${deletingGift.giverName}"?`
            : undefined
        }
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => setDeletingGift(null)}
            disabled={deleting}
          >
            Hủy
          </Button>
          <Button
            variant="danger"
            loading={deleting}
            onClick={handleConfirmDelete}
          >
            Xóa khoản mừng
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

