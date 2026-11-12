"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquareHeart,
  Users,
  XCircle,
} from "lucide-react";
import { ApiError, getStats } from "@/lib/api";
import { Stats } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export function StatCards() {
  const router = useRouter();
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadStats = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStats();
      setStats(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/admin/login");
        return;
      }
      setError(
        err instanceof Error ? err.message : "Không thể tải số liệu tổng quan."
      );
    } finally {
      setLoading(false);
    }
}, [router]);

React.useEffect(() => {
  loadStats();
}, [loadStats]);

if (loading) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-5 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-16" />
          </Card>
        ))}
      </div>
      <Card className="p-6 space-y-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-5 w-full rounded-full" />
      </Card>
    </div>
  );
}

if (error || !stats) {
  return (
    <Card className="p-8 text-center">
      <AlertCircle
        className="mx-auto h-9 w-9 text-danger-fg"
        aria-hidden="true"
      />
      <p className="mt-3 text-sm font-medium text-fg">
        {error ?? "Không có dữ liệu tổng quan."}
      </p>
      <Button variant="outline" className="mt-4" onClick={loadStats}>
        Thử lại
      </Button>
    </Card>
  );
}

const total = stats.total;
const pct = (value: number) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

const acceptedPct = pct(stats.accepted);
const declinedPct = pct(stats.declined);
const pendingPct = total > 0 ? Math.max(0, 100 - acceptedPct - declinedPct) : 0;

const items = [
  {
    label: "Tổng khách mời",
    value: stats.total,
    Icon: Users,
    tone: "bg-accent-soft text-accent-hover",
  },
  {
    label: "Chấp nhận",
    value: stats.accepted,
    Icon: CheckCircle2,
    tone: "bg-success-bg text-success-fg",
  },
  {
    label: "Từ chối",
    value: stats.declined,
    Icon: XCircle,
    tone: "bg-danger-bg text-danger-fg",
  },
  {
    label: "Chưa phản hồi",
    value: stats.pending,
    Icon: Clock,
    tone: "bg-neutral-bg text-neutral-fg",
  },
  {
    label: "Số lời chúc",
    value: stats.wishes,
    Icon: MessageSquareHeart,
    tone: "bg-accent-soft text-accent-hover",
  },
];

return (
  <div className="space-y-6">
    <div>
      <h1 className="font-display text-3xl font-semibold text-fg">
        Tổng quan lễ cưới
      </h1>
      <p className="text-sm text-fg-muted">
        Thống kê phản hồi tham dự và lời chúc hiện tại.
      </p>
    </div>

    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map(({ label, value, Icon, tone }) => (
        <Card key={label} className="p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-fg-muted">{label}</span>
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-3 font-display text-4xl font-semibold tabular-nums text-fg">
            {value}
          </p>
        </Card>
      ))}
    </div>

    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-fg">
          Tỉ lệ phản hồi của khách mời
        </h2>
        <span className="text-xs text-fg-muted">
          {total > 0
            ? `Đã phản hồi ${stats.accepted + stats.declined}/${total} khách`
            : "Chưa có khách mời"}
        </span>
      </div>

      {total === 0 ? (
        <p className="mt-4 text-sm text-fg-muted">
          Thêm khách mời ở tab Khách mời để xem biểu đồ tỉ lệ phản hồi.
        </p>
      ) : (
        <>
          <div
            role="img"
            aria-label={`Chấp nhận ${acceptedPct}%, Từ chối ${declinedPct}%, Chưa phản hồi ${pendingPct}%`}
            className="mt-4 flex h-4 w-full overflow-hidden rounded-full bg-neutral-bg"
          >
            {stats.accepted > 0 && (
              <div
                style={{ width: `${(stats.accepted / total) * 100}%` }}
                className="bg-success-fg transition-all duration-300"
              />
            )}
            {stats.declined > 0 && (
              <div
                style={{ width: `${(stats.declined / total) * 100}%` }}
                className="bg-danger-fg transition-all duration-300"
              />
            )}
            {stats.pending > 0 && (
              <div
                style={{ width: `${(stats.pending / total) * 100}%` }}
                className="bg-neutral-fg/35 transition-all duration-300"
              />
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-5 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-success-fg" />
              <span className="text-fg">
                Chấp nhận: <strong>{acceptedPct}%</strong> ({stats.accepted})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-danger-fg" />
              <span className="text-fg">
                Từ chối: <strong>{declinedPct}%</strong> ({stats.declined})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-neutral-fg/40" />
              <span className="text-fg">
                Chưa phản hồi: <strong>{pendingPct}%</strong> ({stats.pending})
              </span>
            </div>
          </div>
        </>
      )}
    </Card>
  </div>
);
}

