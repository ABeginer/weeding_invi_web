"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  Image as ImageIcon,
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

export interface FamilyShareGuest {
  id: string;
  name: string;
  relationshipGroup?: string | null;
  status: GuestStatus;
  plusOnes?: number | null;
  diet?: GuestDiet | null;
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

  const [activeTab, setActiveTab] = React.useState<"rsvp" | "moderation">("rsvp");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [guestFilter, setGuestFilter] = React.useState<
    "all" | "accepted" | "pending" | "declined"
  >("all");

  // Tính toán số liệu thống kê RSVP
  const stats = React.useMemo(() => {
    let accepted = 0;
    let declined = 0;
    let pending = 0;
    let totalPlusOnes = 0;
    let vegCount = 0;
    let meatCount = 0;

    for (const g of guests) {
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
      totalGuests: guests.length,
      accepted,
      declined,
      pending,
      totalHeadcount: accepted + totalPlusOnes,
      totalPlusOnes,
      vegCount,
      meatCount,
    };
  }, [guests]);

  // Lọc danh sách khách mời
  const filteredGuests = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return guests.filter((g) => {
      if (guestFilter !== "all" && g.status !== guestFilter) return false;
      if (q && !g.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [guestFilter, guests, searchQuery]);

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
              <span className="text-xs text-[#6B655E]">Dành riêng cho người thân &amp; Planner</span>
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
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 border-b border-[#E8E2D9] pb-4">
          <button
            type="button"
            onClick={() => setActiveTab("rsvp")}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold transition-all",
              activeTab === "rsvp"
                ? "bg-[#7A1C24] text-white shadow-xs"
                : "bg-white border border-[#E8E2D9] text-[#6B655E] hover:text-[#1F1D1A]",
            )}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Thống kê RSVP &amp; Khách mời</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-mono",
                activeTab === "rsvp" ? "bg-white/20 text-white" : "bg-[#FAF8F5] text-[#1F1D1A]",
              )}
            >
              {guests.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("moderation")}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold transition-all",
              activeTab === "moderation"
                ? "bg-[#7A1C24] text-white shadow-xs"
                : "bg-white border border-[#E8E2D9] text-[#6B655E] hover:text-[#1F1D1A]",
            )}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Duyệt ảnh Photo Wall</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-mono",
                activeTab === "moderation" ? "bg-white/20 text-white" : "bg-[#FAF8F5] text-[#1F1D1A]",
              )}
            >
              {photos.length}
            </span>
          </button>
        </div>

        {/* Tab 1: RSVP & Khách mời */}
        {activeTab === "rsvp" && (
          <div className="mt-6 space-y-6">
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
                    ({stats.accepted} khách + {stats.totalPlusOnes} đi kèm)
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
                  placeholder="Tìm tên khách mời..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-full border border-[#E8E2D9] bg-[#FAF8F5] pl-9 pr-4 text-xs text-[#1F1D1A] placeholder:text-[#6B655E] focus:border-[#7A1C24] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: "all" as const, label: "Tất cả", count: stats.totalGuests },
                  { id: "accepted" as const, label: "Đã nhận lời", count: stats.accepted },
                  { id: "pending" as const, label: "Chưa phản hồi", count: stats.pending },
                  { id: "declined" as const, label: "Bận không đến", count: stats.declined },
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

            {/* Read-Only Guest Table */}
            <div className="overflow-hidden rounded-2xl border border-[#E8E2D9] bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#E8E2D9] bg-[#FAF8F5] font-semibold text-[#6B655E]">
                    <tr>
                      <th className="px-5 py-3.5">Khách mời</th>
                      <th className="px-5 py-3.5">Trạng thái</th>
                      <th className="px-5 py-3.5">Người đi kèm</th>
                      <th className="px-5 py-3.5">Khẩu phần</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D9]/70">
                    {filteredGuests.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-[#6B655E]">
                          Không tìm thấy khách mời nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      filteredGuests.map((guest) => (
                        <tr key={guest.id} className="transition-colors hover:bg-[#FAF8F5]/50">
                          <td className="px-5 py-3.5 font-medium text-[#1F1D1A]">
                            {guest.name}
                          </td>
                          <td className="px-5 py-3.5">
                            {guest.status === "accepted" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#2F6F4E]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#2F6F4E]">
                                <CheckCircle2 className="h-3 w-3" />
                                Tham dự
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
                          <td className="px-5 py-3.5 font-mono text-[#6B655E]">
                            {guest.status === "accepted" && (guest.plusOnes ?? 0) > 0 ? (
                              <span className="rounded-full bg-[#F4EFEA] px-2 py-0.5 text-[11px] font-semibold text-[#1F1D1A]">
                                +{guest.plusOnes} người
                              </span>
                            ) : (
                              "—"
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

        {/* Tab 2: Duyệt ảnh Photo Wall */}
        {activeTab === "moderation" && (
          <div className="mt-6">
            <PhotoModerator
              weddingSlug={slug}
              photos={photos}
              initialApprovalMode={content.photoApprovalMode}
              initialModeration={content.photoModeration}
            />
          </div>
        )}
      </main>
    </div>
  );
}
