"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  GitMerge,
  Heart,
  KeyRound,
  Mail,
  X,
} from "lucide-react";
import {
  formatDateTime,
  getOpsUser,
  getProviderLabel,
  type OpsUserDetail,
  type OpsUserIdentity,
} from "@/lib/ops-api";
import { OpsTable } from "@/components/ops/OpsTable";
import { MergeAccountDialog } from "@/components/ops/MergeAccountDialog";

export default function OpsUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [user, setUser] = React.useState<OpsUserDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isMergeOpen, setIsMergeOpen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  // Check for flash toast saved during navigation from merge
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const flash = window.sessionStorage.getItem("ops_toast");
        if (flash) {
          showToast(flash);
          window.sessionStorage.removeItem("ops_toast");
        }
      } catch {}
    }
  }, [id]);

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setIsLoading(true);

    getOpsUser(id)
      .then((res) => {
        if (cancelled) return;
        setUser(res);
      })
      .catch(() => {
        if (cancelled) return;
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const weddingColumns = [
    {
      header: "Slug",
      cell: (w: { id: string; slug: string }) => (
        <span className="font-mono font-semibold text-text">{w.slug}</span>
      ),
    },
    {
      header: "Gói",
      cell: (w: { plan: string }) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
            w.plan === "vip"
              ? "bg-vip-bg text-vip-fg border border-vip-border"
              : w.plan === "pro"
              ? "bg-accent-soft text-accent-text border border-border"
              : "bg-surface-alt text-text-muted border border-border"
          }`}
        >
          {w.plan}
        </span>
      ),
    },
    {
      header: "Trạng thái",
      cell: (w: { suspended: boolean }) =>
        w.suspended ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-danger-border bg-danger-bg px-2.5 py-0.5 text-[11px] font-medium text-danger-fg">
            <Ban className="h-3 w-3" aria-hidden="true" />
            <span>Đang khóa</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-success-border bg-success-bg px-2.5 py-0.5 text-[11px] font-medium text-success-fg">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            <span>Hoạt động</span>
          </span>
        ),
    },
    {
      header: "Ngày tạo",
      cell: (w: { createdAt: string }) => (
        <span className="text-text-muted">{formatDateTime(w.createdAt)}</span>
      ),
    },
    {
      header: "Thao tác",
      className: "text-right",
      headerClassName: "text-right",
      cell: (w: { id: string }) => (
        <Link
          href={`/ops/weddings/${w.id}`}
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-accent-text hover:border-accent hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          Chi tiết thiệp
        </Link>
      ),
    },
  ];

  const identityColumns = [
    {
      header: "Phương thức",
      cell: (item: OpsUserIdentity) => (
        <span className="font-semibold text-text">{getProviderLabel(item.provider)}</span>
      ),
    },
    {
      header: "Ngày liên kết",
      cell: (item: OpsUserIdentity) => (
        <span className="text-text-muted">{formatDateTime(item.linkedAt)}</span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4 py-8">
        <div className="h-6 w-32 animate-pulse rounded bg-surface-alt" />
        <div className="h-28 w-full animate-pulse rounded-xl bg-surface-alt" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-text-muted">Không tìm thấy người dùng.</p>
        <button
          type="button"
          onClick={() => router.push("/ops/users")}
          className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-border px-4 text-xs font-semibold text-text hover:bg-surface-alt"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại danh sách</span>
        </button>
      </div>
    );
  }

  // Máy chủ chưa có route POST /api/ops/users/[id]/merge nên ẩn nút gộp,
  // tránh để người vận hành bấm vào một thao tác không tồn tại.
  const canMerge = false;

  const handleMergeSuccess = (
    movedWeddings: number,
    movedIdentities: number,
    targetUserId: string,
  ) => {
    setIsMergeOpen(false);
    const successMsg = `Đã gộp ${movedWeddings} thiệp và ${movedIdentities} cách đăng nhập.`;
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("ops_toast", successMsg);
      }
    } catch {}
    router.push(`/ops/users/${encodeURIComponent(targetUserId)}`);
  };

  const handleMergeNotFound = () => {
    showToast("Không tìm thấy tài khoản.");
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="flex items-center justify-between rounded-xl border border-success-border bg-success-bg p-3.5 text-xs font-semibold text-success-fg shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="cursor-pointer text-success-fg hover:opacity-75"
            aria-label="Đóng thông báo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Back button */}
      <div>
        <Link
          href="/ops/users"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Quay lại danh sách người dùng</span>
        </Link>
      </div>

      {/* User Info Card */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-text">
              <Mail className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h1 className="font-display text-xl font-bold text-text sm:text-2xl">
                {user.email}
              </h1>
              <p className="mt-0.5 text-xs text-text-muted">
                Ngày đăng ký: {formatDateTime(user.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="rounded-lg border border-border bg-surface-alt px-3.5 py-2 text-xs">
              <span className="text-text-muted">Tổng số thiệp: </span>
              <strong className="font-bold text-text">{user.weddings.length}</strong>
            </div>

            {/* B1. Button Gộp vào tài khoản khác */}
            {canMerge && (
              <button
                type="button"
                onClick={() => setIsMergeOpen(true)}
                className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg border border-soon-border bg-soon-bg px-3.5 py-2 text-xs font-semibold text-soon-fg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                <GitMerge className="h-4 w-4" aria-hidden="true" />
                <span>Gộp vào tài khoản khác</span>
              </button>
            )}
          </div>
        </div>

        {/* C1. Audit visibility: mergedFrom note */}
        {user.mergedFrom && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-surface-alt p-3 text-xs text-text-muted">
            <GitMerge className="h-4 w-4 shrink-0 text-soon-fg" aria-hidden="true" />
            <span>
              Đã gộp từ <strong className="font-semibold text-text">{user.mergedFrom.email}</strong> lúc {formatDateTime(user.mergedFrom.mergedAt)}.
            </span>
          </div>
        )}
      </div>

      {/* A1. Section Phương thức đăng nhập */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-accent-text" />
            <h2 className="text-sm font-semibold tracking-wide text-text uppercase">
              Phương thức đăng nhập
            </h2>
          </div>
        </div>

        {/* A3. Small note if user has more than one identity */}
        {user.identities && user.identities.length > 1 && (
          <p className="text-xs text-text-muted">
            Tài khoản này có nhiều cách đăng nhập. Thiệp của mọi cách đăng nhập đều hiển thị ở đây.
          </p>
        )}

        <OpsTable
          columns={identityColumns}
          data={user.identities || []}
          keyExtractor={(item, idx) => `${item.provider}-${idx}`}
          emptyText="Chưa có thông tin phương thức đăng nhập."
        />
      </div>

      {/* Weddings of user */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-accent-text" />
          <h2 className="text-sm font-semibold tracking-wide text-text uppercase">
            Danh sách thiệp của người dùng
          </h2>
        </div>

        <OpsTable
          columns={weddingColumns}
          data={user.weddings}
          keyExtractor={(w) => w.id}
          emptyText="Người dùng này chưa tạo thiệp nào."
        />
      </div>

      {/* B2. Merge Dialog */}
      <MergeAccountDialog
        isOpen={isMergeOpen}
        sourceUser={user}
        onClose={() => setIsMergeOpen(false)}
        onSuccess={handleMergeSuccess}
        onNotFound={handleMergeNotFound}
      />
    </div>
  );
}
