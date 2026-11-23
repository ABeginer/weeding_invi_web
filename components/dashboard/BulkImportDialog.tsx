"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Copy, MessageSquareShare, Trash2, Users, AlertTriangle } from "lucide-react";
import { getGuestLimitMessage, getPlanLimits } from "@/config/plans";
import { buildInviteShareMessage } from "@/config/share-templates";
import { ApiError, buildGuestLink, createGuestsBulk } from "@/lib/api";
import {
  BULK_IMPORT_MAX_COUNT,
  parseBulkGuestInput,
  type ParsedGuestItem,
} from "@/lib/guest-import";
import type { Guest, WeddingEvent, WeddingPlan } from "@/lib/types";
import type { RelationshipGroup } from "@/lib/salutation-engine";
import { formatWeddingDateParts } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

interface BulkImportDialogProps {
  weddingId: string;
  plan: WeddingPlan;
  currentGuestCount: number;
  existingGuestNames: string[];
  events: WeddingEvent[];
  open: boolean;
  onClose: () => void;
  onCreated: (guests: Guest[]) => void;
}

async function copyText(value: string): Promise<void> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return;
    }
    throw new Error("Clipboard API unavailable");
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

const ROLE_OPTIONS: { value: RelationshipGroup; label: string }[] = [
  { value: "close_friend", label: "Bạn thân" },
  { value: "peer_formal", label: "Bạn bè / Đồng nghiệp" },
  { value: "elder", label: "Cô / Chú / Họ hàng" },
  { value: "family", label: "Gia đình" },
];

export function BulkImportDialog({
  weddingId,
  plan,
  currentGuestCount,
  existingGuestNames,
  events,
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
  const [selectedEventIds, setSelectedEventIds] = React.useState<string[]>([]);

  // Preview interactive state
  const [items, setItems] = React.useState<ParsedGuestItem[]>([]);
  const [selectedRowIds, setSelectedRowIds] = React.useState<string[]>([]);
  const [bulkRole, setBulkRole] = React.useState<RelationshipGroup>("peer_formal");

  React.useEffect(() => {
    if (open) {
      setRawText("");
      setStep("input");
      setError(null);
      setCreatedGuests([]);
      setCopiedKey(null);
      setSelectedEventIds([]);
      setItems([]);
      setSelectedRowIds([]);
      setBulkRole("peer_formal");
    }
  }, [open]);

  const parsed = React.useMemo(
    () => parseBulkGuestInput(rawText, existingGuestNames),
    [existingGuestNames, rawText],
  );

  const guestLimit = getPlanLimits(plan).guests;
  const remainingSlots =
    guestLimit !== null ? Math.max(0, guestLimit - currentGuestCount) : null;

  // Active items in preview
  const validItems = React.useMemo(
    () => items.filter((i) => !i.isTooLong && !i.isDuplicateExisting && !i.isDuplicateInPaste),
    [items],
  );

  const duplicateCount = React.useMemo(
    () => items.filter((i) => i.isDuplicateExisting || i.isDuplicateInPaste).length,
    [items],
  );

  const exceedsLimit =
    remainingSlots !== null && validItems.length > remainingSlots;

  const handleGoPreview = () => {
    setError(null);
    if (parsed.tooLongNames.length > 0) {
      const sample = parsed.tooLongNames[0];
      setError(
        `Tên khách mời tối đa 100 ký tự ("${sample.slice(0, 24)}..."). Vui lòng rút gọn trước khi tiếp tục.`,
      );
      return;
    }
    if (parsed.items.length === 0) {
      setError(
        "Vui lòng dán danh sách khách mời (hỗ trợ copy cột từ Google Sheets / Excel hoặc gõ mỗi dòng một tên).",
      );
      return;
    }
    if (parsed.items.length > BULK_IMPORT_MAX_COUNT) {
      setError(`Tối đa ${BULK_IMPORT_MAX_COUNT} tên mỗi lần nhập.`);
      return;
    }

    setItems(parsed.items);
    setSelectedRowIds([]);
    setStep("preview");
  };

  // Bulk role assignments
  const handleApplyRoleToEmpty = () => {
    setItems((prev) =>
      prev.map((item) =>
        !item.relationshipGroup ? { ...item, relationshipGroup: bulkRole } : item,
      ),
    );
    showToast(`Đã áp dụng vai vế "${ROLE_OPTIONS.find((r) => r.value === bulkRole)?.label}" cho các dòng trống`, "success");
  };

  const handleApplyRoleToSelected = () => {
    if (selectedRowIds.length === 0) return;
    setItems((prev) =>
      prev.map((item) =>
        selectedRowIds.includes(item.id)
          ? { ...item, relationshipGroup: bulkRole }
          : item,
      ),
    );
    showToast(`Đã gán vai vế cho ${selectedRowIds.length} khách đã chọn`, "success");
  };

  // Remove duplicates with 1 click
  const handleRemoveDuplicates = () => {
    setItems((prev) => prev.filter((i) => !i.isDuplicateInPaste && !i.isDuplicateExisting));
    setSelectedRowIds((prev) =>
      prev.filter((id) => {
        const item = items.find((i) => i.id === id);
        return item && !item.isDuplicateInPaste && !item.isDuplicateExisting;
      }),
    );
    showToast("Đã xóa tất cả các dòng trùng lặp", "success");
  };

  const handleDeleteRow = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelectedRowIds((prev) => prev.filter((rowId) => rowId !== id));
  };

  const handleToggleSelectAll = () => {
    if (selectedRowIds.length === validItems.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(validItems.map((i) => i.id));
    }
  };

  const handleConfirmImport = async () => {
    if (exceedsLimit || validItems.length === 0) return;
    setError(null);
    setSubmitting(true);
    try {
      const itemsToCreate = validItems.map((item) => ({
        name: item.name,
        relationshipGroup: item.relationshipGroup,
        tableNumber: item.tableNumber,
      }));

      const created = await createGuestsBulk(
        weddingId,
        itemsToCreate,
        selectedEventIds,
      );
      showToast(`Đã tạo thành công ${created.length} link mời cá nhân`, "success");
      onCreated(created);
      setCreatedGuests(created);
      setStep("result");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onClose();
        window.location.assign("/auth/login");
        return;
      }
      if (err instanceof ApiError && err.code === "PLAN_LIMIT") {
        setError(
          "Số lượng khách vượt quá giới hạn gói hiện tại. Vui lòng nâng cấp gói để nhập thêm khách.",
        );
        return;
      }
      setError(
        err instanceof Error ? err.message : "Không thể nhập danh sách khách mời.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyItem = async (guest: Guest, kind: "link" | "invite") => {
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Dán thông minh danh sách khách mời"
      description={
        step === "input"
          ? "Hỗ trợ dán cột từ Google Sheets / Excel (Tên, Vai vế, Bàn) hoặc gõ mỗi dòng một tên."
          : step === "preview"
            ? `Xem trước và gán vai vế hàng loạt cho danh sách khách mời.`
            : `Đã tạo ${createdGuests.length} khách mời kèm link riêng và mẫu lời mời sẵn.`
      }
      className="max-w-2xl"
    >
      {/* STEP 1: INPUT */}
      {step === "input" && (
        <div className="space-y-4">
          {events.length > 0 && (
            <div className="rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] p-3.5">
              <p className="text-xs font-semibold text-[#1F1D1A]">
                Bước 1 · Chọn buổi lễ được mời (tùy chọn)
              </p>
              <p className="mt-0.5 text-[11px] text-[#6B655E]">
                Danh sách này sẽ được gán vào các lễ đã chọn. Bỏ trống = khách thấy tất cả lễ.
              </p>
              <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                {events.map((evt) => {
                  const checked = selectedEventIds.includes(evt.id);
                  const parts = formatWeddingDateParts(evt.startsAt);
                  return (
                    <label
                      key={evt.id}
                      className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-[#E8E2D9] bg-white px-3 py-2 transition-colors hover:border-[#7A1C24]/30"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelectedEventIds((prev) =>
                            checked
                              ? prev.filter((id) => id !== evt.id)
                              : [...prev, evt.id],
                          )
                        }
                        className="mt-0.5 h-4 w-4 rounded border-[#E8E2D9] accent-[#7A1C24]"
                      />
                      <span className="min-w-0">
                        <span className="block text-xs font-medium text-[#1F1D1A] truncate">{evt.title}</span>
                        <span className="block text-[10px] text-[#6B655E]">
                          {parts.weekday} · {parts.dotDate}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Hướng dẫn trực quan dạng bảng Excel mini */}
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-[#1F1D1A]">
              Ví dụ định dạng các cột trong Excel / Google Sheets:
            </span>
            <div className="overflow-hidden rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] text-xs">
              <div className="grid grid-cols-3 border-b border-[#E8E2D9] bg-[#F4EFEA] px-3 py-2 font-semibold text-[#1F1D1A]">
                <span>Cột A: Tên khách *</span>
                <span>Cột B: Vai vế</span>
                <span>Cột C: Bàn (tùy chọn)</span>
              </div>
              <div className="divide-y divide-[#E8E2D9]/70 bg-white">
                <div className="grid grid-cols-3 px-3 py-1.5 text-[#1F1D1A]">
                  <span className="font-medium">Nguyễn Minh Anh</span>
                  <span className="text-[#6B655E]">Bạn thân</span>
                  <span className="text-[#8A6D3B]">Bàn 01</span>
                </div>
                <div className="grid grid-cols-3 px-3 py-1.5 text-[#1F1D1A]">
                  <span className="font-medium">Chú Bảy cùng Gia đình</span>
                  <span className="text-[#6B655E]">Cô / Chú</span>
                  <span className="text-[#8A6D3B]">Bàn 05</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-[#6B655E] italic">
              💡 Bôi đen các cột trong Excel/Google Sheets rồi bấm Ctrl+C và dán vào ô bên dưới.
            </p>
          </div>

          <Textarea
            label="Dán danh sách khách mời (từ Excel / Google Sheets)"
            placeholder={`Nguyễn Minh Anh\tBạn thân\nTrần Quang Huy\tĐồng nghiệp\tBàn 1\nBác Nguyễn Văn Ba\tHọ hàng\tBàn 2\nChị Mai & Anh Tuấn`}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={8}
            error={error ?? undefined}
            hint={`Đã phát hiện: ${parsed.items.length} dòng${
              parsed.items.length > 0 ? ` · Hợp lệ: ${parsed.validItems.length}` : ""
            }${parsed.blankSkipped > 0 ? ` · Bỏ qua ${parsed.blankSkipped} dòng trống` : ""}.`}
          />

          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={handleGoPreview}
              disabled={parsed.items.length === 0}
            >
              Tiếp tục: Xem trước &amp; Gán vai vế ({parsed.validItems.length})
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: INTERACTIVE PREVIEW & BULK ROLE ASSIGNMENT */}
      {step === "preview" && (
        <div className="space-y-4">
          {/* Header Summary Cards */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] p-3 text-xs">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#7A1C24]" />
              <span className="font-medium text-[#1F1D1A]">
                Đã nhận diện: <strong className="font-semibold text-[#7A1C24]">{validItems.length}</strong> khách mời hợp lệ
              </span>
            </div>

            {duplicateCount > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-[#E8CBA4] bg-[#FAF3E3] px-2.5 py-1 text-[#8A6D3B]">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>Có {duplicateCount} dòng trùng</span>
                <button
                  type="button"
                  onClick={handleRemoveDuplicates}
                  className="cursor-pointer font-semibold underline hover:text-[#5E141B]"
                >
                  Xóa dòng trùng
                </button>
              </div>
            )}
          </div>

          {/* Bulk Role Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-[#E8E2D9] bg-white p-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium text-[#1F1D1A]">Vai vế:</span>
              <select
                value={bulkRole}
                onChange={(e) => setBulkRole(e.target.value as RelationshipGroup)}
                className="h-8 rounded-lg border border-[#E8E2D9] bg-[#FAF8F5] px-2.5 text-xs font-medium text-[#1F1D1A] focus:border-[#7A1C24] focus:outline-none"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleApplyRoleToEmpty}
                className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-[#E8E2D9] bg-white px-2.5 text-xs font-medium text-[#1F1D1A] hover:bg-[#FAF8F5] active:scale-95 transition-all"
              >
                Gán cho tất cả dòng trống
              </button>

              <button
                type="button"
                onClick={handleApplyRoleToSelected}
                disabled={selectedRowIds.length === 0}
                className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-[#7A1C24] bg-[#7A1C24] px-2.5 text-xs font-medium text-white hover:bg-[#5E141B] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
              >
                Gán cho dòng đã chọn ({selectedRowIds.length})
              </button>
            </div>
          </div>

          {/* Tier Limit Notice */}
          {exceedsLimit && remainingSlots !== null && (
            <div
              role="alert"
              className="rounded-xl border border-[#8A6D3B]/40 bg-[#FAF3E3] px-3.5 py-2.5 text-xs text-[#8A6D3B]"
            >
              {getGuestLimitMessage(plan, remainingSlots)}{" "}
              <Link href="/#bang-gia" className="font-semibold underline">
                Nâng cấp gói Standard
              </Link>{" "}
              để thêm không giới hạn khách mời.
            </div>
          )}

          {/* Table Container */}
          <div className="max-h-72 overflow-y-auto rounded-xl border border-[#E8E2D9] bg-white">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 border-b border-[#E8E2D9] bg-[#FAF8F5] text-[#6B655E]">
                <tr>
                  <th className="w-9 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={
                        validItems.length > 0 &&
                        selectedRowIds.length === validItems.length
                      }
                      onChange={handleToggleSelectAll}
                      className="h-3.5 w-3.5 rounded border-[#E8E2D9] accent-[#7A1C24]"
                      aria-label="Chọn tất cả khách mời hợp lệ"
                    />
                  </th>
                  <th className="w-8 py-2.5 pr-2 font-medium">STT</th>
                  <th className="py-2.5 px-2 font-medium">Tên khách mời</th>
                  <th className="py-2.5 px-2 font-medium">Vai vế (Xưng hô)</th>
                  <th className="py-2.5 px-2 font-medium">Số bàn</th>
                  <th className="w-9 py-2.5 pr-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]/60">
                {items.map((item, idx) => {
                  const isChecked = selectedRowIds.includes(item.id);
                  const isDup = item.isDuplicateInPaste || item.isDuplicateExisting;

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isDup
                          ? "bg-[#FAF3E3]/80 hover:bg-[#FAF3E3]"
                          : isChecked
                            ? "bg-[#FAF8F5]"
                            : "hover:bg-[#FAF8F5]/50"
                      }`}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isDup || item.isTooLong}
                          onChange={() =>
                            setSelectedRowIds((prev) =>
                              isChecked
                                ? prev.filter((id) => id !== item.id)
                                : [...prev, item.id],
                            )
                          }
                          className="h-3.5 w-3.5 rounded border-[#E8E2D9] accent-[#7A1C24] disabled:opacity-30"
                        />
                      </td>
                      <td className="py-2 pr-2 font-mono text-[11px] text-[#6B655E]">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2">
                        <span
                          className={`font-medium ${
                            isDup
                              ? "text-[#8A6D3B]"
                              : item.isTooLong
                                ? "text-red-600 line-through"
                                : "text-[#1F1D1A]"
                          }`}
                        >
                          {item.name}
                        </span>
                        {item.isDuplicateExisting && (
                          <span className="ml-1.5 inline-block rounded bg-[#8A6D3B]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#8A6D3B]">
                            Đã có trong thiệp
                          </span>
                        )}
                        {item.isDuplicateInPaste && (
                          <span className="ml-1.5 inline-block rounded bg-[#8A6D3B]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#8A6D3B]">
                            Trùng trong danh sách
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        <select
                          value={item.relationshipGroup ?? ""}
                          disabled={isDup || item.isTooLong}
                          onChange={(e) => {
                            const val = e.target.value as RelationshipGroup | "";
                            setItems((prev) =>
                              prev.map((i) =>
                                i.id === item.id
                                  ? { ...i, relationshipGroup: val || null }
                                  : i,
                              ),
                            );
                          }}
                          className="h-7 w-full max-w-[170px] rounded-md border border-[#E8E2D9] bg-white px-2 text-[11px] text-[#1F1D1A] focus:border-[#7A1C24] focus:outline-none disabled:opacity-40"
                        >
                          <option value="">Chưa chọn vai vế</option>
                          {ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={item.tableNumber ?? ""}
                          placeholder="Số bàn..."
                          disabled={isDup || item.isTooLong}
                          onChange={(e) => {
                            const val = e.target.value;
                            setItems((prev) =>
                              prev.map((i) =>
                                i.id === item.id
                                  ? { ...i, tableNumber: val.trim() || null }
                                  : i,
                              ),
                            );
                          }}
                          className="h-7 w-20 rounded-md border border-[#E8E2D9] bg-white px-2 text-[11px] text-[#1F1D1A] focus:border-[#7A1C24] focus:outline-none disabled:opacity-40"
                        />
                      </td>
                      <td className="py-2 pr-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(item.id)}
                          aria-label={`Xóa dòng ${item.name}`}
                          className="cursor-pointer text-[#6B655E] hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {error && (
            <p className="text-xs text-red-600" role="alert">
              {error}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#E8E2D9]">
            <Button
              variant="outline"
              onClick={() => setStep("input")}
              disabled={submitting}
            >
              Quay lại sửa danh sách
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose} disabled={submitting}>
                Hủy
              </Button>
              <Button
                variant="primary"
                loading={submitting}
                disabled={exceedsLimit || validItems.length === 0}
                onClick={handleConfirmImport}
              >
                Xác nhận thêm {validItems.length} khách
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: RESULT */}
      {step === "result" && (
        <div className="space-y-4">
          <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] p-3">
            {createdGuests.map((guest) => {
              const linkCopied = copiedKey === `link:${guest.id}`;
              const inviteCopied = copiedKey === `invite:${guest.id}`;
              return (
                <div
                  key={guest.id}
                  className="flex flex-col gap-2 rounded-lg border border-[#E8E2D9] bg-white p-3 sm:flex-row sm:items-center sm:justify-between shadow-2xs"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#1F1D1A]">
                      {guest.name}
                    </p>
                    <p className="truncate text-xs text-[#6B655E]">
                      {guest.relationshipGroup
                        ? `Vai vế: ${ROLE_OPTIONS.find((r) => r.value === guest.relationshipGroup)?.label}`
                        : "Link thiệp riêng đã sẵn sàng"}
                      {guest.tableNumber ? ` · Bàn ${guest.tableNumber}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyItem(guest, "link")}
                    >
                      {linkCopied ? (
                        <Check className="h-3.5 w-3.5 text-[#2F6F4E]" aria-hidden="true" />
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
                        <Check className="h-3.5 w-3.5 text-[#2F6F4E]" aria-hidden="true" />
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
              Hoàn tất
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
