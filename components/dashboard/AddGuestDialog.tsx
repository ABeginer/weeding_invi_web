"use client";

import * as React from "react";
import { ApiError, createGuest, setGuestEvents } from "@/lib/api";
import type { Guest, WeddingEvent } from "@/lib/types";
import { cn, formatWeddingDateParts } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

interface AddGuestDialogProps {
  weddingId: string;
  events?: WeddingEvent[];
  open: boolean;
  onClose: () => void;
  onCreated: (guest: Guest) => void;
}

const ROLE_PILLS = [
  { id: "close_friend", label: "Bạn thân", group: "close_friend" as const },
  { id: "coworker", label: "Đồng nghiệp", group: "peer_formal" as const },
  { id: "sibling", label: "Anh / Chị", group: "peer_formal" as const },
  { id: "elder", label: "Cô / Chú", group: "elder" as const },
  { id: "boss", label: "Sếp", group: "elder" as const },
  { id: "family", label: "Gia đình", group: "family" as const },
  { id: "vip_guest", label: "Khách quý", group: "elder" as const },
];

export function AddGuestDialog({
  weddingId,
  events,
  open,
  onClose,
  onCreated,
}: AddGuestDialogProps) {
  const { showToast } = useToast();
  const [name, setName] = React.useState("");
  const [selectedRole, setSelectedRole] = React.useState<string | null>(null);
  const [dietary, setDietary] = React.useState<"standard" | "vegetarian">("standard");
  const [tableNumber, setTableNumber] = React.useState("");
  const [selectedEventIds, setSelectedEventIds] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setName("");
      setSelectedRole(null);
      setDietary("standard");
      setTableNumber("");
      setSelectedEventIds([]);
      setError(null);
    }
  }, [open]);

  const toggleEvent = (eventId: string) => {
    setSelectedEventIds((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId],
    );
  };

  const selectAllEvents = () => {
    if (!events) return;
    setSelectedEventIds(events.map((e) => e.id));
  };

  const clearAllEvents = () => {
    setSelectedEventIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Vui lòng nhập tên khách mời.");
      return;
    }

    setSubmitting(true);
    try {
      const roleItem = ROLE_PILLS.find((r) => r.id === selectedRole);
      const relationshipGroup = roleItem ? roleItem.group : null;
      const trimmedTable = tableNumber.trim() || null;

      const created = await createGuest(weddingId, {
        name: trimmedName,
        relationshipGroup,
        tableNumber: trimmedTable,
        dietaryPreference: dietary,
      });

      if (selectedEventIds.length > 0) {
        try {
          const res = await setGuestEvents(weddingId, created.id, selectedEventIds);
          created.eventIds = res.eventIds;
        } catch (assignErr) {
          console.error("Failed to assign events to new guest", assignErr);
        }
      }
      showToast(`Đã thêm khách mời "${created.name}"`, "success");
      onCreated(created);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onClose();
        window.location.assign("/auth/login");
        return;
      }
      if (err instanceof ApiError && err.code === "PLAN_LIMIT") {
        setError(
          "Bạn đã đạt giới hạn khách mời của gói hiện tại. Vui lòng nâng cấp gói để thêm khách.",
        );
        return;
      }
      setError(err instanceof Error ? err.message : "Không thể thêm khách mời.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Thêm khách mời"
      description="Hệ thống sẽ tự tạo một link thiệp mang tên riêng cho khách mời này."
      className="max-w-md sm:max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Tên hiển thị trên thiệp *"
          placeholder="Ví dụ: Anh Minh & Chị Hoa"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error ?? undefined}
          maxLength={100}
          autoFocus
        />

        {/* Vai vế / Cách xưng hô pills */}
        <div>
          <label className="block text-xs font-medium text-[#1F1D1A] mb-1.5">
            Vai vế / Cách xưng hô (tùy chọn)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ROLE_PILLS.map((pill) => {
              const isSelected = selectedRole === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setSelectedRole(isSelected ? null : pill.id)}
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer",
                    isSelected
                      ? "border border-[#7A1C24] bg-[#7A1C24] text-white shadow-xs font-semibold"
                      : "border border-[#E8E2D9] bg-[#FAF8F5] text-[#6B655E] hover:border-[#7A1C24]/40 hover:text-[#1F1D1A]",
                  )}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Thực đơn & Số bàn */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#1F1D1A] mb-1.5">
              Thực đơn đãi tiệc
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5]">
              <button
                type="button"
                onClick={() => setDietary("standard")}
                className={cn(
                  "rounded-lg py-1.5 text-xs font-medium transition-all cursor-pointer text-center",
                  dietary === "standard"
                    ? "bg-white text-[#1F1D1A] shadow-xs font-semibold"
                    : "text-[#6B655E] hover:text-[#1F1D1A]",
                )}
              >
                🍖 Ăn mặn
              </button>
              <button
                type="button"
                onClick={() => setDietary("vegetarian")}
                className={cn(
                  "rounded-lg py-1.5 text-xs font-medium transition-all cursor-pointer text-center",
                  dietary === "vegetarian"
                    ? "bg-[#2F6F4E] text-white shadow-xs font-semibold"
                    : "text-[#6B655E] hover:text-[#1F1D1A]",
                )}
              >
                🥗 Ăn chay
              </button>
            </div>
          </div>

          <Input
            label="Số bàn tiệc (tùy chọn)"
            placeholder="Ví dụ: Bàn 08"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            maxLength={40}
          />
        </div>

        {events && events.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-fg">
                Lễ được mời tham dự
              </label>
              <div className="flex items-center gap-2 text-xs">
                {selectedEventIds.length < events.length ? (
                  <button
                    type="button"
                    onClick={selectAllEvents}
                    className="cursor-pointer text-accent-text hover:underline"
                  >
                    Chọn tất cả
                  </button>
                ) : null}
                {selectedEventIds.length > 0 ? (
                  <button
                    type="button"
                    onClick={clearAllEvents}
                    className="cursor-pointer text-fg-muted hover:text-fg hover:underline"
                  >
                    Bỏ chọn
                  </button>
                ) : null}
              </div>
            </div>

            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {events.map((evt) => {
                const checked = selectedEventIds.includes(evt.id);
                const dateParts = formatWeddingDateParts(evt.startsAt);
                return (
                  <label
                    key={evt.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-2.5 text-left transition-colors",
                      checked
                        ? "border-accent bg-accent-soft"
                        : "border-border bg-bg hover:border-accent/45",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleEvent(evt.id)}
                      className="mt-0.5 h-4 w-4 rounded border-border accent-accent"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-fg sm:text-sm">
                        {evt.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-fg-muted">
                        {dateParts.time} · {dateParts.dotDate}
                        {evt.venueName ? ` · ${evt.venueName}` : ""}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            <p className="text-[11px] text-fg-muted">
              {selectedEventIds.length > 0
                ? `Khách này sẽ chỉ thấy ${selectedEventIds.length} buổi lễ được chọn trên thiệp mời riêng.`
                : "Nếu không chọn lễ nào, khách sẽ thấy tất cả các lễ trên thiệp mời riêng."}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            Thêm khách
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
