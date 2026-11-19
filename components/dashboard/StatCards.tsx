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
      accent: "border border-[#E8E2D9] bg-[#FAF8F5] text-[#7A1C24]",
    },
    {
      label: "Đã xác nhận",
      value: stats.accepted,
      Icon: CheckCircle2,
      accent: "border border-[#BBDBC9] bg-[#ECF5F0] text-[#2F6F4E]",
    },
    {
      label: "Số người sẽ đến",
      value: acceptedHeadcount,
      Icon: UserCheck,
      accent: "border border-[#BBDBC9] bg-[#ECF5F0] text-[#2F6F4E]",
    },
    {
      label: "Suất mặn",
      value: meatCount,
      Icon: Utensils,
      accent: "border border-[#E8E2D9] bg-[#FAF8F5] text-[#1F1D1A]",
    },
    {
      label: "Suất chay",
      value: vegCount,
      Icon: Utensils,
      accent: "border border-[#BBDBC9] bg-[#ECF5F0] text-[#2F6F4E]",
    },
    {
      label: "Từ chối",
      value: stats.declined,
      Icon: XCircle,
      accent: "border border-[#ECCFCF] bg-[#FBEFEF] text-[#9E3B3B]",
    },
    {
      label: "Chưa phản hồi",
      value: stats.pending,
      Icon: Clock,
      accent: "border border-[#E8DAC0] bg-[#FAF3E3] text-[#8A6D3B]",
    },
    {
      label: "Lời chúc",
      value: stats.wishes,
      Icon: MessageSquareHeart,
      accent: "border border-[#B89B72]/40 bg-[#F4EFEA] text-[#B89B72]",
    },
  ];

  const eventCounts = stats.eventCounts ?? [];
  const unassignedCount = stats.unassignedCount ?? stats.total;

  return (
    <div className="space-y-5 text-[#1F1D1A]">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#1F1D1A]">
            Tổng quan phản hồi
          </h2>
          <p className="mt-0.5 text-xs text-[#6B655E] sm:text-sm">
            Theo dõi tỷ lệ xác nhận tham dự và phân bổ khách theo từng buổi lễ.
          </p>
        </div>
        <button
          type="button"
          onClick={loadStats}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#E8E2D9] bg-white px-3.5 py-1.5 text-xs font-medium text-[#1F1D1A] shadow-2xs hover:bg-[#FAF8F5]"
        >
          <RefreshCw className="h-3.5 w-3.5 text-[#B89B72]" aria-hidden="true" />
          <span>Cập nhật</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-[#E8E2D9] bg-white p-4 shadow-2xs transition-all hover:border-[#B89B72]/50"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[#6B655E]">{item.label}</span>
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${item.accent}`}
              >
                <item.Icon className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 font-serif text-2xl font-semibold tabular-nums text-[#1F1D1A] sm:text-3xl">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#E8E2D9] bg-white p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="font-medium text-[#1F1D1A]">Tỷ lệ khách đã phản hồi</span>
          <span className="font-serif text-lg font-semibold tabular-nums text-[#7A1C24]">
            {responded}/{stats.total} ({responseRate}%)
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#FAF8F5] border border-[#E8E2D9]">
          <div
            className="h-full rounded-full bg-[#7A1C24] transition-all duration-300"
            style={{ width: `${responseRate}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-[#6B655E]">
          Bao gồm {stats.accepted} khách xác nhận tham dự ({acceptedHeadcount} người dự kiến ·{" "}
          {meatCount} suất mặn, {vegCount} suất chay) và {stats.declined} khách báo bận.
        </p>
      </div>

      <div className="rounded-2xl border border-[#E8E2D9] bg-white p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 font-sans text-base font-semibold text-[#1F1D1A]">
              <CalendarHeart className="h-4 w-4 text-[#7A1C24]" aria-hidden="true" />
              <span>Phân bổ theo từng lễ</span>
            </h3>
            <p className="mt-0.5 text-xs text-[#6B655E]">
              Khách chưa gán lễ cụ thể sẽ nhìn thấy toàn bộ các lễ trên thiệp mời của mình.
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-[#E8E2D9] bg-[#FAF8F5] px-2.5 py-1 text-xs font-medium text-[#6B655E]">
            Mặc định tất cả lễ: {unassignedCount} khách
          </span>
        </div>

        {eventCounts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#E8E2D9] px-4 py-5 text-center text-xs text-[#6B655E]">
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
                  className="rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] p-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-[#1F1D1A]">{item.title}</span>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full border border-[#B89B72]/40 bg-[#F4EFEA] px-2.5 py-0.5 font-medium text-[#1F1D1A]">
                        Gán riêng: {item.assignedCount}
                      </span>
                      <span className="text-[#6B655E] tabular-nums">
                        Hiển thị cho {item.visibleGuestCount}/{stats.total} khách
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#E8E2D9]">
                    <div
                      className="h-full rounded-full bg-[#7A1C24] transition-all duration-300"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
