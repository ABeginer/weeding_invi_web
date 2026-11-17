"use client";

import * as React from "react";
import {
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCog,
} from "lucide-react";
import {
  deleteOpsRole,
  formatDateTime,
  getOpsRoles,
  upsertOpsRole,
  type OpsRoleMember,
} from "@/lib/ops-api";
import { OPS_ROLES, getOpsRoleLabel, type OpsRole } from "@/lib/ops-roles";
import { useOpsMe } from "@/components/ops/OpsRoleContext";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

export default function OpsRolesPage() {
  const { email: currentEmail } = useOpsMe();
  const { showToast } = useToast();
  const [items, setItems] = React.useState<OpsRoleMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [needsMigration, setNeedsMigration] = React.useState(false);
  const [envAdminCount, setEnvAdminCount] = React.useState(0);
  const [query, setQuery] = React.useState("");

  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<OpsRole>("designer");
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const [deleting, setDeleting] = React.useState<OpsRoleMember | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const result = await getOpsRoles();
      setItems(result.items);
      setNeedsMigration(result.needsMigration);
      setEnvAdminCount(result.envAdminCount);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không tải được danh sách phân quyền.",
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
    return items.filter((item) => item.email.includes(needle));
  }, [items, query]);

  const grant = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized)) {
      setFormError("Email không hợp lệ.");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await upsertOpsRole(normalized, role);
      setEmail("");
      await load();
      showToast(`Đã cấp quyền ${getOpsRoleLabel(role)} cho ${normalized}`, "success");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Không cấp được quyền.",
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    setError(null);
    try {
      await deleteOpsRole(deleting.email);
      setDeleting(null);
      await load();
      showToast(`Đã thu hồi quyền của ${deleting.email}`, "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thu hồi được quyền.");
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-text sm:text-3xl">
          Phân quyền ops
        </h1>
        <p className="mt-1 text-xs text-text-muted sm:text-sm">
          Cấp quyền <strong>Quản trị viên</strong> (toàn bộ ops) hoặc{" "}
          <strong>Designer</strong> (chỉ Template + Thiết kế mẫu) theo email.
          Email trong <code>ADMIN_EMAIL</code>/<code>ADMIN_EMAILS</code> luôn là
          admin và không thể thu hồi ở đây.
        </p>
      </div>

      {needsMigration && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-accent/50 bg-accent-soft px-4 py-3 text-xs text-text"
        >
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            CSDL chưa có bảng <code>ops_members</code>. Chạy{" "}
            <code>supabase/migration_v16_ops_roles_template_meta.sql</code> để
            bật phân quyền theo email (hiện chỉ env admin hoạt động).
          </span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-fg"
        >
          {error}
        </div>
      )}

      <form
        onSubmit={grant}
        className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-[1fr_180px_auto] sm:items-end"
      >
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="designer@example.com"
          disabled={needsMigration}
          autoComplete="off"
        />
        <label className="block text-sm font-medium text-fg">
          Role
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as OpsRole)}
            disabled={needsMigration}
            className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-fg focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-75"
          >
            {OPS_ROLES.map((option) => (
              <option key={option} value={option}>
                {getOpsRoleLabel(option)}
              </option>
            ))}
          </select>
        </label>
        <Button
          type="submit"
          variant="primary"
          loading={saving}
          disabled={needsMigration || !email.trim()}
        >
          <UserCog className="h-4 w-4" aria-hidden="true" />
          <span>Cấp quyền</span>
        </Button>
      </form>

      {formError && (
        <p role="alert" className="text-xs text-danger-fg">
          {formError}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo email..."
            aria-label="Tìm email phân quyền"
            className="min-h-[44px] w-full rounded-xl border border-border bg-surface pr-4 pl-10 text-sm text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">
            {filtered.length}/{items.length} email · {envAdminCount} admin môi trường
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

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-text-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Đang tải phân quyền…
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <ShieldCheck
              className="mx-auto h-8 w-8 text-text-muted"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm font-semibold text-text">
              {items.length === 0
                ? "Chưa cấp quyền cho email nào"
                : "Không tìm thấy email phù hợp"}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {items.length === 0
                ? "Dùng form bên trên để cấp quyền Designer hoặc Quản trị viên."
                : "Thử từ khoá khác."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((member) => {
              const isSelf = member.email === currentEmail.toLowerCase();
              const canDelete = !member.isEnvAdmin && !isSelf;
              return (
                <li
                  key={member.email}
                  className="flex flex-wrap items-center gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text">
                      {member.email}
                      {isSelf && (
                        <span className="ml-2 rounded-full border border-border bg-surface-alt px-2 py-0.5 text-[10px] font-medium text-text-muted">
                          Bạn
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[11px] text-text-muted">
                      Cập nhật {formatDateTime(member.updatedAt)}
                    </p>
                  </div>

                  <span
                    className={
                      member.role === "admin"
                        ? "inline-flex items-center gap-1 rounded-full border border-accent/45 bg-accent-soft px-2.5 py-0.5 text-[11px] font-semibold text-text"
                        : "inline-flex items-center gap-1 rounded-full border border-sage bg-surface px-2.5 py-0.5 text-[11px] font-medium text-text"
                    }
                  >
                    {getOpsRoleLabel(member.role)}
                  </span>

                  {member.isEnvAdmin && (
                    <span className="rounded-full border border-border bg-surface-alt px-2 py-0.5 text-[10px] font-medium text-text-muted">
                      ADMIN_EMAIL
                    </span>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!canDelete}
                    onClick={() => setDeleting(member)}
                    className="text-danger-fg hover:bg-danger-bg"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Thu hồi</span>
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog
        open={Boolean(deleting)}
        onClose={() => !deleteBusy && setDeleting(null)}
        title="Thu hồi quyền ops"
        description={
          deleting
            ? `Thu hồi quyền của ${deleting.email}? Người này sẽ không truy cập được ops nữa (trừ khi nằm trong ADMIN_EMAIL).`
            : undefined
        }
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => setDeleting(null)}
            disabled={deleteBusy}
          >
            Hủy
          </Button>
          <Button variant="danger" loading={deleteBusy} onClick={confirmDelete}>
            Thu hồi
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
