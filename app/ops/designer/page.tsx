"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

interface DesignerTemplate {
  id: string;
  name: string;
  plan: "free" | "pro" | "vip";
  ritual: string | null;
  status: "draft" | "review" | "published" | "archived";
  version: number;
  updated_at: string;
}

const PLAN_LABELS: Record<DesignerTemplate["plan"], string> = {
  free: "Miễn phí",
  pro: "Pro",
  vip: "VIP",
};

const STATUS_LABELS: Record<DesignerTemplate["status"], string> = {
  draft: "Nháp",
  review: "Chờ duyệt",
  published: "Đã publish",
  archived: "Lưu trữ",
};

export default function DesignerTemplatesPage() {
  const [items, setItems] = React.useState<DesignerTemplate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [name, setName] = React.useState("");
  const [plan, setPlan] = React.useState<DesignerTemplate["plan"]>("free");
  const [ritual, setRitual] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ops/designer/templates");
      const body = (await res.json()) as { items?: DesignerTemplate[]; error?: string };
      if (!res.ok) throw new Error(body.error ?? "Không tải được danh sách mẫu.");
      setItems(body.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách mẫu.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/ops/designer/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), plan, ritual: ritual.trim() }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Không tạo được mẫu.");
      setName("");
      setRitual("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được mẫu.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-accent-text uppercase">
          Ops · Designer
        </p>
        <h1 className="font-display text-2xl font-semibold text-text">Mẫu thiệp thiết kế</h1>
        <p className="text-sm text-text-muted">
          Tạo mẫu mới, mỗi mẫu lưu layout JSON + ảnh nền webp. Canvas kéo thả sẽ được bổ sung
          ở bước tiếp theo.
        </p>
      </header>

      <form
        onSubmit={create}
        className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-[1fr_140px_160px_auto] sm:items-end"
      >
        <label className="block text-xs font-medium text-text">
          Tên mẫu
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            placeholder="Ví dụ: Vườn Ô Liu 02"
            className="mt-1 h-10 w-full rounded-xl border border-border bg-bg px-3 text-sm text-text outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-focus-ring"
          />
        </label>

        <label className="block text-xs font-medium text-text">
          Gói
          <select
            value={plan}
            onChange={(event) => setPlan(event.target.value as DesignerTemplate["plan"])}
            className="mt-1 h-10 w-full rounded-xl border border-border bg-bg px-2 text-sm text-text outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <option value="free">Miễn phí</option>
            <option value="pro">Pro</option>
            <option value="vip">VIP</option>
          </select>
        </label>

        <label className="block text-xs font-medium text-text">
          Nghi lễ (tuỳ chọn)
          <input
            value={ritual}
            onChange={(event) => setRitual(event.target.value)}
            maxLength={40}
            placeholder="Vu Quy…"
            className="mt-1 h-10 w-full rounded-xl border border-border bg-bg px-3 text-sm text-text outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-focus-ring"
          />
        </label>

        <button
          type="submit"
          disabled={creating || name.trim().length < 2}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-accent px-4 text-xs font-semibold text-accent-fg transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {creating ? "Đang tạo…" : "Tạo mẫu"}
        </button>
      </form>

      {error && (
        <div role="alert" className="rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-fg">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {loading ? (
          <p className="p-6 text-sm text-text-muted">Đang tải…</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-sm text-text-muted">Chưa có mẫu nào. Tạo mẫu đầu tiên ở trên.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-alt text-xs text-text-muted">
              <tr>
                <th className="px-4 py-2.5 font-medium">Tên mẫu</th>
                <th className="px-4 py-2.5 font-medium">Gói</th>
                <th className="px-4 py-2.5 font-medium">Nghi lễ</th>
                <th className="px-4 py-2.5 font-medium">Trạng thái</th>
                <th className="px-4 py-2.5 font-medium">Version</th>
                <th className="px-4 py-2.5 font-medium">Cập nhật</th>
                <th className="px-4 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium text-text">{item.name}</td>
                  <td className="px-4 py-3 text-text-muted">{PLAN_LABELS[item.plan]}</td>
                  <td className="px-4 py-3 text-text-muted">{item.ritual ?? "—"}</td>
                  <td className="px-4 py-3 text-text-muted">{STATUS_LABELS[item.status]}</td>
                  <td className="px-4 py-3 text-text-muted">v{item.version}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {new Date(item.updated_at).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/ops/designer/${item.id}`}
                      className="text-xs font-semibold text-accent-text underline underline-offset-4"
                    >
                      Mở canvas
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
