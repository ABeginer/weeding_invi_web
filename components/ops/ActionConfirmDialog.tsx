"use client";

import * as React from "react";
import { AlertCircle, AlertTriangle, Loader2, X } from "lucide-react";

interface ActionConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  warningNotice?: string;
  details?: { label: string; value: React.ReactNode }[];
  confirmLabel?: string;
  confirmVariant?: "default" | "danger";
  isSubmitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
}

export function ActionConfirmDialog({
  isOpen,
  title,
  description,
  warningNotice,
  details,
  confirmLabel = "Xác nhận",
  confirmVariant = "default",
  isSubmitting = false,
  error = null,
  onClose,
  onConfirm,
}: ActionConfirmDialogProps) {
  const [reason, setReason] = React.useState("");
  const titleId = React.useId();

  React.useEffect(() => {
    if (isOpen) {
      setReason("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const trimmed = reason.trim();
  const isReasonValid = trimmed.length >= 5 && trimmed.length <= 300;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReasonValid || isSubmitting) return;
    onConfirm(trimmed);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-bg/80 backdrop-blur-xs"
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-surface p-5 text-text shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
          <h3 id={titleId} className="font-display text-lg font-semibold text-text sm:text-xl">
            {title}
          </h3>
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
          {description && (
            <p className="text-xs leading-relaxed text-text-muted sm:text-sm">
              {description}
            </p>
          )}

          {/* Details list (old vs new values, etc.) */}
          {details && details.length > 0 && (
            <dl className="space-y-2 rounded-xl border border-border bg-surface-alt p-3.5 text-xs sm:text-sm">
              {details.map((d, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2">
                  <dt className="text-text-muted">{d.label}</dt>
                  <dd className="font-medium text-text">{d.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {/* Warning banner */}
          {warningNotice && (
            <div className="flex items-start gap-2.5 rounded-xl border border-soon-border bg-soon-bg p-3 text-xs leading-relaxed text-soon-fg">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold">Cảnh báo:</p>
                <p>{warningNotice}</p>
              </div>
            </div>
          )}

          {/* Error notice */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-danger-border bg-danger-bg p-3 text-xs text-danger-fg">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Reason input field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="action-reason"
                className="text-xs font-semibold text-text"
              >
                Lý do thực hiện <span className="text-danger-fg">*</span>
              </label>
              <span className="text-[11px] text-text-muted">
                {trimmed.length}/300 ký tự (tối thiểu 5)
              </span>
            </div>
            <textarea
              id="action-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do thực hiện thao tác (tối thiểu 5 ký tự)..."
              disabled={isSubmitting}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs sm:text-sm text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:opacity-50"
            />
            {trimmed.length > 0 && trimmed.length < 5 && (
              <p className="text-[11px] text-danger-fg">
                Lý do phải có ít nhất 5 ký tự để kích hoạt nút xác nhận.
              </p>
            )}
          </div>

          {/* Buttons */}
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
              disabled={!isReasonValid || isSubmitting}
              className={`inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-lg px-5 text-xs font-semibold shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                confirmVariant === "danger"
                  ? "bg-danger-bg text-danger-fg border border-danger-border hover:opacity-90"
                  : "bg-accent text-accent-fg hover:bg-accent-hover"
              }`}
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{confirmLabel}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

