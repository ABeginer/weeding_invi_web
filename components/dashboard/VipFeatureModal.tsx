"use client";

import * as React from "react";
import Link from "next/link";
import { Crown, Tv, QrCode, KeyRound, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { LedMiniDemo } from "./LedMiniDemo";

interface VipFeatureModalProps {
  open: boolean;
  onClose: () => void;
  /** Link trực tiếp tới thanh toán hoặc anchor bảng giá */
  upgradeHref?: string;
}

export function VipFeatureModal({
  open,
  onClose,
  upgradeHref = "/#bang-gia",
}: VipFeatureModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Đặc quyền sảnh tiệc cưới (Gói Pro)"
      description="Biến tiệc cưới thêm sôi động, đón khách gọn gàng và lưu giữ trọn vẹn mọi khoảnh khắc."
      className="max-w-lg"
    >
      <div className="space-y-4 pt-1">
        {/* Visual Mini Demo */}
        <LedMiniDemo />

        {/* Benefits Card */}
        <div className="rounded-2xl border border-[#E8E2D9] bg-[#FAF8F5] p-4 sm:p-5 text-xs text-[#1F1D1A] space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 font-semibold text-[#7A1C24] text-sm">
            <Crown className="h-4 w-4 text-[#B89B72]" />
            <span>Gói Pro giúp đám cưới của bạn có thêm gì?</span>
          </div>

          <div className="space-y-2.5 text-[#3D3A36]">
            {/* 1. Màn hình LED */}
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white border border-[#E8E2D9] text-[#7A1C24]">
                <Tv className="h-3 w-3" />
              </span>
              <p className="leading-relaxed">
                <strong className="text-[#1F1D1A] font-semibold">
                  Chiếu ảnh khách chụp trực tiếp lên màn hình LED:
                </strong>{" "}
                Khách đến dự chỉ cần quét mã QR đặt trên bàn tiệc để gửi ảnh kỷ niệm chụp tại sảnh — ảnh sẽ tự động hiện lên màn hình lớn (bạn có thể bật duyệt trước khi chiếu).
              </p>
            </div>

            {/* 2. Xếp bàn & QR check-in */}
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white border border-[#E8E2D9] text-[#7A1C24]">
                <QrCode className="h-3 w-3" />
              </span>
              <p className="leading-relaxed">
                <strong className="text-[#1F1D1A] font-semibold">
                  Xếp bàn tiệc &amp; Check-in bằng mã QR:
                </strong>{" "}
                Mỗi khách nhận sẵn số bàn trên thiệp mời điện tử; lễ tân chỉ cần dùng điện thoại quét mã là biết ngay khách ngồi bàn nào, khỏi dò sổ giấy.
              </p>
            </div>

            {/* 3. Trợ lý PIN 4 số */}
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white border border-[#E8E2D9] text-[#7A1C24]">
                <KeyRound className="h-3 w-3" />
              </span>
              <p className="leading-relaxed">
                <strong className="text-[#1F1D1A] font-semibold">
                  Nhờ người nhà hỗ trợ bằng mã PIN 4 số:
                </strong>{" "}
                Gửi link riêng kèm mã 4 số cho phụ dâu/người thân giúp duyệt ảnh và điểm danh khách, không cần đưa tài khoản chính của bạn.
              </p>
            </div>

            {/* 4. In bảng QR & Tải trọn bộ ảnh ZIP */}
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white border border-[#E8E2D9] text-[#7A1C24]">
                <Download className="h-3 w-3" />
              </span>
              <p className="leading-relaxed">
                <strong className="text-[#1F1D1A] font-semibold">
                  In sẵn bảng QR để bàn &amp; tải trọn bộ ảnh kỷ niệm:
                </strong>{" "}
                Xuất sẵn file bảng mã QR chuẩn in (A5/A6) để đặt tại bàn tiệc và tải toàn bộ ảnh khách đã gửi về máy chỉ với 1 nút bấm sau tiệc.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E8E2D9]">
          <Button variant="outline" onClick={onClose} className="rounded-full px-4 text-xs font-medium">
            Để sau
          </Button>
          <Link
            href={upgradeHref}
            onClick={onClose}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#7A1C24] px-5 text-xs font-semibold text-[#FAF8F5] shadow-xs transition-colors hover:bg-[#60161C] active:scale-95"
          >
            <span>Nâng cấp gói Pro ngay →</span>
          </Link>
        </div>
      </div>
    </Dialog>
  );
}
