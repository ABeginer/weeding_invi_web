"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Copy, MessageSquareShare } from "lucide-react";
import { getGuestLimitMessage, getPlanLimits } from "@/config/plans";
import { buildInviteShareMessage } from "@/config/share-templates";
import { ApiError, buildGuestLink, createGuestsBulk } from "@/lib/api";
import {
  BULK_IMPORT_MAX_COUNT,
  parseBulkGuestInput,
} from "@/lib/guest-import";
import type { Guest, WeddingPlan } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

interface BulkImportDialogProps {
  weddingId: string;
  plan: WeddingPlan;
  currentGuestCount: number;
  existingGuestNames: string[];
  open: boolean;
  onClose: () => void;
  onCreated: (guests: Guest[]) => void;
}

async function copyText(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

export function BulkImportDialog({
  weddingId,
  plan,
  currentGuestCount,
  existingGuestNames,
  open,
  onClose,
  onCreated,
}: BulkImportDialogProps) {
  const { showToast } = useToast();
  const [rawText, setRawText] = React.useState("");
  const [step, setStep] = React.useState<"input" | "preview" | "result">("input");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [createdGuests, setCreatedGuests] = React.useState<Guest[]>([]);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setRawText("");
      setStep("input");
      setError(null);
      setCreatedGuests([]);
      setCopiedKey(null);
    }
  }, [open]);

  const parsed = React.useMemo(
    () => parseBulkGuestInput(rawText, existingGuestNames),
    [existingGuestNames, rawText],
  );

  const guestLimit = getPlanLimits(plan).guests;
  const remainingSlots =
    guestLimit !== null ? Math.max(0, guestLimit - currentGuestCount) : null;
  const exceedsLimit =
    remainingSlots !== null && parsed.validNames.length > remainingSlots;

  const handleGoPreview = () => {
    setError(null);
    if (parsed.tooLongNames.length > 0) {
      const sample = parsed.tooLongNames[0];
      setError(
        `Tên khách mời tối đa 100 ký tự ("${sample.slice(0, 24)}..."). Vui lòng rút gọn trước khi tiếp tục.`,
      );
      return;
    }
    if (parsed.validNames.length === 0) {
      setError(
        parsed.duplicateExistingSkipped > 0 || parsed.duplicateInPasteSkipped > 0
          ? "Không còn tên khách mới hợp lệ nào sau khi loại trùng."
          : "Vui lòng dán ít nhất một tên khách mời (mỗi dòng một tên hoặc dán cột từ Google Sheets / Excel).",
      );
      return;
    }
    if (parsed.validNames.length > BULK_IMPORT_MAX_COUNT) {
      setError(`Tối đa ${BULK_IMPORT_MAX_COUNT} tên mỗi lần nhập.`);
      return;
    }
    setStep("preview");
  };

  const handleConfirmImport = async () => {
    if (exceedsLimit) return;
    setError(null);
    setSubmitting(true);
    try {
      const created = await createGuestsBulk(weddingId, parsed.validNames);
      showToast(`Đã tạo ${created.length} link mời cá nhân`, "success");
      onCreated(created);
      setCreatedGuests(created);
      setStep("result");
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

  const handleCopyItem = async (
    guest: Guest,
    kind: "link" | "invite",
  ) => {
    const link = buildGuestLink(guest.slug);
    const text =
      kind === "invite" ? buildInviteShareMessage(guest.name, link) : link;
    await copyText(text);
    const key = `${kind}:${guest.id}`;
    setCopiedKey(key);
    showToast(
      kind === "invite"
        ? `Đã sao chép lời mời cho "${guest.name}"`
        : `Đã sao chép link thiệp cho "${guest.name}"`,
      "success",
    );
    window.setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 1800);
  };

  const skippedTotal =
    parsed.blankSkipped +
    parsed.duplicateInPasteSkipped +
    parsed.duplicateExistingSkipped;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Dán danh sách khách mời"
      description={
        step === "input"
          ? "Mỗi dòng một tên khách mời. Hỗ trợ dán trực tiếp từ Google Sheets hoặc Excel (chỉ lấy cột đầu tiên)."
          : step === "preview"
            ? `Xem trước ${parsed.validNames.length} khách mời mới sẽ được tạo link riêng.`
            : `Đã tạo ${createdGuests.length} khách mời kèm link riêng và mẫu lời mời sẵn.`
      }
      className="max-w-xl"
    >
      {step === "input" && (
        <div className="space-y-4">
          <Textarea
            label="Danh sách tên khách mời"
            placeholder={"Nguyễn Minh Anh\nAnh Tuấn & Chị Mai\nGia đình Cô Ba"}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={8}
            error={error ?? undefined}
            hint={`Hợp lệ: ${parsed.validNames.length} tên mới${
              skippedTotal > 0 ? ` · Tự bỏ qua: ${skippedTotal} dòng trống/trùng` : ""
            }.`}
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleGoPreview}>
              Xem trước ({parsed.validNames.length})
            </Button>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-bg/70 p-3 text-xs sm:grid-cols-4">
            <div>
              <span className="text-fg-muted">Hợp lệ sẽ tạo</span>
              <p className="mt-0.5 text-base font-semibold text-accent-text tabular-nums">
                {parsed.validNames.length}
              </p>
            </div>
            <div>
              <span className="text-fg-muted">Dòng trống</span>
              <p className="mt-0.5 text-base font-semibold text-fg tabular-nums">
                {parsed.blankSkipped}
              </p>
            </div>
            <div>
              <span className="text-fg-muted">Trùng khi dán</span>
              <p className="mt-0.5 text-base font-semibold text-fg tabular-nums">
                {parsed.duplicateInPasteSkipped}
              </p>
            </div>
            <div>
              <span className="text-fg-muted">Đã có trong thiệp</span>
              <p className="mt-0.5 text-base font-semibold text-fg tabular-nums">
                {parsed.duplicateExistingSkipped}
              </p>
            </div>
          </div>

          {exceedsLimit && remainingSlots !== null && (
            <div
              role="alert"
              className="rounded-xl border border-accent/40 bg-accent-soft px-3.5 py-2.5 text-xs text-text"
            >
              {getGuestLimitMessage(plan, remainingSlots)}{" "}
              <Link href="/#bang-gia" className="font-semibold text-text underline">
                Nâng cấp gói
              </Link>
              .
            </div>
          )}

          <div className="max-h-60 overflow-y-auto rounded-xl border border-border bg-bg/70 p-3">
            <ol className="space-y-1.5 text-sm">
              {parsed.validNames.map((name, idx) => (
                <li
                  key={`${name}-${idx}`}
                  className="flex items-center gap-2 rounded-lg border border-border/60 bg-surface px-3 py-2"
                >
                  <span className="w-6 text-xs font-medium text-fg-muted tabular-nums">
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

          <div className="flex flex-wrap justify-between gap-2">
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
                disabled={exceedsLimit}
                onClick={handleConfirmImport}
              >
                Xác nhận thêm {parsed.validNames.length} khách
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === "result" && (
        <div className="space-y-4">
          <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-border bg-bg/70 p-3">
            {createdGuests.map((guest) => {
              const linkCopied = copiedKey === `link:${guest.id}`;
              const inviteCopied = copiedKey === `invite:${guest.id}`;
              return (
                <div
                  key={guest.id}
                  className="flex flex-col gap-2 rounded-lg border border-border/70 bg-surface p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-fg">
                      {guest.name}
                    </p>
                    <p className="truncate text-xs text-fg-muted">
                      Đã sẵn sàng link thiệp riêng
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyItem(guest, "link")}
                    >
                      {linkCopied ? (
                        <Check className="h-3.5 w-3.5 text-success-fg" aria-hidden="true" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      <span>{linkCopied ? "Đã chép" : "Chép link"}</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCopyItem(guest, "invite")}
                    >
                      {inviteCopied ? (
                        <Check className="h-3.5 w-3.5 text-success-fg" aria-hidden="true" />
                      ) : (
                        <MessageSquareShare className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      <span>{inviteCopied ? "Đã chép" : "Chép lời mời"}</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end">
            <Button variant="primary" onClick={onClose}>
              Xong
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

