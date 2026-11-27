"use client";

import * as React from "react";
import {
  AlertCircle,
  AlertTriangle,
  Eye,
  MessageSquareHeart,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldQuestion,
  Trash2,
} from "lucide-react";
import {
  ApiError,
  deleteWishes,
  listWishes,
  setWishApprovalMode,
  setWishApproved,
} from "@/lib/api";
import type { Wish } from "@/lib/types";
import { cn, formatDateTimeVi } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

interface WishListProps {
  weddingId: string;
  /** Khu "Xác nhận / Lời chúc" đang bị ẩn trên thiệp. */
  wishesHidden: boolean;
  /** Bật hiển thị lời chúc lên thiệp. */
  showOnCard: boolean;
  approvalMode: "manual" | "auto";
  displayStyle: "box" | "overlay";
  onToggleShowOnCard: (next: boolean) => void;
  onApprovalModeChange: (mode: "manual" | "auto") => void;
  onDisplayStyleChange: (style: "box" | "overlay") => void;
}

export function WishList({
  weddingId,
  wishesHidden,
  showOnCard,
  approvalMode,
  displayStyle,
  onToggleShowOnCard,
  onApprovalModeChange,
  onDisplayStyleChange,
}: WishListProps) {
  const [wishes, setWishes] = React.useState<Wish[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [modeSaving, setModeSaving] = React.useState(false);
  const [autoWarningOpen, setAutoWarningOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = React.useState<string[] | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const featureEnabled = showOnCard && !wishesHidden;

  const loadWishes = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listWishes(weddingId);
      const sorted = [...data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setWishes(sorted);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.assign("/auth/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Không thể tải danh sách lời chúc.");
    } finally {
      setLoading(false);
    }
  }, [weddingId]);

  React.useEffect(() => {
    loadWishes();
  }, [loadWishes]);

  const filteredWishes = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return wishes;
    return wishes.filter(
      (w) =>
        w.name.toLowerCase().includes(keyword) ||
        w.message.toLowerCase().includes(keyword),
    );
  }, [wishes, search]);

  const approvedCount = wishes.filter((w) => w.approved).length;

  const toggleApproved = async (wish: Wish) => {
    if (!featureEnabled || savingId) return;
    const next = wish.approved !== true;
    setSavingId(wish.id);
    setWishes((prev) =>
      prev.map((item) => (item.id === wish.id ? { ...item, approved: next } : item)),
    );
    try {
      await setWishApproved(weddingId, wish.id, next);
    } catch {
      setWishes((prev) =>
        prev.map((item) =>
          item.id === wish.id ? { ...item, approved: wish.approved } : item,
        ),
      );
    } finally {
      setSavingId(null);
    }
  };

  const confirmAutoApprove = async () => {
    setModeSaving(true);
    try {
      await setWishApprovalMode(weddingId, "auto");
      onApprovalModeChange("auto");
      setAutoWarningOpen(false);
      await loadWishes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể bật duyệt tự động.");
    } finally {
      setModeSaving(false);
    }
  };

  const toggleSelected = (wishId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(wishId)) next.delete(wishId);
      else next.add(wishId);
      return next;
    });
  };

  const runDelete = async () => {
    if (!confirmDelete || confirmDelete.length === 0) return;
    setDeleting(true);
    try {
      await deleteWishes(weddingId, confirmDelete);
      const removed = new Set(confirmDelete);
      setWishes((prev) => prev.filter((wish) => !removed.has(wish.id)));
      setSelected((prev) => {
        const next = new Set(prev);
        for (const id of removed) next.delete(id);
        return next;
      });
      setConfirmDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xoá lời chúc.");
    } finally {
      setDeleting(false);
    }
  };

  const switchToManual = async () => {
    setModeSaving(true);
    try {
      await setWishApprovalMode(weddingId, "manual");
      onApprovalModeChange("manual");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể chuyển về duyệt tay.");
    } finally {
      setModeSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-fg">
            Lời chúc từ khách mời
          </h2>
          <p className="text-xs text-fg-muted sm:text-sm">
            {wishes.length} lời chúc · {approvedCount} đang hiện trên thiệp
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadWishes}
          disabled={loading}
          className="self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Làm mới</span>
        </Button>
      </div>

      {/* Bật/tắt hiển thị lời chúc + chế độ duyệt */}
      <Card className="space-y-3 p-4">
        <label
          className={cn(
            "flex items-start justify-between gap-4",
            wishesHidden && "cursor-not-allowed opacity-60",
          )}
        >
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-fg">
              <Eye className="h-4 w-4 text-accent-text" aria-hidden="true" />
              Hiển thị lời chúc trên thiệp
            </span>
            <span className="mt-0.5 block text-[11px] leading-relaxed text-fg-muted">
              {wishesHidden
                ? "Phần “Lời chúc / Xác nhận” đang tắt trên thiệp — bật lại phần đó trước."
                : "Dải lời chúc chạy ngang trong khung lời chúc của thiệp, chỉ hiện những lời chúc được duyệt."}
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={featureEnabled}
            aria-label="Hiển thị lời chúc trên thiệp"
            disabled={wishesHidden}
            onClick={() => onToggleShowOnCard(!showOnCard)}
            className={cn(
              "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
              featureEnabled ? "bg-accent" : "bg-border",
              wishesHidden && "cursor-not-allowed",
            )}
          >
            <span
              className={cn(
                "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
                featureEnabled ? "translate-x-5" : "translate-x-0.5",
              )}
            />
          </button>
        </label>

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <span className="text-xs font-medium text-fg">Kiểu hiển thị:</span>
          <div className="flex rounded-full border border-border p-0.5">
            {(
              [
                ["box", "Cuối thiệp"],
                ["overlay", "Overlay trên thiệp"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                disabled={!featureEnabled}
                onClick={() => onDisplayStyleChange(value)}
                aria-pressed={displayStyle === value}
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-semibold transition-colors",
                  displayStyle === value
                    ? "bg-accent text-white"
                    : "text-fg-muted hover:text-fg",
                  !featureEnabled && "cursor-not-allowed opacity-50",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <span className="text-xs font-medium text-fg">Duyệt lời chúc lên thiệp:</span>
          <div className="flex rounded-full border border-border p-0.5">
            <button
              type="button"
              disabled={!featureEnabled || modeSaving}
              onClick={switchToManual}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors",
                approvalMode === "manual"
                  ? "bg-accent text-white"
                  : "text-fg-muted hover:text-fg",
                !featureEnabled && "cursor-not-allowed opacity-50",
              )}
            >
              <ShieldQuestion className="h-3.5 w-3.5" aria-hidden="true" />
              Duyệt tay
            </button>
            <button
              type="button"
              disabled={!featureEnabled || modeSaving}
              onClick={() => setAutoWarningOpen(true)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors",
                approvalMode === "auto"
                  ? "bg-accent text-white"
                  : "text-fg-muted hover:text-fg",
                !featureEnabled && "cursor-not-allowed opacity-50",
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Duyệt tự động
            </button>
          </div>
        </div>
      </Card>

      {wishes.length > 0 && (
        <Card className="p-3 sm:p-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-fg-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên người gửi hoặc nội dung lời chúc..."
              aria-label="Tìm lời chúc"
              className="h-10 w-full rounded-xl border border-border bg-bg pr-3.5 pl-10 text-sm text-fg placeholder:text-fg-muted/70 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            />
          </div>
        </Card>
      )}

      {selected.size > 0 && (
        <Card className="flex flex-wrap items-center justify-between gap-2 border-accent/40 bg-accent-soft/30 p-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-fg">
            <span className="font-semibold">Đã chọn {selected.size} lời chúc</span>
            <button
              type="button"
              onClick={() => setSelected(new Set(filteredWishes.map((w) => w.id)))}
              className="underline underline-offset-2 hover:text-accent-text"
            >
              Chọn tất cả
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="underline underline-offset-2 hover:text-accent-text"
            >
              Bỏ chọn
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmDelete(Array.from(selected))}
            className="border-danger-border text-danger-fg hover:bg-danger-bg"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Xoá đã chọn</span>
          </Button>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} className="space-y-3 p-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-12 w-full" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto h-9 w-9 text-danger-fg" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-fg">{error}</p>
          <Button variant="outline" className="mt-4" onClick={loadWishes}>
            Thử lại
          </Button>
        </Card>
      ) : wishes.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/35 bg-accent-soft text-accent-text">
            <MessageSquareHeart className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="mt-4 font-display text-xl font-semibold text-fg">
            Chưa có lời chúc nào
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-fg-muted">
            Lời chúc khách gửi qua thiệp mời riêng và trang thiệp chung sẽ xuất hiện tại đây.
          </p>
        </Card>
      ) : filteredWishes.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-fg-muted">
            Không tìm thấy lời chúc phù hợp với từ khóa.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredWishes.map((wish) => {
            const isPersonal = wish.guestId !== null;
            const approved = wish.approved === true;
            return (
              <Card
                key={wish.id}
                className={cn(
                  "p-4 transition-colors sm:p-5",
                  approved && featureEnabled && "border-accent/45 bg-accent-soft/25",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected.has(wish.id)}
                      onChange={() => toggleSelected(wish.id)}
                      aria-label={`Chọn lời chúc của ${wish.name}`}
                      className="h-4 w-4 rounded border-border accent-accent"
                    />
                    <span className="font-semibold text-fg">{wish.name}</span>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                        isPersonal
                          ? "border-success-border bg-success-bg text-success-fg"
                          : "border-border bg-surface-muted text-fg-muted",
                      )}
                    >
                      {isPersonal ? "Thiệp cá nhân" : "Trang chung"}
                    </span>
                    {approved && (
                      <span className="rounded-full border border-accent/40 bg-accent-soft px-2.5 py-0.5 text-[11px] font-medium text-accent-text">
                        Trên thiệp
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <time dateTime={wish.createdAt} className="text-xs text-fg-muted">
                      {formatDateTimeVi(wish.createdAt)}
                    </time>

                    <button
                      type="button"
                      onClick={() => toggleApproved(wish)}
                      disabled={!featureEnabled || savingId === wish.id}
                      aria-pressed={approved}
                      title={
                        featureEnabled
                          ? "Hiển thị lời chúc trên thiệp"
                          : "Bật “Hiển thị lời chúc trên thiệp” để dùng nút này"
                      }
                      className={cn(
                        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[11px] font-semibold transition-all duration-200",
                        approved
                          ? "border-accent bg-accent text-white"
                          : "border-border bg-bg text-fg-muted",
                        featureEnabled
                          ? "hover:scale-[1.03] hover:border-accent hover:text-accent-text"
                          : "cursor-not-allowed opacity-40",
                        approved && featureEnabled && "hover:text-white",
                      )}
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      {approved ? "Đang hiện trên thiệp" : "Hiện trên thiệp"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmDelete([wish.id])}
                      aria-label="Xoá lời chúc"
                      title="Xoá lời chúc"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-bg text-fg-muted transition-colors hover:border-danger-border hover:bg-danger-bg hover:text-danger-fg"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <p className="mt-2.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-fg">
                  {wish.message}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      {/* Popup xác nhận xoá lời chúc */}
      {confirmDelete && confirmDelete.length > 0 && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-wish-title"
          onClick={() => (deleting ? undefined : setConfirmDelete(null))}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-bg text-danger-fg">
                <Trash2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 id="delete-wish-title" className="text-base font-semibold text-fg">
                  Xoá {confirmDelete.length} lời chúc?
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                  Lời chúc sẽ bị xoá vĩnh viễn khỏi thiệp và khỏi danh sách này. Không
                  thể hoàn tác.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
              >
                Trở lại
              </Button>
              <Button
                onClick={runDelete}
                disabled={deleting}
                className="bg-danger-fg text-white hover:opacity-90"
              >
                {deleting ? "Đang xoá..." : "Xoá vĩnh viễn"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Popup cảnh báo duyệt tự động */}
      {autoWarningOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auto-approve-title"
          onClick={() => (modeSaving ? undefined : setAutoWarningOpen(false))}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-bg text-danger-fg">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 id="auto-approve-title" className="text-base font-semibold text-fg">
                  Duyệt tự động lời chúc
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                  Xin hết sức chú ý, duyệt tự động có thể để lọt những lời chúc không
                  mong muốn lên trên thiệp cho những ai có link thiệp có thể thấy được.
                </p>
                <p className="mt-2 text-[11px] text-fg-muted">
                  Tất cả {wishes.length} lời chúc hiện có sẽ được đưa lên thiệp, và các
                  lời chúc gửi sau này cũng tự động hiển thị.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setAutoWarningOpen(false)}
                disabled={modeSaving}
              >
                Trở lại
              </Button>
              <Button onClick={confirmAutoApprove} disabled={modeSaving}>
                {modeSaving ? "Đang duyệt..." : "Vẫn tiếp tục"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
