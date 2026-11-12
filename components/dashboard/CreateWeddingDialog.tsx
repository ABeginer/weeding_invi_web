"use client";

import * as React from "react";
import { ApiError, createWedding } from "@/lib/api";
import type { Wedding } from "@/lib/types";
import { validateWeddingSlug, WEDDING_TEMPLATES } from "@/lib/wedding-slug";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

interface CreateWeddingDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (wedding: Wedding) => void;
}

export function CreateWeddingDialog({
  open,
  onClose,
  onCreated,
}: CreateWeddingDialogProps) {
  const { showToast } = useToast();
  const [slug, setSlug] = React.useState("");
  const [templateId, setTemplateId] = React.useState<string>(WEDDING_TEMPLATES[0].id);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setSlug("");
      setTemplateId(WEDDING_TEMPLATES[0].id);
      setSubmitError(null);
    }
  }, [open]);

  const slugValidation = React.useMemo(() => {
    if (!slug) return null;
    return validateWeddingSlug(slug);
  }, [slug]);

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubmitError(null);
    setSlug(e.target.value.toLowerCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const check = validateWeddingSlug(slug);
    if (!check.valid) {
      setSubmitError(check.error ?? "Đường dẫn thiệp không hợp lệ.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createWedding({
        slug: check.slug,
        templateId,
      });
      showToast("Đã tạo thiệp cưới mới", "success");
      onCreated(created);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onClose();
        window.location.assign("/auth/login");
        return;
      }
      setSubmitError(
        err instanceof Error ? err.message : "Không thể tạo thiệp cưới mới.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Tạo thiệp cưới mới"
      description="Chọn mẫu thiệp và đường dẫn công khai (/w/<slug>) cho thiệp của bạn."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="template-select" className="block text-sm font-medium text-fg">
            Mẫu giao diện
          </label>
          <select
            id="template-select"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            disabled={submitting}
            className="flex h-11 w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-sm text-fg focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {WEDDING_TEMPLATES.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Đường dẫn thiệp (slug)"
          placeholder="vi-du: minh-anh-2027"
          value={slug}
          onChange={handleSlugChange}
          maxLength={40}
          autoFocus
          error={
            submitError ??
            (slugValidation && !slugValidation.valid ? slugValidation.error : undefined)
          }
          hint={
            slugValidation?.valid
              ? `Link thiệp chung sẽ là: /w/${slugValidation.slug}`
              : "Chỉ dùng chữ thường a-z, số 0-9 và dấu gạch ngang (-), dài 3–40 ký tự."
          }
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            disabled={!slugValidation?.valid}
          >
            Tạo thiệp
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

