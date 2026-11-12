"use client";

import * as React from "react";
import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import {
  ApiError,
  buildGuestLink,
  deleteGuest,
  listGuests,
  updateGuest,
} from "@/lib/api";
import type { Guest, GuestStatus, WeddingPlan } from "@/lib/types";
import { cn, formatDateTimeVi } from "@/lib/utils";
import { FREE_PLAN_MAX_GUESTS } from "@/lib/wedding-slug";
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

  const [editingGuest, setEditingGuest] = React.useState<Guest | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editError, setEditError] = React.useState<string | null>(null);
  const [savingEdit, setSavingEdit] = React.useState(false);

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

  const isFreePlan = plan === "free";
  const reachedGuestLimit = isFreePlan && !loading && guests.length >= FREE_PLAN_MAX_GUESTS;

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

  const openEditDialog = (guest: Guest) => {
    setEditingGuest(guest);
    setEditName(guest.name);
    setEditError(null);
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
        prev.map((item) => (item.id === updated.id ? updated : item)),
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-fg">Danh sách khách mời</h2>
          <p className="text-xs text-fg-muted sm:text-sm">
            {isFreePlan
              ? `Đang dùng ${guests.length}/${FREE_PLAN_MAX_GUESTS} khách mời (gói miễn phí).`
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
            <span>Nhập hàng loạt</span>
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

      {reachedGuestLimit && (
        <div className="rounded-xl border border-border bg-surface px-4 py-3 text-xs text-fg-muted sm:text-sm">
          Gói miễn phí giới hạn tối đa{" "}
          <strong className="font-semibold text-fg">
            {FREE_PLAN_MAX_GUESTS} khách mời
          </strong>
          . Xóa bớt khách cũ nếu muốn thêm khách mới.
        </div>
      )}

      <Card className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-fg-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên khách mời hoặc slug..."
              aria-label="Tìm khách mời"
              className="h-10 w-full rounded-xl border border-border bg-surface pr-3.5 pl-10 text-sm text-fg placeholder:text-fg-muted/70 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
                    "cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-accent bg-accent text-white"
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
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent-hover">
            <Users className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-fg">
            Chưa có khách mời nào
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-fg-muted">
            Thêm từng khách hoặc nhập danh sách hàng loạt để tạo link thiệp mời cá nhân{" "}
            <code className="rounded bg-surface-muted px-1 py-0.5 text-xs text-fg">
              /m/&lt;slug&gt;
            </code>
            .
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => setBulkOpen(true)}>
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span>Nhập hàng loạt</span>
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
                  <tr className="border-b border-border bg-surface-muted/60 text-xs font-semibold uppercase tracking-wide text-fg-muted">
                    <th className="px-4 py-3">Khách mời</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Phản hồi lúc</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/80">
                  {filteredGuests.map((guest) => {
                    const isCopied = copiedId === guest.id;
                    return (
                      <tr key={guest.id} className="hover:bg-bg/60">
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-fg">{guest.name}</div>
                          <div className="mt-0.5 text-xs text-fg-muted">
                            /m/{guest.slug}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={guest.status} />
                        </td>
                        <td className="px-4 py-3.5 text-xs text-fg-muted">
                          {formatDateTimeVi(guest.respondedAt)}
                        </td>
                        <td className="px-4 py-3.5">
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
                            <a
                              href={`/m/${guest.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Mở thiệp /m/${guest.slug}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg"
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
              return (
                <Card key={guest.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-fg">{guest.name}</p>
                      <p className="mt-0.5 truncate text-xs text-fg-muted">
                        /m/{guest.slug}
                      </p>
                    </div>
                    <StatusBadge status={guest.status} />
                  </div>

                  <p className="text-xs text-fg-muted">
                    Phản hồi lúc:{" "}
                    <span className="font-medium text-fg">
                      {formatDateTimeVi(guest.respondedAt)}
                    </span>
                  </p>

                  <div className="flex flex-wrap items-center gap-2 border-t border-border/70 pt-3">
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
                      <span>{isCopied ? "Đã chép" : "Sao chép link /m"}</span>
                    </Button>
                    <a
                      href={`/m/${guest.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Mở thiệp /m/${guest.slug}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-fg-muted hover:bg-surface-muted hover:text-fg"
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
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onCreated={(created) => {
          setGuests((prev) => [...created, ...prev]);
          onGuestsChanged?.();
        }}
      />

      <Dialog
        open={Boolean(editingGuest)}
        onClose={() => !savingEdit && setEditingGuest(null)}
        title="Sửa tên khách mời"
        description="Đường dẫn /m/<slug> sẽ giữ nguyên để không làm hỏng link đã gửi."
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
            ? `Bạn có chắc muốn xóa "${deletingGuest.name}"? Link /m/${deletingGuest.slug} sẽ không còn hoạt động.`
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
