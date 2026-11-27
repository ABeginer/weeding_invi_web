"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarHeart,
  CheckCircle2,
  ChevronRight,
  Clock,
  Gift,
  MessageSquareHeart,
  RefreshCw,
  ShieldCheck,
  Tv,
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
import type { QuickFilter } from "./GuestTable";
import type { DetailTab } from "./WeddingDetailView";

interface StatCardsProps {
  weddingId: string;
  refreshSignal?: number;
  onNavigate?: (tab: DetailTab, guestFilter?: QuickFilter, eventId?: string) => void;
}

export function StatCards({
  weddingId,
  refreshSignal = 0,
  onNavigate,
}: StatCardsProps) {
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

  const items: {
    label: string;
    value: number;
    Icon: typeof Users;
    accent: string;
    tab: DetailTab;
    filter?: QuickFilter;
  }[] = [
      {
        label: "Tổng khách mời",
        value: stats.total,
        Icon: Users,
        accent: "border border-[#E8E2D9] bg-[#FAF8F5] text-[#7A1C24]",
        tab: "guests",
        filter: "all",
      },
      {
        label: "Đã xác nhận",
        value: stats.accepted,
        Icon: CheckCircle2,
        accent: "border border-[#BBDBC9] bg-[#ECF5F0] text-[#2F6F4E]",
        tab: "guests",
        filter: "accepted",
      },
      {
        label: "Số người sẽ đến",
        value: acceptedHeadcount,
        Icon: UserCheck,
        accent: "border border-[#BBDBC9] bg-[#ECF5F0] text-[#2F6F4E]",
        tab: "guests",
        filter: "accepted",
      },
      {
        label: "Suất mặn",
        value: meatCount,
        Icon: Utensils,
        accent: "border border-[#E8E2D9] bg-[#FAF8F5] text-[#1F1D1A]",
        tab: "guests",
        filter: "accepted",
      },
      {
        label: "Suất chay",
        value: vegCount,
        Icon: Utensils,
        accent: "border border-[#BBDBC9] bg-[#ECF5F0] text-[#2F6F4E]",
        tab: "guests",
        filter: "veg",
      },
      {
        label: "Từ chối",
        value: stats.declined,
        Icon: XCircle,
        accent: "border border-[#ECCFCF] bg-[#FBEFEF] text-[#9E3B3B]",
        tab: "guests",
        filter: "declined",
      },
      {
        label: "Chưa phản hồi",
        value: stats.pending,
        Icon: Clock,
        accent: "border border-[#E8DAC0] bg-[#FAF3E3] text-[#8A6D3B]",
        tab: "guests",
        filter: "pending",
      },
      {
        label: "Lời chúc",
        value: stats.wishes,
        Icon: MessageSquareHeart,
        accent: "border border-[#B89B72]/40 bg-[#F4EFEA] text-[#B89B72]",
        tab: "wishes",
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

      {/* 8 ô thống kê chính - Clickable */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onNavigate?.(item.tab, item.filter)}
            className="group relative flex flex-col justify-between cursor-pointer text-left w-full rounded-2xl border border-[#E8E2D9] bg-white p-4 shadow-2xs transition-all duration-200 hover:border-[#B89B72] hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]/40"
          >
            <div className="flex w-full items-center justify-between gap-2">
              <span className="text-xs font-medium text-[#6B655E] transition-colors group-hover:text-[#1F1D1A]">
                {item.label}
              </span>
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${item.accent}`}
              >
                <item.Icon className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-3 flex w-full items-baseline justify-between gap-2">
              <p className="font-serif text-2xl font-semibold tabular-nums text-[#1F1D1A] sm:text-3xl">
                {item.value}
              </p>
              <span className="inline-flex items-center text-xs font-medium text-[#B89B72] opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5">
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Thanh lọc nhanh trạng thái khách mời */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#E8E2D9] bg-white px-4 py-3 shadow-2xs text-xs">
        <span className="font-medium text-[#6B655E]">Lọc nhanh khách mời:</span>
        <button
          type="button"
          onClick={() => onNavigate?.("guests", "unsent")}
          className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[#E8DAC0] bg-[#FAF3E3] px-3 py-1 font-medium text-[#8A6D3B] hover:bg-[#f5e9d0] transition-colors"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#8A6D3B]" />
          <span>Chưa gửi thiệp</span>
          <ChevronRight className="h-3 w-3 text-[#8A6D3B]" />
        </button>
        <button
          type="button"
          onClick={() => onNavigate?.("guests", "veg")}
          className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[#BBDBC9] bg-[#ECF5F0] px-3 py-1 font-medium text-[#2F6F4E] hover:bg-[#d8ece0] transition-colors"
        >
          <span>Khách ăn chay ({vegCount})</span>
          <ChevronRight className="h-3 w-3 text-[#2F6F4E]" />
        </button>
        <button
          type="button"
          onClick={() => onNavigate?.("guests", "unassigned")}
          className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[#E8E2D9] bg-[#FAF8F5] px-3 py-1 font-medium text-[#7A1C24] hover:border-[#7A1C24]/40 hover:bg-[#F4EFEA] transition-colors"
        >
          <span>Chưa xếp bàn</span>
          <ChevronRight className="h-3 w-3 text-[#7A1C24]" />
        </button>
      </div>

      {/* Lối tắt quản lý trực tiếp theo tính năng */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Sổ mừng */}
        <Link
          href="/dashboard/so-mung"
          className="group flex items-center justify-between rounded-2xl border border-[#E8E2D9] bg-white p-4 shadow-2xs transition-all duration-200 hover:border-[#B89B72] hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]/40"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] text-[#7A1C24]">
              <Gift className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-[#1F1D1A] group-hover:text-[#7A1C24] transition-colors">
                Sổ mừng & Tiền mừng
              </h4>
              <p className="truncate text-xs text-[#6B655E]">Xem danh sách mừng cưới & VietQR</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-[#B89B72] transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>

        {/* Trợ lý & Check-in bàn tiệc */}
        <button
          type="button"
          onClick={() => onNavigate?.("assistant")}
          className="group flex cursor-pointer items-center justify-between rounded-2xl border border-[#E8E2D9] bg-white p-4 shadow-2xs transition-all duration-200 hover:border-[#B89B72] hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]/40 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#BBDBC9] bg-[#ECF5F0] text-[#2F6F4E]">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-[#1F1D1A] group-hover:text-[#7A1C24] transition-colors">
                Bàn tiệc & Check-in
              </h4>
              <p className="truncate text-xs text-[#6B655E]">Mã PIN trợ lý, QR đón khách VIP</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-[#B89B72] transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>

        {/* Duyệt ảnh LED Photo Wall */}
        <button
          type="button"
          onClick={() => onNavigate?.("moderation")}
          className="group flex cursor-pointer items-center justify-between rounded-2xl border border-[#E8E2D9] bg-white p-4 shadow-2xs transition-all duration-200 hover:border-[#B89B72] hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]/40 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E8DAC0] bg-[#FAF3E3] text-[#8A6D3B]">
              <Tv className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-[#1F1D1A] group-hover:text-[#7A1C24] transition-colors">
                Ảnh Photo Wall
              </h4>
              <p className="truncate text-xs text-[#6B655E]">Duyệt ảnh khách gửi lên màn hình LED</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-[#B89B72] transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Tiến độ phản hồi & liên kết lọc trực tiếp trong văn bản */}
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
          Bao gồm{" "}
          <button
            type="button"
            onClick={() => onNavigate?.("guests", "accepted")}
            className="cursor-pointer font-medium text-[#2F6F4E] underline decoration-[#2F6F4E]/40 underline-offset-2 hover:decoration-[#2F6F4E]"
          >
            {stats.accepted} khách xác nhận tham dự
          </button>{" "}
          ({acceptedHeadcount} người dự kiến ·{" "}
          <button
            type="button"
            onClick={() => onNavigate?.("guests", "accepted")}
            className="cursor-pointer font-medium text-[#1F1D1A] underline decoration-[#1F1D1A]/40 underline-offset-2 hover:text-[#7A1C24]"
          >
            {meatCount} suất mặn
          </button>
          ,{" "}
          <button
            type="button"
            onClick={() => onNavigate?.("guests", "veg")}
            className="cursor-pointer font-medium text-[#2F6F4E] underline decoration-[#2F6F4E]/40 underline-offset-2 hover:decoration-[#2F6F4E]"
          >
            {vegCount} suất chay
          </button>
          ) và{" "}
          <button
            type="button"
            onClick={() => onNavigate?.("guests", "declined")}
            className="cursor-pointer font-medium text-[#9E3B3B] underline decoration-[#9E3B3B]/40 underline-offset-2 hover:decoration-[#9E3B3B]"
          >
            {stats.declined} khách báo bận
          </button>
          .
        </p>
      </div>

      {/* Phân bổ theo từng lễ - Clickable để nhảy sang Quản lý Lễ */}
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
          <button
            type="button"
            onClick={() => onNavigate?.("guests", "all", "all")}
            className="group inline-flex cursor-pointer items-center gap-1.5 shrink-0 rounded-full border border-[#E8E2D9] bg-[#FAF8F5] px-3 py-1 text-xs font-medium text-[#6B655E] hover:border-[#B89B72] hover:text-[#1F1D1A] transition-all"
          >
            <span>Mặc định tất cả lễ: <strong>{unassignedCount}</strong> khách</span>
            <ChevronRight className="h-3 w-3 text-[#B89B72] transition-transform group-hover:translate-x-0.5" />
          </button>
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
                <button
                  key={item.eventId}
                  type="button"
                  onClick={() => onNavigate?.("guests", "all", item.eventId)}
                  className="group w-full text-left rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] p-3.5 transition-all duration-200 hover:border-[#B89B72] hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]/40 cursor-pointer"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-[#1F1D1A] transition-colors group-hover:text-[#7A1C24]">
                      <span>{item.title}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-[#B89B72] opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
                    </span>
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
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
