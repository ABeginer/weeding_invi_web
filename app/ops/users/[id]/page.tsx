"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Ban, CheckCircle2, Heart, Mail } from "lucide-react";
import { formatDateTime, getOpsUser, type OpsUserDetail } from "@/lib/ops-api";
import { OpsTable } from "@/components/ops/OpsTable";

export default function OpsUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [user, setUser] = React.useState<OpsUserDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

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

  return (
    <div className="space-y-6">
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

          <div className="rounded-lg border border-border bg-surface-alt px-3.5 py-2 text-xs">
            <span className="text-text-muted">Tổng số thiệp: </span>
            <strong className="font-bold text-text">{user.weddings.length}</strong>
          </div>
        </div>
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
    </div>
  );
}

