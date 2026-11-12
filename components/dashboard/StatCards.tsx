"use client";

import * as React from "react";
import {
  AlertCircle,
  CalendarHeart,
  CheckCircle2,
  Clock,
  MessageSquareHeart,
  RefreshCw,
  UserCheck,
  Users,
  Utensils,
  XCircle,
} from "lucide-react";
import { ApiError, getStats } from "@/lib/api";
import type { Stats } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

interface StatCardsProps {
  weddingId: string;
  refreshSignal?: number;
}

export function StatCards({ weddingId, refreshSignal = 0 }: StatCardsProps) {
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadStats = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStats(weddingId);
      setStats(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.assign("/auth/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Không thể tải số liệu thống kê.");
    } finally {
      setLoading(false);
    }
  }, [weddingId]);

  React.useEffect(() => {
    loadStats();
  }, [loadStats, refreshSignal]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Card key={idx} className="space-y-2 p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>
        <Card className="space-y-3 p-5">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-12 w-full" />
        </Card>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="mx-auto h-9 w-9 text-danger-fg" aria-hidden="true" />
        <p className="mt-3 text-sm font-medium text-fg">
          {error ?? "Không có dữ liệu thống kê."}
        </p>
        <Button variant="outline" className="mt-4" onClick={loadStats}>
          Thử lại
        </Button>
      </Card>
    );
  }

  const responded = stats.accepted + stats.declined;
  const responseRate =
    stats.total > 0 ? Math.round((responded / stats.total) * 100) : 0;

  const acceptedHeadcount = stats.acceptedHeadcount ?? stats.accepted;
  const meatCount = stats.meatCount ?? 0;
  const vegCount = stats.vegCount ?? 0;

  const items = [
    {
      label: "Tổng khách mời",
      value: stats.total,
      Icon: Users,
      accent: "border border-accent/35 bg-accent-soft text-text",
    },
    {
      label: "Chấp nhận",
      value: stats.accepted,
      Icon: CheckCircle2,
      accent: "border border-success-border bg-success-bg text-success-fg",
    },
    {
      label: "Số người sẽ đến",
      value: acceptedHeadcount,
      Icon: UserCheck,
      accent: "border border-success-border bg-success-bg text-success-fg",
    },
    {
      label: "Suất mặn",
      value: meatCount,
      Icon: Utensils,
      accent: "border border-accent/35 bg-accent-soft text-text",
    },
    {
      label: "Suất chay",
      value: vegCount,
      Icon: Utensils,
      accent: "border border-sage bg-surface text-text",
    },
    {
      label: "Từ chối",
      value: stats.declined,
      Icon: XCircle,
      accent: "border border-danger-border bg-danger-bg text-danger-fg",
    },
    {
      label: "Chưa phản hồi",
      value: stats.pending,
      Icon: Clock,
      accent: "border border-neutral-border bg-neutral-bg text-neutral-fg",
    },
    {
      label: "Lời chúc",
      value: stats.wishes,
      Icon: MessageSquareHeart,
      accent: "border border-accent/35 bg-accent-soft text-text",
    },
  ];

  const eventCounts = stats.eventCounts ?? [];
  const unassignedCount = stats.unassignedCount ?? stats.total;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-2xl font-semibold text-fg">
            Tổng quan phản hồi
          </h2>
          <p className="text-xs text-fg-muted sm:text-sm">
            Theo dõi tỷ lệ xác nhận tham dự và phân bổ khách theo từng buổi lễ.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadStats}>
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Cập nhật</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <Card key={item.label} className="p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-fg-muted">{item.label}</span>
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${item.accent}`}
              >
                <item.Icon className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-fg sm:text-3xl">
              {item.value}
            </p>
          </Card>
        ))}
      </div>

      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="font-medium text-fg">Tỷ lệ khách đã phản hồi</span>
          <span className="font-semibold tabular-nums text-accent-text">
            {responded}/{stats.total} ({responseRate}%)
          </span>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${responseRate}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-fg-muted">
          Bao gồm {stats.accepted} khách xác nhận tham dự ({acceptedHeadcount} người dự kiến ·{" "}
          {meatCount} suất mặn, {vegCount} suất chay) và {stats.declined} khách báo bận.
        </p>
      </Card>

      <Card className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 font-sans text-base font-semibold text-fg">
              <CalendarHeart className="h-4 w-4 text-accent-text" aria-hidden="true" />
              <span>Phân bổ theo từng lễ</span>
            </h3>
            <p className="mt-0.5 text-xs text-fg-muted">
              Khách chưa gán lễ cụ thể sẽ nhìn thấy toàn bộ các lễ trên thiệp cá nhân (/m/&lt;slug&gt;).
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-neutral-border bg-neutral-bg px-2.5 py-1 text-xs font-medium text-neutral-fg">
            Mặc định tất cả lễ: {unassignedCount} khách
          </span>
        </div>

        {eventCounts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-5 text-center text-xs text-fg-muted sm:text-sm">
            Chưa có lễ nào được tạo. Thêm lễ trong mục &ldquo;Lễ &amp; địa điểm&rdquo; để phân bổ khách mời.
          </p>
        ) : (
          <div className="space-y-2.5">
            {eventCounts.map((item) => {
              const barPct =
                stats.total > 0
                  ? Math.round((item.visibleGuestCount / stats.total) * 100)
                  : 0;
              return (
                <div
                  key={item.eventId}
                  className="rounded-xl border border-border bg-bg p-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-fg">{item.title}</span>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full border border-accent/40 bg-accent-soft px-2.5 py-0.5 font-medium text-text">
                        Gán riêng: {item.assignedCount}
                      </span>
                      <span className="text-fg-muted tabular-nums">
                        Hiển thị cho {item.visibleGuestCount}/{stats.total} khách
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-accent/85 transition-all duration-300"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
