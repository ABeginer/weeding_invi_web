"use client";

import * as React from "react";
import Link from "next/link";
import {
  ExternalLink,
  ImagePlus,
  LayoutGrid,
  Loader2,
  Pencil,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react";
import { getPlanLabel } from "@/config/plans";
import { compressImage } from "@/lib/image/compress";
import {
  formatDateTime,
  getOpsTemplates,
  updateOpsTemplate,
  uploadOpsTemplateCover,
  type OpsTemplateItem,
} from "@/lib/ops-api";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

const PLAN_LABELS: Record<string, string> = {
  free: getPlanLabel("free"),
  pro: getPlanLabel("pro"),
  vip: getPlanLabel("vip"),
};

export default function OpsTemplatesPage() {
  const { showToast } = useToast();
  const [items, setItems] = React.useState<OpsTemplateItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [needsMigration, setNeedsMigration] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const [editing, setEditing] = React.useState<OpsTemplateItem | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editTitle, setEditTitle] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);

  const [uploadingId, setUploadingId] = React.useState<string | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const coverInputRefs = React.useRef<Record<string, HTMLInputElement | null>>(
    {},
  );

  const load = React.useCallback(async () => {
    try {
      const result = await getOpsTemplates();
      setItems(result.items);
      setNeedsMigration(result.needsMigration);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không tải được danh sách mẫu.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) =>
      [item.name, item.displayTitle ?? "", item.ritual ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [items, query]);

  const openEdit = (item: OpsTemplateItem) => {
    setEditing(item);
    setEditName(item.name);
    setEditTitle(item.displayTitle ?? "");
    setEditError(null);
  };

  const saveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;

    const name = editName.trim();
    const displayTitle = editTitle.trim();
    if (name.length < 2 || name.length > 80) {
      setEditError("Tên thiết kế cần từ 2 đến 80 ký tự.");
      return;
    }
    if (displayTitle.length > 0 && (displayTitle.length < 2 || displayTitle.length > 80)) {
      setEditError("Title hiển thị cho khách cần từ 2 đến 80 ký tự.");
      return;
    }

    setSaving(true);
    setEditError(null);
    try {
      const result = await updateOpsTemplate(editing.id, {
        name,
        ...(needsMigration ? {} : { displayTitle: displayTitle || null }),
      });
      setItems((previous) =>
        previous.map((item) =>
          item.id === editing.id
            ? {
                ...item,
                name: result.item.name,
                displayTitle: result.item.displayTitle,
              }
            : item,
        ),
      );
      setEditing(null);
      showToast("Đã cập nhật mẫu thiết kế", "success");
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Không lưu được thay đổi.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCoverFile = async (
    item: OpsTemplateItem,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadError(null);
    setUploadingId(item.id);
    try {
      const compressed = await compressImage(file, "banner");
      if (compressed.contentType !== "image/webp") {
        throw new Error(
          "Trình duyệt không xuất được ảnh WebP. Hãy dùng Chrome/Edge hoặc chọn ảnh PNG/WebP khác.",
        );
      }
      const result = await uploadOpsTemplateCover(item.id, compressed.blob, {
        width: compressed.width,
        height: compressed.height,
      });
      setItems((previous) =>
        previous.map((row) =>
          row.id === item.id ? { ...row, coverUrl: result.url } : row,
        ),
      );
      showToast("Đã cập nhật ảnh bìa", "success");
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Không tải được ảnh bìa.",
      );
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-text sm:text-3xl">
          Template
        </h1>
        <p className="mt-1 text-xs text-text-muted sm:text-sm">
          Các mẫu thiết kế đã publish và đang chạy trên production. Đổi tên thiết
          kế, title khách hàng thấy và ảnh bìa cho từng mẫu.
        </p>
      </div>

      {needsMigration && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-accent/50 bg-accent-soft px-4 py-3 text-xs text-text"
        >
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            CSDL chưa có cột <code>display_title</code>. Chạy{" "}
            <code>supabase/migration_v16_ops_roles_template_meta.sql</code> để
            sửa title hiển thị cho khách. Hiện vẫn sửa được tên thiết kế và ảnh
            bìa.
          </span>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo tên thiết kế, title, nghi lễ..."
            aria-label="Tìm mẫu thiết kế"
            className="min-h-[44px] w-full rounded-xl border border-border bg-surface pr-4 pl-10 text-sm text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">
            {filtered.length}/{items.length} mẫu
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setLoading(true);
              setError(null);
              void load();
            }}
            disabled={loading}
          >
            <RefreshCw
              className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"}
              aria-hidden="true"
            />
            <span>Tải lại</span>
          </Button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-fg"
        >
          {error}
        </div>
      )}
      {uploadError && (
        <div
          role="alert"
          className="rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-fg"
        >
          {uploadError}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface py-16 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Đang tải mẫu thiết kế…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center">
          <LayoutGrid
            className="mx-auto h-8 w-8 text-text-muted"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-semibold text-text">
            {items.length === 0
              ? "Chưa có mẫu nào được publish"
              : "Không tìm thấy mẫu phù hợp"}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {items.length === 0
              ? "Publish một mẫu trong Thiết kế mẫu để mẫu đó xuất hiện ở đây."
              : "Thử từ khoá khác hoặc xoá bộ lọc tìm kiếm."}
          </p>
          {items.length === 0 && (
            <Link
              href="/ops/designer"
              className="mt-4 inline-flex h-9 items-center rounded-full bg-accent px-4 text-xs font-semibold text-accent-fg"
            >
              Mở Thiết kế mẫu
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const title = item.displayTitle ?? item.name;
            const isUploading = uploadingId === item.id;
            return (
              <li
                key={item.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface-alt">
                  {item.coverUrl ? (
                    <img
                      src={item.coverUrl}
                      alt={`Ảnh bìa mẫu ${title}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-accent-soft to-surface-alt text-text-muted">
                      <LayoutGrid className="h-8 w-8" aria-hidden="true" />
                      <span className="text-[11px]">Chưa có ảnh bìa</span>
                    </div>
                  )}

                  <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full border border-border bg-surface/90 px-2 py-0.5 text-[10px] font-semibold text-text">
                      {PLAN_LABELS[item.plan] ?? item.plan}
                    </span>
                    <span className="rounded-full border border-border bg-surface/90 px-2 py-0.5 text-[10px] font-semibold text-text-muted">
                      v{item.version}
                    </span>
                  </div>

                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-bg/70">
                      <Loader2
                        className="h-6 w-6 animate-spin text-accent-text"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-semibold text-text">
                      {title}
                    </p>
                    {item.displayTitle && (
                      <p className="truncate text-[11px] text-text-muted">
                        Thiết kế: {item.name}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-text-muted">
                      {item.ritual ? `${item.ritual} · ` : ""}
                      {item.usageCount > 0
                        ? `${item.usageCount} thiệp đang dùng`
                        : "Chưa có thiệp dùng"}
                      {" · "}
                      Cập nhật {formatDateTime(item.updatedAt)}
                    </p>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(item)}
                      disabled={isUploading}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Sửa</span>
                    </Button>

                    <input
                      ref={(element) => {
                        coverInputRefs.current[item.id] = element;
                      }}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic,.heic,.heif"
                      className="hidden"
                      onChange={(event) => void handleCoverFile(item, event)}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUploading}
                      onClick={() => coverInputRefs.current[item.id]?.click()}
                    >
                      <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Ảnh bìa</span>
                    </Button>

                    <Link
                      href={`/ops/designer/${item.id}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text transition-colors hover:border-accent/60 hover:bg-surface-muted hover:text-accent-text"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Canvas</span>
                    </Link>
                    <a
                      href={`/mau/designer/${item.id}?v=${item.version}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text transition-colors hover:border-accent/60 hover:bg-surface-muted hover:text-accent-text"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Xem mẫu</span>
                    </a>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={Boolean(editing)}
        onClose={() => !saving && setEditing(null)}
        title="Sửa mẫu thiết kế"
        description="Tên thiết kế dùng nội bộ trong ops; title là tên khách hàng thấy khi chọn mẫu. Ảnh bìa dùng cho danh sách mẫu."
      >
        <form onSubmit={saveEdit} className="space-y-3">
          <Input
            label="Tên thiết kế (nội bộ) *"
            value={editName}
            onChange={(event) => setEditName(event.target.value)}
            maxLength={80}
            placeholder="Ví dụ: Đào Phấn"
          />
          <Input
            label="Title hiển thị cho khách hàng"
            value={editTitle}
            onChange={(event) => setEditTitle(event.target.value)}
            maxLength={80}
            disabled={needsMigration}
            hint={
              needsMigration
                ? "Cần chạy migration_v16 để bật trường này."
                : "Để trống để dùng tên thiết kế."
            }
            placeholder="Ví dụ: Đào Phấn — Lễ Vu Quy"
          />
          {editError && (
            <p role="alert" className="text-xs text-danger-fg">
              {editError}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(null)}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
