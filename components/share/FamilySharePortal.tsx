"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Filter,
  Image as ImageIcon,
  QrCode,
  Search,
  Tv,
  UserCheck,
  Users,
  Utensils,
  XCircle,
} from "lucide-react";
import { PhotoModerator } from "@/components/dashboard/PhotoModerator";
import type { PublicWeddingData } from "@/lib/server/public-wedding";
import type { GuestDiet, GuestStatus, WeddingPhoto } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  calculateTableOccupancy,
  formatCheckInTime,
} from "@/lib/checkin-utils";
import { QrCheckInScanner } from "./QrCheckInScanner";

export interface FamilyShareGuest {
  id: string;
  name: string;
  slug: string;
  relationshipGroup?: string | null;
  status: GuestStatus;
  plusOnes?: number | null;
  diet?: GuestDiet | null;
  tableNumber?: string | null;
  checkedInAt?: string | null;
  checkedInCount?: number | null;
}

interface FamilySharePortalProps {
  wedding: PublicWeddingData;
  guests: FamilyShareGuest[];
  photos: WeddingPhoto[];
}

export function FamilySharePortal({
  wedding,
  guests,
  photos,
}: FamilySharePortalProps) {
  const { slug, content, events } = wedding;
  const couple = [content.couple.groomName, content.couple.brideName]
    .filter(Boolean)
    .join(" & ");

  const [activeTab, setActiveTab] = React.useState<
    "checkin" | "moderation" | "rsvp"
  >("checkin");
  const [liveGuests, setLiveGuests] = React.useState<FamilyShareGuest[]>(guests);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [guestFilter, setGuestFilter] = React.useState<
    "all" | "checkedIn" | "notCheckedIn" | "accepted" | "pending" | "declined"
  >("all");
  const [tableProgressOpen, setTableProgressOpen] = React.useState(false);

  // Đồng bộ hóa danh sách khách mời ngầm mỗi 10 giây (khi tab đang active)
  React.useEffect(() => {
    let cancelled = false;

    const syncGuests = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }

      try {
        const res = await fetch(`/api/share/guests?slug=${encodeURIComponent(slug)}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.guests)) {
          setLiveGuests(data.guests);
        }
      } catch {}
    };

    const interval = setInterval(syncGuests, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [slug]);

  // Tính toán tiến độ bàn tiệc & số khách đã đến
  const occupancy = React.useMemo(
    () => calculateTableOccupancy(liveGuests),
    [liveGuests],
  );

  // Tính toán số liệu thống kê RSVP
  const stats = React.useMemo(() => {
    let accepted = 0;
    let declined = 0;
    let pending = 0;
    let totalPlusOnes = 0;
    let vegCount = 0;
    let meatCount = 0;
    let checkedIn = 0;

    for (const g of liveGuests) {
      if (g.checkedInAt) {
        checkedIn += 1;
      }

      if (g.status === "accepted") {
        accepted += 1;
        const plus = typeof g.plusOnes === "number" ? Math.max(0, g.plusOnes) : 0;
        totalPlusOnes += plus;
        if (g.diet === "veg") {
          vegCount += 1 + plus;
        } else {
          meatCount += 1 + plus;
        }
      } else if (g.status === "declined") {
        declined += 1;
      } else {
        pending += 1;
      }
    }

    return {
      totalGuests: liveGuests.length,
      accepted,
      declined,
      pending,
      checkedIn,
      totalHeadcount: accepted + totalPlusOnes,
      totalPlusOnes,
      vegCount,
      meatCount,
    };
  }, [liveGuests]);

  // Lọc danh sách khách mời trong tab RSVP & Bàn
  const filteredGuests = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return liveGuests.filter((g) => {
      if (guestFilter === "checkedIn" && !g.checkedInAt) return false;
      if (guestFilter === "notCheckedIn" && g.checkedInAt) return false;
      if (
        (guestFilter === "accepted" ||
          guestFilter === "pending" ||
          guestFilter === "declined") &&
        g.status !== guestFilter
      ) {
        return false;
      }

      if (q) {
        const matchName = g.name.toLowerCase().includes(q);
        const matchTable = (g.tableNumber || "").toLowerCase().includes(q);
        const matchSlug = g.slug.toLowerCase().includes(q);
        if (!matchName && !matchTable && !matchSlug) return false;
      }

      return true;
    });
  }, [guestFilter, liveGuests, searchQuery]);

  return (
    <div className="min-h-[100dvh] bg-[#FAF8F5] text-[#1F1D1A]">
      {/* Top Luxury Banner */}
      <header className="border-b border-[#E8E2D9] bg-white px-4 py-6 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#FAF8F5] border border-[#E8E2D9] px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[#B89B72] uppercase">
                TRỢ LÝ TIỆC CƯỚI
              </span>
              <span className="text-xs text-[#6B655E]">
                Dành riêng cho người thân &amp; Planner
              </span>
            </div>
            <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#1F1D1A] sm:text-3xl">
              {couple}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href={`/w/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-[#E8E2D9] bg-white px-4 text-xs font-medium text-[#1F1D1A] transition-colors hover:bg-[#FAF8F5]"
            >
              <span>Xem thiệp online</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </Link>

            {wedding.plan !== "free" && (
              <Link
                href={`/led/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-[#7A1C24] bg-[#7A1C24] px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#5E141B]"
              >
                <Tv className="h-3.5 w-3.5" />
                <span>Mở màn hình LED</span>
                <ExternalLink className="h-3 w-3 opacity-70" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
        {/* Navigation Tabs (3 mobile-friendly tabs) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none border-b border-[#E8E2D9]">
          <button
            type="button"
            onClick={() => setActiveTab("checkin")}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition-all whitespace-nowrap",
              activeTab === "checkin"
                ? "bg-[#7A1C24] text-white shadow-xs"
                : "bg-white border border-[#E8E2D9] text-[#6B655E] hover:text-[#1F1D1A]",
            )}
          >
            <QrCode className="h-4 w-4" />
            <span>Quét Check-in</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.2 text-[10px] font-mono",
                activeTab === "checkin"
                  ? "bg-white/20 text-white"
                  : "bg-[#FAF8F5] text-[#1F1D1A]",
              )}
            >
              {occupancy.totalArrivedGuests}/{occupancy.totalGuests}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("moderation")}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition-all whitespace-nowrap",
              activeTab === "moderation"
                ? "bg-[#7A1C24] text-white shadow-xs"
                : "bg-white border border-[#E8E2D9] text-[#6B655E] hover:text-[#1F1D1A]",
            )}
          >
            <ImageIcon className="h-4 w-4" />
            <span>Duyệt ảnh</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.2 text-[10px] font-mono",
                activeTab === "moderation"
                  ? "bg-white/20 text-white"
                  : "bg-[#FAF8F5] text-[#1F1D1A]",
              )}
            >
              {photos.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("rsvp")}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition-all whitespace-nowrap",
              activeTab === "rsvp"
                ? "bg-[#7A1C24] text-white shadow-xs"
                : "bg-white border border-[#E8E2D9] text-[#6B655E] hover:text-[#1F1D1A]",
            )}
          >
            <Users className="h-4 w-4" />
            <span>RSVP &amp; Bàn</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.2 text-[10px] font-mono",
                activeTab === "rsvp"
                  ? "bg-white/20 text-white"
                  : "bg-[#FAF8F5] text-[#1F1D1A]",
              )}
            >
              {liveGuests.length}
            </span>
          </button>
        </div>

        {/* Sticky Live Arrival Counter & Expandable Table Progress Drawer */}
        {(activeTab === "checkin" || activeTab === "rsvp") && (
          <div className="sticky top-2 z-20 my-5 rounded-2xl border border-[#E8E2D9] bg-white/95 p-3.5 shadow-sm backdrop-blur-md">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2F6F4E] opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-[#2F6F4E]" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-[#1F1D1A]">
                    Đã đến:{" "}
                    <span className="font-mono text-sm font-bold text-[#2F6F4E]">
                      {occupancy.totalArrivedGuests}
                    </span>{" "}
                    / {occupancy.totalGuests} khách ({occupancy.totalArrivedHeadcount} /{" "}
                    {occupancy.totalAssignedHeadcount} người)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Thin progress bar */}
                <div className="h-2 w-28 sm:w-40 overflow-hidden rounded-full border border-[#E8E2D9] bg-[#FAF8F5]">
                  <div
                    className="h-full rounded-full bg-[#2F6F4E] transition-all duration-500"
                    style={{ width: `${occupancy.overallPercent}%` }}
                  />
                </div>
                <span className="font-mono text-xs font-bold text-[#2F6F4E]">
                  {occupancy.overallPercent}%
                </span>

                {/* Nút mở ngăn kéo Tiến độ từng bàn */}
                <button
                  type="button"
                  onClick={() => setTableProgressOpen((prev) => !prev)}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[#B89B72]/50 bg-[#FAF8F5] px-3 py-1 text-xs font-semibold text-[#8A6D3B] transition-colors hover:bg-[#F4EFEA]"
                >
                  <span>{tableProgressOpen ? "Thu gọn bàn" : "Tiến độ từng bàn"}</span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      tableProgressOpen && "rotate-180",
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Expandable Table Progress Drawer */}
            {tableProgressOpen && (
              <div className="mt-3.5 pt-3.5 border-t border-[#E8E2D9] animate-in fade-in">
                <div className="flex items-center justify-between pb-2">
                  <p className="text-[11px] font-semibold text-[#6B655E] uppercase tracking-wider">
                    Tỷ lệ có mặt theo bàn ({occupancy.tables.length} bàn)
                  </p>
                  <span className="text-[10px] text-[#2F6F4E] font-medium">
                    💡 Bàn đạt 80%+ sẵn sàng lên cỗ
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 max-h-64 overflow-y-auto pr-1">
                  {occupancy.tables.map((t) => (
                    <div
                      key={t.tableName}
                      className={cn(
                        "rounded-xl border p-2.5 transition-all",
                        t.isReadyForFood
                          ? "border-[#2F6F4E] bg-[#ECF5F0] shadow-xs"
                          : "border-[#E8E2D9] bg-[#FAF8F5]",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-[#1F1D1A] truncate">
                          {t.tableName}
                        </span>
                        {t.isReadyForFood && (
                          <span className="rounded-full bg-[#2F6F4E] text-white px-1.5 py-0.2 text-[9px] font-bold">
                            LÊN CỖ
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-baseline justify-between text-[11px]">
                        <span className="text-[#6B655E]">
                          {t.arrivedHeadcount}/{t.assignedHeadcount} người
                        </span>
                        <span
                          className={cn(
                            "font-bold font-mono text-[11px]",
                            t.isReadyForFood ? "text-[#2F6F4E]" : "text-[#1F1D1A]",
                          )}
                        >
                          {t.occupancyPercent}%
                        </span>
                      </div>
                      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-black/5">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            t.isReadyForFood ? "bg-[#2F6F4E]" : "bg-[#8A6D3B]",
                          )}
                          style={{ width: `${Math.min(100, t.occupancyPercent)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 1: Quét QR Check-in */}
        {activeTab === "checkin" && (
          <div className="mt-4">
            <QrCheckInScanner
              weddingSlug={slug}
              guests={liveGuests}
              onGuestsUpdated={(updated) => setLiveGuests(updated)}
            />
          </div>
        )}

        {/* Tab 2: Duyệt ảnh Photo Wall */}
        {activeTab === "moderation" && (
          <div className="mt-4">
            <PhotoModerator
              weddingSlug={slug}
              photos={photos}
              initialApprovalMode={content.photoApprovalMode}
              initialModeration={content.photoModeration}
            />
          </div>
        )}

        {/* Tab 3: Thống kê RSVP & Bàn tiệc */}
        {activeTab === "rsvp" && (
          <div className="mt-4 space-y-6">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
              <div className="rounded-2xl border border-[#E8E2D9] bg-white p-4 shadow-xs">
                <p className="text-[11px] font-medium text-[#6B655E] uppercase tracking-wider">
                  Tổng khách mời
                </p>
                <p className="mt-1 font-mono text-2xl font-bold text-[#1F1D1A]">
                  {stats.totalGuests}
                </p>
                <p className="mt-0.5 text-[11px] text-[#6B655E]">
                  Đã thêm vào danh sách
                </p>
              </div>

              <div className="rounded-2xl border border-[#E8E2D9] bg-white p-4 shadow-xs">
                <p className="text-[11px] font-medium text-[#2F6F4E] uppercase tracking-wider">
                  Sẽ tham dự (Headcount)
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-bold text-[#2F6F4E]">
                    {stats.totalHeadcount}
                  </span>
                  <span className="text-[11px] text-[#6B655E]">
                    ({stats.accepted} + {stats.totalPlusOnes} đi kèm)
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-[#6B655E]">
                  Đã xác nhận có mặt
                </p>
              </div>

              <div className="rounded-2xl border border-[#E8E2D9] bg-white p-4 shadow-xs">
                <p className="text-[11px] font-medium text-[#B89B72] uppercase tracking-wider">
                  Chưa phản hồi
                </p>
                <p className="mt-1 font-mono text-2xl font-bold text-[#B8860B]">
                  {stats.pending}
                </p>
                <p className="mt-0.5 text-[11px] text-[#6B655E]">
                  Cần nhắc gửi lời chúc
                </p>
              </div>

              <div className="rounded-2xl border border-[#E8E2D9] bg-white p-4 shadow-xs">
                <p className="text-[11px] font-medium text-[#7A1C24] uppercase tracking-wider">
                  Khẩu phần ăn
                </p>
                <div className="mt-1 flex items-baseline gap-3">
                  <span className="font-mono text-lg font-bold text-[#1F1D1A]">
                    {stats.meatCount} Mặn
                  </span>
                  <span className="text-[#E8E2D9]">/</span>
                  <span className="font-mono text-lg font-bold text-[#2F6F4E]">
                    {stats.vegCount} Chay
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-[#6B655E]">
                  Để bếp chuẩn bị mâm cỗ
                </p>
              </div>
            </div>

            {/* Guest List Search & Filter Bar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-[#E8E2D9] bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B655E]" />
                <input
                  type="text"
                  placeholder="Tìm tên khách hoặc số bàn..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-full border border-[#E8E2D9] bg-[#FAF8F5] pl-9 pr-4 text-xs text-[#1F1D1A] placeholder:text-[#6B655E] focus:border-[#7A1C24] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: "all" as const, label: "Tất cả", count: stats.totalGuests },
                  { id: "checkedIn" as const, label: "Đã đến", count: stats.checkedIn },
                  { id: "notCheckedIn" as const, label: "Chưa đến", count: stats.totalGuests - stats.checkedIn },
                  { id: "accepted" as const, label: "Đã nhận lời", count: stats.accepted },
                  { id: "pending" as const, label: "Chưa phản hồi", count: stats.pending },
                  { id: "declined" as const, label: "Từ chối", count: stats.declined },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setGuestFilter(pill.id)}
                    className={cn(
                      "flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                      guestFilter === pill.id
                        ? "bg-[#1F1D1A] text-white font-semibold"
                        : "border border-[#E8E2D9] bg-white text-[#6B655E] hover:text-[#1F1D1A]",
                    )}
                  >
                    <span>{pill.label}</span>
                    <span className="font-mono text-[10px] opacity-70">
                      ({pill.count})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Read-Only Guest Table with Seating & Check-in columns */}
            <div className="overflow-hidden rounded-2xl border border-[#E8E2D9] bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#E8E2D9] bg-[#FAF8F5] font-semibold text-[#6B655E]">
                    <tr>
                      <th className="px-5 py-3.5">Khách mời</th>
                      <th className="px-5 py-3.5">Bàn tiệc</th>
                      <th className="px-5 py-3.5">Điểm danh</th>
                      <th className="px-5 py-3.5">RSVP</th>
                      <th className="px-5 py-3.5">Khẩu phần</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D9]/70">
                    {filteredGuests.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-[#6B655E]">
                          Không tìm thấy khách mời nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      filteredGuests.map((guest) => (
                        <tr
                          key={guest.id}
                          className="transition-colors hover:bg-[#FAF8F5]/50"
                        >
                          <td className="px-5 py-3.5 font-medium text-[#1F1D1A]">
                            <p>{guest.name}</p>
                            {guest.relationshipGroup && (
                              <span className="text-[10px] text-[#6B655E]">
                                {guest.relationshipGroup}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {guest.tableNumber ? (
                              <span className="rounded-full bg-[#7A1C24]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#7A1C24]">
                                {guest.tableNumber}
                              </span>
                            ) : (
                              <span className="text-[11px] text-[#6B655E] italic">
                                Chưa xếp bàn
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {guest.checkedInAt ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#2F6F4E]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#2F6F4E]">
                                <Check className="h-3 w-3" />
                                Đã đến ({guest.checkedInCount ?? 1} người) ·{" "}
                                {formatCheckInTime(guest.checkedInAt)}
                              </span>
                            ) : (
                              <span className="text-[11px] text-[#6B655E]">Chưa đến</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {guest.status === "accepted" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#2F6F4E]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#2F6F4E]">
                                <CheckCircle2 className="h-3 w-3" />
                                Tham dự
                                {(guest.plusOnes ?? 0) > 0 && ` (+${guest.plusOnes})`}
                              </span>
                            )}
                            {guest.status === "declined" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#9E3B3B]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#9E3B3B]">
                                <XCircle className="h-3 w-3" />
                                Bận
                              </span>
                            )}
                            {guest.status === "pending" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#B8860B]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#B8860B]">
                                <Clock className="h-3 w-3" />
                                Chờ
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {guest.status === "accepted" ? (
                              guest.diet === "veg" ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#2F6F4E]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#2F6F4E]">
                                  <Utensils className="h-2.5 w-2.5" />
                                  Ăn chay
                                </span>
                              ) : (
                                <span className="text-[#6B655E]">Ăn mặn</span>
                              )
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
