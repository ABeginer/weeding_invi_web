"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Copy,
  ListPlus,
  Pencil,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import {
  ApiError,
  buildGuestLink,
  deleteGuest,
  listGuests,
  updateGuest,
} from "@/lib/api";
import { Guest, GuestStatus } from "@/lib/types";
import { formatDateTimeVi } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { AddGuestDialog } from "./AddGuestDialog";
import { BulkImportDialog } from "./BulkImportDialog";
import { StatusBadge } from "./StatusBadge";

type StatusFilter = "all" | GuestStatus;

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "accepted", label: "Chấp nhận" },
  { value: "declined", label: "Từ chối" },
  { value: "pending", label: "Chưa phản hồi" },
];

export function GuestTable() {
  const router = useRouter();
  const { showToast } = useToast();

  const [guests, setGuests] = React.useState<Guest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");

  const [addOpen, setAddOpen] = React.useState(false);
  const [bulkOpen, setBulkOpen] = React.useState(false);

  const [editingGuest, setEditingGuest] = React.useState<Guest | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editSaving, setEditSaving] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);

  const [deletingGuest, setDeletingGuest] = React.useState<Guest | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const loadGuests = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listGuests();
      setGuests(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/admin/login");
        return;
      }
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách khách mời."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    loadGuests();
  }, [loadGuests]);

  const filteredGuests = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return guests.filter((guest) => {
      const matchesStatus =
        statusFilter === "all" || guest.status === statusFilter;
      const matchesQuery =
        !query || guest.name.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [guests, search, statusFilter]);

  const handleCopyLink = async (guest: Guest) => {
    const url = buildGuestLink(guest.slug);
    try {
      await navigator.clipboard.writeText(url);
      showToast("Đã sao chép", "success");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      showToast("Đã sao chép", "success");
    }
  };

  const openEdit = (guest: Guest) => {
    setEditingGuest(guest);
    setEditName(guest.name);
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuest) return;
    if (!editName.trim()) {
      setEditError("Tên khách mời không được để trống.");
      return;
    }
    setEditSaving(true);
    setEditError(null);
    try {
      const updated = await updateGuest(editingGuest.id, { name: editName });
      setGuests((prev) =>
        prev.map((g) => (g.id === updated.id ? updated : g))
      );
      showToast("Đã cập nhật tên khách mời", "success");
      setEditingGuest(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/admin/login");
        return;
      }
      setEditError(
        err instanceof Error ? err.message : "Không thể cập nhật khách mời."
      );
    } finally {
      setEditSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingGuest) return;
    setDeleteLoading(true);
    try {
      await deleteGuest(deletingGuest.id);
      setGuests((prev) => prev.filter((g) => g.id !== deletingGuest.id));
      showToast(`Đã xóa khách mời "${deletingGuest.name}"`, "info");
      setDeletingGuest(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/admin/login");
        return;
      }
      showToast(
        err instanceof Error ? err.message : "Không thể xóa khách mời.",
        "error"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Thanh tiêu đề & nút thêm */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-fg">
            Danh sách khách mời
          </h1>
          <p className="text-sm text-fg-muted">
            Quản lý thiệp cá nhân, sao chép link mời và theo dõi xác nhận tham dự.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <ListPlus className="h-4 w-4" aria-hidden="true" />
            <span>Nhập hàng loạt</span>
          </Button>
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            <span>Thêm khách</span>
          </Button>
        </div>
      </div>

      {/* Bộ lọc & tìm kiếm */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search
              className="pointer-events-none absolute top-3.5 left-3.5 h-4 w-4 text-fg-muted"
              aria-hidden="true"
            />
            <Input
              aria-label="Tìm kiếm khách mời theo tên"
              placeholder="Tìm theo tên khách mời..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div
            role="group"
            aria-label="Lọc theo trạng thái phản hồi"
            className="flex flex-wrap gap-1.5"
          >
            {FILTER_OPTIONS.map((opt) => {
              const active = statusFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatusFilter(opt.value)}
                  aria-pressed={active}
                  className={
                    active
                      ? "h-9 cursor-pointer rounded-xl bg-accent px-3.5 text-xs font-medium text-white shadow-xs"
                      : "h-9 cursor-pointer rounded-xl border border-border bg-bg px-3.5 text-xs font-medium text-fg-muted hover:bg-surface-muted hover:text-fg"
                  }
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Trạng thái đang tải */}
      {loading ? (
        <Card className="p-4 sm:p-6">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-6 w-28" />
                <Skeleton className="hidden h-6 w-32 sm:block" />
                <Skeleton className="h-8 w-36" />
              </div>
            ))}
          </div>
        </Card>
      ) : error ? (
        <Card className="p-8 text-center">
          <AlertCircle
            className="mx-auto h-9 w-9 text-danger-fg"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-medium text-fg">{error}</p>
          <Button variant="outline" className="mt-4" onClick={loadGuests}>
            Thử lại
          </Button>
        </Card>
      ) : filteredGuests.length === 0 ? (
        <Card className="p-10 text-center">
          <Users
            className="mx-auto h-9 w-9 text-fg-muted/70"
            aria-hidden="true"
          />
          <p className="mt-3 font-medium text-fg">
            {guests.length === 0
              ? "Chưa có khách mời nào trong danh sách"
              : "Không tìm thấy khách mời phù hợp"}
          </p>
          <p className="mt-1 text-sm text-fg-muted">
            {guests.length === 0
              ? "Hãy thêm khách mời đầu tiên để tạo link thiệp cá nhân."
              : "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái."}
          </p>
          {guests.length > 0 && (search || statusFilter !== "all") ? (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            >
              Xóa bộ lọc
            </Button>
          ) : null}
        </Card>
      ) : (
        <>
          {/* Bảng trên desktop / tablet */}
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="border-b border-border bg-surface-muted/70 text-xs uppercase tracking-wider text-fg-muted">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Tên</th>
                    <th className="px-5 py-3.5 font-semibold">Trạng thái</th>
                    <th className="px-5 py-3.5 font-semibold">Phản hồi lúc</th>
                    <th className="px-5 py-3.5 text-right font-semibold">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/80">
                  {filteredGuests.map((guest) => (
                    <tr
                      key={guest.id}
                      className="transition-colors hover:bg-surface-muted/35"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-fg">{guest.name}</p>
                        <p className="mt-0.5 text-xs text-fg-muted">
                          /m/{guest.slug}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={guest.status} />
                      </td>
                      <td className="px-5 py-4 text-fg-muted">
                        {formatDateTimeVi(guest.respondedAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleCopyLink(guest)}
                          >
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Sao chép link</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Sửa tên ${guest.name}`}
                            onClick={() => openEdit(guest)}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Xóa ${guest.name}`}
                            className="text-danger-fg hover:bg-danger-bg"
                            onClick={() => setDeletingGuest(guest)}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Dạng thẻ (card) trên điện thoại */}
          <div className="space-y-3 md:hidden">
            {filteredGuests.map((guest) => (
              <Card key={guest.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-fg">
                      {guest.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-fg-muted">
                      /m/{guest.slug}
                    </p>
                  </div>
                  <StatusBadge status={guest.status} />
                </div>

                <p className="mt-2.5 text-xs text-fg-muted">
                  Phản hồi lúc: {formatDateTimeVi(guest.respondedAt)}
                </p>

                <div className="mt-3.5 flex items-center gap-2 border-t border-border/80 pt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleCopyLink(guest)}
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Sao chép link</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Sửa tên ${guest.name}`}
                    onClick={() => openEdit(guest)}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Xóa ${guest.name}`}
                    className="text-danger-fg hover:bg-danger-bg"
                    onClick={() => setDeletingGuest(guest)}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Dialog thêm khách */}
      <AddGuestDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(created) => setGuests((prev) => [created, ...prev])}
      />

      {/* Dialog nhập hàng loạt */}
      <BulkImportDialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onCreated={(created) => setGuests((prev) => [...created, ...prev])}
      />

      {/* Dialog sửa tên khách */}
      <Dialog
        open={Boolean(editingGuest)}
        onClose={() => setEditingGuest(null)}
        title="Sửa tên khách mời"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <Input
            label="Tên khách mời"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            error={editError ?? undefined}
            maxLength={100}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingGuest(null)}
              disabled={editSaving}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" loading={editSaving}>
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Dialog xác nhận xóa */}
      <Dialog
        open={Boolean(deletingGuest)}
        onClose={() => setDeletingGuest(null)}
        title="Xác nhận xóa khách mời"
        description={
          deletingGuest
            ? `Bạn có chắc muốn xóa "${deletingGuest.name}" khỏi danh sách? Link thiệp cá nhân của khách này sẽ không còn hiệu lực.`
            : undefined
        }
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => setDeletingGuest(null)}
            disabled={deleteLoading}
          >
            Hủy
          </Button>
          <Button
            variant="danger"
            loading={deleteLoading}
            onClick={handleConfirmDelete}
          >
            Xóa khách mời
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

