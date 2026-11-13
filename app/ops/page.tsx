"use client";

import * as React from "react";
import {
  Ban,
  Clock,
  CreditCard,
  DollarSign,
  Heart,
  RotateCw,
  Users,
} from "lucide-react";
import { formatVnd, getOpsStats, type OpsStats } from "@/lib/ops-api";

export default function OpsDashboardPage() {
  const [stats, setStats] = React.useState<OpsStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [updatedTime, setUpdatedTime] = React.useState<string>("");

  const loadStats = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getOpsStats();
      setStats(data);
      const now = new Date();
      setUpdatedTime(
        now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      );
    } catch {
      // Keep existing data on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div className="space-y-6">
      {/* Top title and refresh bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Tổng quan hệ thống
          </h1>
          <p className="mt-1 text-xs text-text-muted sm:text-sm">
            Báo cáo số liệu người dùng, thiệp cưới, đơn hàng và doanh thu.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {updatedTime && (
            <span className="text-xs text-text-muted">
              Cập nhật lúc {updatedTime}
            </span>
          )}
          <button
            type="button"
            onClick={loadStats}
            disabled={isLoading}
            aria-label="Làm mới thống kê"
            className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-text shadow-xs transition-colors hover:border-accent hover:bg-surface-alt disabled:opacity-50"
          >
            <RotateCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 6 Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Tổng người dùng */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted">
              Tổng người dùng
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent-text">
              <Users className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-4">
            <p className="font-display text-3xl font-bold tracking-tight text-text">
              {isLoading && !stats ? "—" : stats?.users.toLocaleString("vi-VN")}
            </p>
            <p className="mt-1 text-[11px] text-text-muted">Tài khoản đã đăng ký</p>
          </div>
        </div>

        {/* Card 2: Thiệp theo gói: Free / Pro / VIP (3 numbers in one card) */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted">
              Thiệp theo gói
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent-text">
              <Heart className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/70 pt-3 text-center">
            <div>
              <p className="text-[11px] font-medium text-text-muted">Free</p>
              <p className="mt-0.5 font-display text-xl font-bold text-text">
                {isLoading && !stats ? "—" : stats?.weddingsByPlan.free}
              </p>
            </div>
            <div className="border-x border-border/70">
              <p className="text-[11px] font-medium text-accent-text">Pro</p>
              <p className="mt-0.5 font-display text-xl font-bold text-accent-text">
                {isLoading && !stats ? "—" : stats?.weddingsByPlan.pro}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-vip-fg">VIP</p>
              <p className="mt-0.5 font-display text-xl font-bold text-vip-fg">
                {isLoading && !stats ? "—" : stats?.weddingsByPlan.vip}
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Thiệp đang bị khóa */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted">
              Thiệp đang bị khóa
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger-bg text-danger-fg">
              <Ban className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-4">
            <p className="font-display text-3xl font-bold tracking-tight text-danger-fg">
              {isLoading && !stats ? "—" : stats?.suspendedWeddings}
            </p>
            <p className="mt-1 text-[11px] text-text-muted">Tạm ngừng hiển thị</p>
          </div>
        </div>

        {/* Card 4: Đơn chờ thanh toán */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted">
              Đơn chờ thanh toán
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-soon-bg text-soon-fg">
              <Clock className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-4">
            <p className="font-display text-3xl font-bold tracking-tight text-soon-fg">
              {isLoading && !stats ? "—" : stats?.ordersPending}
            </p>
            <p className="mt-1 text-[11px] text-text-muted">Cần kiểm tra hoặc khớp tiền</p>
          </div>
        </div>

        {/* Card 5: Đơn đã thanh toán trong tháng */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted">
              Đơn đã thanh toán (tháng)
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-bg text-success-fg">
              <CreditCard className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-4">
            <p className="font-display text-3xl font-bold tracking-tight text-success-fg">
              {isLoading && !stats ? "—" : stats?.ordersPaidThisMonth}
            </p>
            <p className="mt-1 text-[11px] text-text-muted">Giao dịch thành công tháng này</p>
          </div>
        </div>

        {/* Card 6: Doanh thu trong tháng */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted">
              Doanh thu trong tháng
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent-text">
              <DollarSign className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-4">
            <p className="font-display text-3xl font-bold tracking-tight text-accent-text">
              {isLoading && !stats
                ? "—"
                : formatVnd(stats?.revenueThisMonthVnd || 0)}
            </p>
            <p className="mt-1 text-[11px] text-text-muted">Tổng thực thu tháng này</p>
          </div>
        </div>
      </div>
    </div>
  );
}

