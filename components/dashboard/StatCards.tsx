"use client";

import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquareHeart,
  RefreshCw,
  Users,
  XCircle,
} from "lucide-react";
import { ApiError, getStats } from "@/lib/api";
import type { Stats } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

interface StatCardsProps {
  weddingId: string;
}

export function StatCards({ weddingId }: StatCardsProps) {
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
  }, [loadStats]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Card key={idx} className="space-y-2 p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </Card>
        ))}
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

  const items = [
    {
      label: "Tổng khách mời",
      value: stats.total,
      Icon: Users,
      accent: "bg-accent-soft text-accent-hover",
    },
    {
      label: "Chấp nhận",
      value: stats.accepted,
      Icon: CheckCircle2,
      accent: "bg-success-bg text-success-fg",
    },
    {
      label: "Từ chối",
      value: stats.declined,
      Icon: XCircle,
      accent: "bg-danger-bg text-danger-fg",
    },
    {
      label: "Chưa phản hồi",
      value: stats.pending,
      Icon: Clock,
      accent: "bg-neutral-bg text-neutral-fg",
    },
    {
      label: "Lời chúc",
      value: stats.wishes,
      Icon: MessageSquareHeart,
      accent: "bg-accent-soft text-accent-hover",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-fg">Tổng quan phản hồi</h2>
        <Button variant="outline" size="sm" onClick={loadStats}>
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Cập nhật</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
          <span className="font-semibold tabular-nums text-fg">
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
          Bao gồm {stats.accepted} khách xác nhận tham dự và {stats.declined} khách báo bận.
        </p>
      </Card>
    </div>
  );
}

