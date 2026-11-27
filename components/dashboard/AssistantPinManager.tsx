"use client";

import * as React from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  ExternalLink,
  Lock,
  QrCode,
  ShieldCheck,
  Tv,
  Users,
  Loader2,
} from "lucide-react";
import { updateContent } from "@/lib/api";
import type { WeddingContent, WeddingPlan } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { VipFeatureModal } from "./VipFeatureModal";

interface AssistantPinManagerProps {
  weddingId: string;
  weddingSlug: string;
  plan: WeddingPlan;
  content: WeddingContent;
  onContentChange: (nextContent: WeddingContent) => void;
  className?: string;
}

export function AssistantPinManager({
  weddingId,
  weddingSlug,
  plan,
  content,
  onContentChange,
  className,
}: AssistantPinManagerProps) {
  const { showToast } = useToast();

  const [pinEnabled, setPinEnabled] = React.useState<boolean>(
    content.sharePinEnabled ?? false,
  );
  const [pinValue, setPinValue] = React.useState<string>(content.sharePin ?? "");
  const [pinBusy, setPinBusy] = React.useState(false);
  const [copiedShareLink, setCopiedShareLink] = React.useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = React.useState(false);

  React.useEffect(() => {
    setPinEnabled(content.sharePinEnabled ?? false);
  }, [content.sharePinEnabled]);

  React.useEffect(() => {
    setPinValue(content.sharePin ?? "");
  }, [content.sharePin]);

  const handleTogglePinEnabled = async () => {
    if (plan !== "vip") {
      setUpgradeDialogOpen(true);
      return;
    }
    const nextEnabled = !pinEnabled;
    setPinBusy(true);
    setPinEnabled(nextEnabled);

    const nextContent: WeddingContent = {
      ...content,
      sharePinEnabled: nextEnabled,
    };

    try {
      const saved = await updateContent(weddingId, { content: nextContent });
      onContentChange(saved.content);
      showToast(
        nextEnabled
          ? "Đã bật Cổng trợ lý gia đình (/share)"
          : "Đã tắt Cổng trợ lý gia đình",
        "success",
      );
    } catch {
      setPinEnabled(!nextEnabled);
      showToast("Không thể cập nhật cài đặt mã PIN", "error");
    } finally {
      setPinBusy(false);
    }
  };

  const handleSavePin = async () => {
    if (pinValue.length !== 4) {
      showToast("Mã PIN phải gồm đúng 4 chữ số", "error");
      return;
    }
    setPinBusy(true);
    const nextContent: WeddingContent = {
      ...content,
      sharePinEnabled: true,
      sharePin: pinValue,
    };

    try {
      const saved = await updateContent(weddingId, { content: nextContent });
      onContentChange(saved.content);
      setPinEnabled(true);
      showToast("Đã lưu mã PIN mới thành công", "success");
    } catch {
      showToast("Không thể lưu mã PIN", "error");
    } finally {
      setPinBusy(false);
    }
  };

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/share/${weddingSlug}`
      : `/share/${weddingSlug}`;

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedShareLink(true);
    showToast("Đã sao chép link Cổng trợ lý tiệc cưới", "success");
    window.setTimeout(() => setCopiedShareLink(false), 2000);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Thẻ giới thiệu & Quản lý chính */}
      <div className="rounded-2xl border border-[#E8E2D9] bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FAF8F5] text-[#7A1C24] border border-[#E8E2D9]">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <h3 className="font-serif text-lg sm:text-xl font-semibold text-[#1F1D1A]">
                Cổng trợ lý tiệc cưới &amp; Điểm danh check-in
              </h3>
              <span className="rounded-full bg-[#141210] border border-[#D8B15B]/70 px-2.5 py-0.5 text-[10px] font-bold text-[#D8B15B] uppercase tracking-wider">
                Pro
              </span>
              <span className="rounded-full bg-[#FAF8F5] border border-[#E8E2D9] px-2 py-0.5 text-[10px] font-bold text-[#6B655E] uppercase">
                4-DIGIT PIN
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#6B655E] leading-relaxed">
              Cung cấp link bảo mật bằng mã PIN 4 số cho người thân, phụ dâu hoặc wedding planner để quét mã QR check-in sảnh tiệc, duyệt ảnh Photo Wall và tra cứu bàn tiệc mà không cần chia sẻ tài khoản đăng nhập của bạn.
            </p>
          </div>

          {/* Toggle Button (Bug 10 Fix: clean horizontal pill with whitespace-nowrap) */}
          <div className="shrink-0 pt-1">
            <button
              type="button"
              onClick={handleTogglePinEnabled}
              disabled={pinBusy}
              className={cn(
                "inline-flex items-center gap-2 whitespace-nowrap shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer",
                plan !== "vip"
                  ? "border border-[#E8E2D9] bg-[#FAF8F5] text-[#6B655E] hover:border-[#B89B72]"
                  : pinEnabled
                    ? "bg-[#2F6F4E] text-white shadow-xs hover:bg-[#25583E]"
                    : "border border-[#E8E2D9] bg-[#FAF8F5] text-[#6B655E] hover:text-[#1F1D1A] hover:border-[#7A1C24]",
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  plan === "vip" && pinEnabled
                    ? "bg-white animate-pulse"
                    : "bg-[#8A6D3B]",
                )}
              />
              <span>
                {plan !== "vip"
                  ? "Khóa tính năng (Pro)"
                  : pinEnabled
                    ? "Đang bật cổng trợ lý"
                    : "Đang tắt"}
              </span>
            </button>
          </div>
        </div>

        {/* Khóa tính năng nếu không phải Pro */}
        {plan !== "vip" ? (
          <div
            onClick={() => setUpgradeDialogOpen(true)}
            className="mt-5 flex cursor-pointer flex-col gap-2 rounded-xl border border-dashed border-[#B89B72]/50 bg-[#FAF8F5] p-4 transition-colors hover:border-[#7A1C24]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#8A6D3B]">
                <Lock className="h-4 w-4 shrink-0 text-[#B89B72]" />
                <span>Tính năng Cổng trợ lý PIN 4 số chỉ khả dụng ở gói Pro.</span>
              </div>
              <span className="text-xs font-semibold text-[#7A1C24] underline underline-offset-2">
                Tìm hiểu đặc quyền Pro &amp; Nâng cấp →
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#6B655E]">
              Tạo mã PIN 4 số để phụ dâu / người nhà duyệt ảnh và check-in khách mà không cần chia sẻ tài khoản.
            </p>
          </div>
        ) : (
          pinEnabled && (
            <div className="mt-6 pt-5 border-t border-[#E8E2D9] space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Thiết lập mã PIN */}
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="assistant-share-pin-input"
                    className="text-xs font-medium text-[#1F1D1A] whitespace-nowrap"
                  >
                    Mã PIN bảo mật 4 số:
                  </label>
                  <input
                    id="assistant-share-pin-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={pinValue}
                    onChange={(e) =>
                      setPinValue(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    placeholder="1234"
                    className="h-9 w-24 rounded-xl border border-[#E8E2D9] bg-white px-3 text-center font-mono text-base font-bold tracking-widest text-[#1F1D1A] focus:border-[#7A1C24] focus:outline-none shadow-2xs"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleSavePin}
                    disabled={
                      pinBusy ||
                      pinValue.length !== 4 ||
                      pinValue === content.sharePin
                    }
                    className="h-9 px-3 text-xs"
                  >
                    {pinBusy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Lưu PIN"
                    )}
                  </Button>
                </div>

                {/* Nút hành động với link */}
                <div className="flex items-center gap-2">
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[#E8E2D9] bg-white px-3 text-xs font-medium text-[#1F1D1A] transition-colors hover:border-[#7A1C24] hover:text-[#7A1C24]"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-[#6B655E]" />
                    <span>Mở thử</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[#7A1C24] bg-[#7A1C24] px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#5E141B] active:scale-95"
                  >
                    {copiedShareLink ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>
                      {copiedShareLink ? "Đã sao chép link" : "Sao chép link trợ lý"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Hộp hiển thị URL link */}
              <div className="rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] p-3 text-xs text-[#6B655E] flex items-center justify-between gap-2 overflow-hidden">
                <span className="font-mono truncate">{shareUrl}</span>
                <span className="shrink-0 text-[11px] text-[#B89B72] font-medium">
                  {content.sharePin ? `PIN: ${content.sharePin}` : "Chưa cài PIN"}
                </span>
              </div>
            </div>
          )
        )}
      </div>

      {/* 3 Thẻ tính năng hỗ trợ của Cổng Trợ Lý */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Feature 1 */}
        <div className="rounded-2xl border border-[#E8E2D9] bg-white p-4 sm:p-5 shadow-2xs space-y-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ECF5F0] text-[#2F6F4E]">
            <QrCode className="h-5 w-5" />
          </div>
          <h4 className="font-semibold text-sm text-[#1F1D1A]">
            Quét QR Check-in sảnh tiệc
          </h4>
          <p className="text-xs text-[#6B655E] leading-relaxed">
            Dùng camera điện thoại quét thẻ Boarding Pass của khách để đánh dấu &quot;Đã đến&quot; và tra cứu nhanh số bàn tiệc thời gian thực.
          </p>
        </div>

        {/* Feature 2 */}
        <div className="rounded-2xl border border-[#E8E2D9] bg-white p-4 sm:p-5 shadow-2xs space-y-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF8F5] text-[#7A1C24] border border-[#E8E2D9]">
            <Tv className="h-5 w-5" />
          </div>
          <h4 className="font-semibold text-sm text-[#1F1D1A]">
            1-Chạm duyệt ảnh Photo Wall
          </h4>
          <p className="text-xs text-[#6B655E] leading-relaxed">
            Phụ dâu hoặc người thân duyệt nhanh ảnh khách chụp tại bàn trước khi ảnh hiển thị lên màn hình LED sân khấu.
          </p>
        </div>

        {/* Feature 3 */}
        <div className="rounded-2xl border border-[#E8E2D9] bg-white p-4 sm:p-5 shadow-2xs space-y-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF8F5] text-[#8A6D3B] border border-[#E8E2D9]">
            <Users className="h-5 w-5" />
          </div>
          <h4 className="font-semibold text-sm text-[#1F1D1A]">
            Tra cứu khách &amp; RSVP an toàn
          </h4>
          <p className="text-xs text-[#6B655E] leading-relaxed">
            Xem danh sách khách xác nhận tham dự và số lượng cỗ chay/mặn ở chế độ chỉ đọc, bảo mật toàn bộ tài khoản chính của dâu rể.
          </p>
        </div>
      </div>

      {/* Modal giới thiệu & nâng cấp gói Pro */}
      <VipFeatureModal
        open={upgradeDialogOpen}
        onClose={() => setUpgradeDialogOpen(false)}
      />
    </div>
  );
}
