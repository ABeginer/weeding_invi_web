"use client";

import * as React from "react";
import { ApiError, createGuest } from "@/lib/api";
import type { Guest } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

interface AddGuestDialogProps {
  weddingId: string;
  open: boolean;
  onClose: () => void;
  onCreated: (guest: Guest) => void;
}

export function AddGuestDialog({
  weddingId,
  open,
  onClose,
  onCreated,
}: AddGuestDialogProps) {
  const { showToast } = useToast();
  const [name, setName] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setName("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Vui lòng nhập tên khách mời.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createGuest(weddingId, name);
      showToast(`Đã thêm khách mời "${created.name}"`, "success");
      onCreated(created);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onClose();
        window.location.assign("/auth/login");
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
      description="Hệ thống sẽ tự tạo đường dẫn thiệp cá nhân (/m/<slug>) cho khách mời này."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Tên hiển thị trên thiệp"
          placeholder="Ví dụ: Anh Minh & Chị Hoa"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error ?? undefined}
          maxLength={100}
          autoFocus
        />

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

