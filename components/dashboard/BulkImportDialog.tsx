"use client";

import * as React from "react";
import { ApiError, createGuestsBulk } from "@/lib/api";
import type { Guest } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

interface BulkImportDialogProps {
  weddingId: string;
  open: boolean;
  onClose: () => void;
  onCreated: (guests: Guest[]) => void;
}

export function BulkImportDialog({
  weddingId,
  open,
  onClose,
  onCreated,
}: BulkImportDialogProps) {
  const { showToast } = useToast();
  const [rawText, setRawText] = React.useState("");
  const [step, setStep] = React.useState<"input" | "preview">("input");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setRawText("");
      setStep("input");
      setError(null);
    }
  }, [open]);

  const parsedNames = React.useMemo(
    () =>
      rawText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
    [rawText],
  );

  const handleGoPreview = () => {
    setError(null);
    if (parsedNames.length === 0) {
      setError("Vui lòng nhập ít nhất một tên khách mời (mỗi dòng một tên).");
      return;
    }
    if (parsedNames.length > 500) {
      setError("Tối đa 500 tên mỗi lần nhập.");
      return;
    }
    const tooLong = parsedNames.find((n) => n.length > 100);
    if (tooLong) {
      setError(`Tên khách mời tối đa 100 ký tự ("${tooLong.slice(0, 24)}...").`);
      return;
    }
    setStep("preview");
  };

  const handleConfirmImport = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const created = await createGuestsBulk(weddingId, parsedNames);
      showToast(`Đã thêm ${created.length} khách mời`, "success");
      onCreated(created);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onClose();
        window.location.assign("/auth/login");
        return;
      }
      setError(
        err instanceof Error ? err.message : "Không thể nhập danh sách khách mời.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Nhập khách mời hàng loạt"
      description={
        step === "input"
          ? "Dán danh sách tên khách mời, mỗi dòng một tên."
          : `Xem trước ${parsedNames.length} khách mời sẽ được tạo link riêng.`
      }
      className="max-w-lg"
    >
      {step === "input" ? (
        <div className="space-y-4">
          <Textarea
            label="Danh sách tên khách mời"
            placeholder={"Nguyễn Minh Anh\nAnh Tuấn & Chị Mai\nGia đình Cô Ba"}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={7}
            error={error ?? undefined}
            hint={`Hiện có ${parsedNames.length} dòng hợp lệ.`}
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleGoPreview}>
              Xem trước ({parsedNames.length})
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="max-h-60 overflow-y-auto rounded-xl border border-border bg-bg/70 p-3">
            <ol className="space-y-1.5 text-sm">
              {parsedNames.map((name, idx) => (
                <li
                  key={`${name}-${idx}`}
                  className="flex items-center gap-2 rounded-lg border border-border/60 bg-surface px-3 py-2"
                >
                  <span className="w-6 text-xs font-medium text-fg-muted">
                    {idx + 1}.
                  </span>
                  <span className="font-medium text-fg">{name}</span>
                </li>
              ))}
            </ol>
          </div>

          {error && (
            <p className="text-xs text-danger-fg" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => setStep("input")}
              disabled={submitting}
            >
              Quay lại sửa
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose} disabled={submitting}>
                Hủy
              </Button>
              <Button
                variant="primary"
                loading={submitting}
                onClick={handleConfirmImport}
              >
                Xác nhận thêm {parsedNames.length} khách
              </Button>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}

