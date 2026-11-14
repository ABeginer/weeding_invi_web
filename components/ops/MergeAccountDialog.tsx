"use client";

import * as React from "react";
import { AlertCircle, AlertTriangle, Check, Loader2, Search, X } from "lucide-react";
import {
  formatDateTime,
  getOpsUsers,
  mergeOpsUser,
  type OpsUser,
  type OpsUserDetail,
} from "@/lib/ops-api";

interface MergeAccountDialogProps {
  isOpen: boolean;
  sourceUser: OpsUserDetail;
  onClose: () => void;
  onSuccess: (movedWeddings: number, movedIdentities: number, targetUserId: string) => void;
  onNotFound: () => void;
}

export function MergeAccountDialog({
  isOpen,
  sourceUser,
  onClose,
  onSuccess,
  onNotFound,
}: MergeAccountDialogProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<OpsUser[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [selectedTarget, setSelectedTarget] = React.useState<OpsUser | null>(null);

  const [reason, setReason] = React.useState("");
  const [confirmEmail, setConfirmEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [dialogError, setDialogError] = React.useState<string | null>(null);

  const titleId = React.useId();

  // Reset state when opening
  React.useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setDebouncedQuery("");
      setSearchResults([]);
      setSelectedTarget(null);
      setReason("");
      setConfirmEmail("");
      setDialogError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Debounce search query by 300ms
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch target candidates
  React.useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    getOpsUsers({ q: debouncedQuery, page: 1 })
      .then((res) => {
        if (cancelled) return;
        // Current user is excluded from results
        const filtered = (res.items || []).filter((u) => u.id !== sourceUser.id);
        setSearchResults(filtered);
      })
      .catch(() => {
        if (cancelled) return;
        setSearchResults([]);
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, sourceUser.id]);

  if (!isOpen) return null;

  const trimmedReason = reason.trim();
  const isReasonValid = trimmedReason.length >= 5 && trimmedReason.length <= 300;
  const isEmailMatched =
    confirmEmail.trim().toLowerCase() === sourceUser.email.trim().toLowerCase();
  const canSubmit = Boolean(selectedTarget && isReasonValid && isEmailMatched && !isSubmitting);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !selectedTarget) return;

    setIsSubmitting(true);
    setDialogError(null);

    try {
      const res = await mergeOpsUser(sourceUser.id, selectedTarget.id, trimmedReason);
      onSuccess(res.movedWeddings, res.movedIdentities, selectedTarget.id);
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string };
      if (errorObj?.code === "NOT_FOUND" || errorObj?.message === "Không tìm thấy tài khoản.") {
        onClose();
        onNotFound();
      } else if (
        errorObj?.code === "VALIDATION" ||
        errorObj?.message?.includes("Không thể gộp")
      ) {
        setDialogError(errorObj.message || "Không thể gộp một tài khoản với chính nó.");
      } else {
        setDialogError(errorObj?.message || "Đã xảy ra lỗi khi gộp tài khoản.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-bg/80 backdrop-blur-xs"
      />

      {/* Modal Dialog Body with inner scroll for mobile 390px */}
      <div className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface p-5 text-text shadow-2xl sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
          <div>
            <h3 id={titleId} className="font-display text-lg font-semibold text-text sm:text-xl">
              Gộp vào tài khoản khác
            </h3>
            <p className="mt-0.5 text-xs text-text-muted">
              Chuyển toàn bộ dữ liệu từ tài khoản hiện tại sang tài khoản đích.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng hộp thoại"
            className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-lg border border-border text-text-muted hover:border-accent hover:text-text disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Error alert inside dialog */}
          {dialogError && (
            <div className="flex items-center gap-2 rounded-xl border border-danger-border bg-danger-bg p-3 text-xs text-danger-fg">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{dialogError}</span>
            </div>
          )}

          {/* 1. Search field: Tìm tài khoản đích theo email */}
          <div className="space-y-1.5">
            <label htmlFor="merge-search-target" className="text-xs font-semibold text-text">
              1. Tìm tài khoản đích theo email <span className="text-danger-fg">*</span>
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                id="merge-search-target"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tài khoản đích theo email..."
                disabled={isSubmitting}
                className="min-h-[44px] w-full rounded-xl border border-border bg-surface pl-9 pr-4 text-xs sm:text-sm text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:opacity-50"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
                </div>
              )}
            </div>

            {/* Target search results */}
            {debouncedQuery && !selectedTarget && (
              <div className="mt-1 max-h-40 overflow-y-auto rounded-xl border border-border bg-surface-alt p-1.5 text-xs shadow-inner">
                {searchResults.length === 0 ? (
                  <p className="p-2 text-center text-text-muted">
                    {isSearching ? "Đang tìm..." : "Không tìm thấy tài khoản phù hợp."}
                  </p>
                ) : (
                  searchResults.map((target) => (
                    <button
                      key={target.id}
                      type="button"
                      onClick={() => {
                        setSelectedTarget(target);
                        setDialogError(null);
                      }}
                      className="flex w-full min-h-[44px] cursor-pointer items-center justify-between rounded-lg p-2.5 text-left text-text hover:bg-surface transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-text">{target.email}</div>
                        <div className="text-[11px] text-text-muted">
                          {target.weddingCount} thiệp · {target.identityCount ?? 1} cách đăng nhập · Tạo lúc {formatDateTime(target.createdAt)}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-md border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-accent-text">
                        Chọn
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}

            {selectedTarget && (
              <div className="flex items-center justify-between rounded-xl border border-success-border bg-success-bg p-2.5 text-xs text-success-fg">
                <div className="flex items-center gap-1.5 font-medium">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>Đã chọn: <strong className="font-semibold">{selectedTarget.email}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTarget(null)}
                  disabled={isSubmitting}
                  className="cursor-pointer text-[11px] font-semibold underline hover:opacity-80 disabled:opacity-50"
                >
                  Chọn tài khoản khác
                </button>
              </div>
            )}
          </div>

          {/* 2. Two cards side by side (stacks on mobile 390px) */}
          {selectedTarget && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Source account card */}
              <div className="rounded-xl border border-border bg-surface-alt p-3.5 text-xs leading-relaxed">
                <div className="font-semibold text-text border-b border-border pb-1.5 mb-2">
                  Tài khoản nguồn (hiện tại)
                </div>
                <div className="space-y-1">
                  <div>
                    <span className="text-text-muted">Email: </span>
                    <strong className="font-medium text-text break-all">{sourceUser.email}</strong>
                  </div>
                  <div>
                    <span className="text-text-muted">Số thiệp: </span>
                    <strong className="font-medium text-text">{sourceUser.weddings.length}</strong>
                  </div>
                  <div>
                    <span className="text-text-muted">Số cách đăng nhập: </span>
                    <strong className="font-medium text-text">{sourceUser.identities?.length ?? 1}</strong>
                  </div>
                  <div>
                    <span className="text-text-muted">Ngày tạo: </span>
                    <span className="text-text-muted">{formatDateTime(sourceUser.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Target account card */}
              <div className="rounded-xl border border-border bg-surface-alt p-3.5 text-xs leading-relaxed">
                <div className="font-semibold text-text border-b border-border pb-1.5 mb-2">
                  Tài khoản đích
                </div>
                <div className="space-y-1">
                  <div>
                    <span className="text-text-muted">Email: </span>
                    <strong className="font-medium text-text break-all">{selectedTarget.email}</strong>
                  </div>
                  <div>
                    <span className="text-text-muted">Số thiệp: </span>
                    <strong className="font-medium text-text">{selectedTarget.weddingCount}</strong>
                  </div>
                  <div>
                    <span className="text-text-muted">Số cách đăng nhập: </span>
                    <strong className="font-medium text-text">{selectedTarget.identityCount ?? 1}</strong>
                  </div>
                  <div>
                    <span className="text-text-muted">Ngày tạo: </span>
                    <span className="text-text-muted">{formatDateTime(selectedTarget.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Warning box in warning style of theme */}
          <div className="flex items-start gap-2.5 rounded-xl border border-soon-border bg-soon-bg p-3.5 text-xs leading-relaxed text-soon-fg">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold">Cảnh báo quan trọng:</p>
              <p>
                Mọi thiệp và cách đăng nhập của tài khoản nguồn sẽ được chuyển sang tài khoản đích. Tài khoản nguồn sẽ bị xóa. Thao tác này không hoàn tác được.
              </p>
            </div>
          </div>

          {/* 4. Reason textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="merge-reason" className="text-xs font-semibold text-text">
                4. Lý do gộp tài khoản <span className="text-danger-fg">*</span>
              </label>
              <span className="text-[11px] text-text-muted">
                {trimmedReason.length}/300 ký tự (tối thiểu 5)
              </span>
            </div>
            <textarea
              id="merge-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do thực hiện thao tác (tối thiểu 5 ký tự)..."
              disabled={isSubmitting}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs sm:text-sm text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:opacity-50"
            />
            {trimmedReason.length > 0 && trimmedReason.length < 5 && (
              <p className="text-[11px] text-danger-fg">
                Lý do phải có ít nhất 5 ký tự.
              </p>
            )}
          </div>

          {/* 5. Confirmation field */}
          <div className="space-y-1.5">
            <label htmlFor="merge-confirm-email" className="text-xs font-semibold text-text">
              5. Gõ email của tài khoản nguồn để xác nhận <span className="text-danger-fg">*</span>
            </label>
            <input
              id="merge-confirm-email"
              type="text"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder={`Gõ lại chính xác "${sourceUser.email}"`}
              disabled={isSubmitting}
              className="min-h-[44px] w-full rounded-xl border border-border bg-surface px-3 text-xs sm:text-sm text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:opacity-50"
            />
            {confirmEmail.length > 0 && !isEmailMatched && (
              <p className="text-[11px] text-danger-fg">
                Email xác nhận chưa khớp với email nguồn ({sourceUser.email}).
              </p>
            )}
          </div>

          {/* 6. Buttons: Hủy & Gộp tài khoản (warning token style, not red) */}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-lg border border-border px-4 text-xs font-medium text-text hover:bg-surface-alt disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-soon-border bg-soon-bg px-5 text-xs font-semibold text-soon-fg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Gộp tài khoản</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

