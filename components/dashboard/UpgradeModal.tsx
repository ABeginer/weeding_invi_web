"use client";

import * as React from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  Crown,
  ExternalLink,
  Loader2,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import QRCode from "qrcode";
import { createPayosOrder, getOrder } from "@/lib/api";
import type { PayosOrderResponse, WeddingPlan } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
}

async function copyText(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const result = document.execCommand("copy");
    document.body.removeChild(textarea);
    return result;
  } catch {
    return false;
  }
}

export interface UpgradeModalProps {
  open: boolean;
  currentPlan: WeddingPlan;
  weddingId: string;
  initialTargetPlan?: "pro" | "vip";
  onClose: () => void;
  onSuccess: () => void;
}

export function UpgradeModal({
  open,
  currentPlan,
  weddingId,
  initialTargetPlan,
  onClose,
  onSuccess,
}: UpgradeModalProps) {
  const [targetPlan, setTargetPlan] = React.useState<"pro" | "vip">(
    currentPlan === "pro" ? "vip" : initialTargetPlan || "pro",
  );

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [order, setOrder] = React.useState<PayosOrderResponse | null>(null);
  const [isPaid, setIsPaid] = React.useState(false);

  const [copiedAccount, setCopiedAccount] = React.useState(false);
  const [copiedAmount, setCopiedAmount] = React.useState(false);
  const [copiedContent, setCopiedContent] = React.useState(false);

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // Cập nhật targetPlan khi prop hoặc currentPlan thay đổi
  React.useEffect(() => {
    if (currentPlan === "pro") {
      setTargetPlan("vip");
    } else if (initialTargetPlan) {
      setTargetPlan(initialTargetPlan);
    }
  }, [currentPlan, initialTargetPlan]);

  // Ngăn cuộn trang & đóng khi nhấn Escape
  React.useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  // Tạo đơn hàng thanh toán payOS
  const fetchOrder = React.useCallback(
    async (planToOrder: "pro" | "vip") => {
      setIsLoading(true);
      setError(null);
      setIsPaid(false);
      setOrder(null);

      try {
        const res = await createPayosOrder({
          weddingId,
          plan: planToOrder,
        });
        setOrder(res);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Không thể khởi tạo cổng thanh toán payOS. Vui lòng thử lại.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [weddingId],
  );

  // Tự động gọi payOS khi mở modal hoặc đổi targetPlan
  React.useEffect(() => {
    if (!open) {
      setOrder(null);
      setError(null);
      setIsPaid(false);
      return;
    }
    fetchOrder(targetPlan);
  }, [open, targetPlan, fetchOrder]);

  // Vẽ mã VietQR từ chuỗi EMVCo của payOS
  React.useEffect(() => {
    if (!order?.qrCode || !canvasRef.current) return;
    let cancelled = false;

    QRCode.toCanvas(canvasRef.current, order.qrCode, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 250,
      color: {
        dark: "#1F1D1A",
        light: "#FFFFFF",
      },
    }).catch((err) => {
      if (!cancelled) {
        console.error("Lỗi khi vẽ mã VietQR:", err);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [order?.qrCode]);

  // Polling trạng thái đơn hàng mỗi 3 giây (giới hạn tối đa 100 lần ~ 5 phút, guard document.hidden)
  React.useEffect(() => {
    if (!order?.orderId || isPaid || !open) return;

    let pollCount = 0;
    const maxPolls = 100;

    const intervalId = window.setInterval(async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      pollCount += 1;
      if (pollCount > maxPolls) {
        window.clearInterval(intervalId);
        return;
      }
      try {
        const statusRes = await getOrder(order.orderId);
        if (statusRes.status === "paid") {
          window.clearInterval(intervalId);
          setIsPaid(true);
        }
      } catch {
        // Bỏ qua lỗi mạng tức thời khi polling
      }
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [order?.orderId, isPaid, open]);

  if (!open) return null;

  const handleCopy = async (
    text: string,
    setter: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    const success = await copyText(text);
    if (success) {
      setter(true);
      window.setTimeout(() => setter(false), 2000);
    }
  };

  const handleFinishSuccess = () => {
    onSuccess();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1F1D1A]/65 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#B89B72]/30 bg-[#FAF8F5] text-[#1F1D1A] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8E2D9] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7A1C24]/10 text-[#7A1C24]">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#1F1D1A] sm:text-xl">
                Nâng cấp gói dịch vụ
              </h2>
              <p className="text-xs text-[#6B655E]">
                Thanh toán VietQR tự động · Kích hoạt tức thì 1–3s
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-[#6B655E] transition-colors hover:bg-[#E8E2D9]/60 hover:text-[#1F1D1A]"
            aria-label="Đóng hộp thoại"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Màn hình chúc mừng khi thanh toán thành công */}
          {isPaid ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2F6F4E]/15 text-[#2F6F4E]">
                <CheckCircle2 className="h-10 w-10 animate-bounce" />
              </div>
              <h3 className="mt-4 font-serif text-2xl font-bold text-[#1F1D1A]">
                Nâng cấp thành công!
              </h3>
              <p className="mt-2 max-w-md text-sm text-[#6B655E]">
                Chúc mừng bạn đã mở khoá toàn bộ tính năng của{" "}
                <strong className="text-[#7A1C24]">
                  {targetPlan === "vip" ? "Gói Pro" : "Gói Standard"}
                </strong>
                . Thiệp cưới của bạn đã được kích hoạt đặc quyền ngay lập tức.
              </p>
              <button
                type="button"
                onClick={handleFinishSuccess}
                className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-[#7A1C24] px-6 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#5E141B]"
              >
                <span>Bắt đầu trải nghiệm ngay</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Lựa chọn gói nâng cấp */}
              {currentPlan === "free" && (
                <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-[#E8E2D9] bg-white p-1.5">
                  <button
                    type="button"
                    onClick={() => setTargetPlan("pro")}
                    className={cn(
                      "flex flex-col items-center rounded-lg py-2.5 px-2 transition-all",
                      targetPlan === "pro"
                        ? "border border-[#7A1C24]/30 bg-[#FAF8F5] text-[#7A1C24] shadow-xs"
                        : "text-[#6B655E] hover:text-[#1F1D1A]",
                    )}
                  >
                    <div className="flex items-center gap-1 font-semibold text-sm">
                      <Zap className="h-4 w-4" />
                      <span>Gói Standard</span>
                    </div>
                    <span className="text-xs font-bold font-sans text-[#7A1C24]">
                      159.000 đ
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetPlan("vip")}
                    className={cn(
                      "flex flex-col items-center rounded-lg py-2.5 px-2 transition-all",
                      targetPlan === "vip"
                        ? "border border-[#D8B15B]/70 bg-[#141210] text-[#D8B15B] shadow-xs"
                        : "text-[#6B655E] hover:text-[#1F1D1A]",
                    )}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-sm">
                      <Crown className="h-4 w-4" />
                      <span>Gói Pro</span>
                    </div>
                    <span className="text-xs font-bold font-sans text-[#D8B15B]">
                      399.000 đ
                    </span>
                  </button>
                </div>
              )}

              {/* Thông tin chênh lệch nếu nâng cấp từ Standard lên Pro */}
              {currentPlan === "pro" && (
                <div className="rounded-xl border border-[#B89B72]/40 bg-[#F4EFEA] p-3 text-xs text-[#1F1D1A]">
                  <p className="font-semibold text-[#7A1C24]">
                    Nâng cấp từ Standard lên Pro
                  </p>
                  <p className="mt-0.5 text-[#6B655E]">
                    Chỉ cần thanh toán phần chênh lệch:{" "}
                    <strong className="font-sans font-bold text-[#7A1C24]">
                      240.000 đ
                    </strong>{" "}
                    (399k - 159k đã đóng).
                  </p>
                </div>
              )}

              {/* Danh sách đặc quyền */}
              <div className="rounded-xl border border-[#E8E2D9] bg-white p-3.5 text-xs">
                <p className="font-semibold text-[#1F1D1A]">
                  Đặc quyền nổi bật của {targetPlan === "vip" ? "Gói Pro" : "Gói Standard"}:
                </p>
                <ul className="mt-2 space-y-1.5 text-[#6B655E]">
                  {targetPlan === "pro" ? (
                    <>
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-[#2F6F4E] shrink-0" />
                        <span>Không giới hạn số lượng khách mời &amp; lượt xem</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-[#2F6F4E] shrink-0" />
                        <span>Mở đường link thiệp chung chia sẻ trên MXH</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-[#2F6F4E] shrink-0" />
                        <span>30 ảnh album cưới HD &amp; 2 ảnh VietQR mừng cưới</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-[#2F6F4E] shrink-0" />
                        <span>Xuất danh sách RSVP &amp; Lời chúc ra Excel</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-[#2F6F4E] shrink-0" />
                        <span>Toàn bộ đặc quyền không giới hạn của Gói Standard</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-[#2F6F4E] shrink-0" />
                        <span>Chiếu ảnh khách chụp trực tiếp lên màn hình LED sảnh tiệc</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-[#2F6F4E] shrink-0" />
                        <span>Xếp bàn tiệc &amp; Check-in đón khách bằng mã QR</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-[#2F6F4E] shrink-0" />
                        <span>50 ảnh album cưới HD &amp; Lưu trữ kỷ niệm 2 năm</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* Phần quét mã QR payOS */}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#7A1C24]" />
                  <p className="mt-3 text-xs text-[#6B655E]">
                    Đang kết nối cổng thanh toán payOS...
                  </p>
                </div>
              ) : error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-xs text-red-700">
                  <p>{error}</p>
                  <button
                    type="button"
                    onClick={() => fetchOrder(targetPlan)}
                    className="mt-3 inline-flex h-8 items-center justify-center rounded-lg bg-red-600 px-3 font-medium text-white hover:bg-red-700"
                  >
                    Thử lại
                  </button>
                </div>
              ) : order ? (
                <div className="space-y-4">
                  {/* Mã QR */}
                  <div className="flex flex-col items-center rounded-xl border border-[#E8E2D9] bg-white p-4">
                    <p className="text-xs font-semibold text-[#1F1D1A]">
                      Quét mã VietQR bằng bất kỳ App ngân hàng nào
                    </p>
                    <div className="mt-3 rounded-lg border border-[#E8E2D9] p-2 bg-white shadow-xs">
                      <canvas ref={canvasRef} className="max-w-full" />
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#2F6F4E]">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                      <span>Hệ thống tự động kích hoạt sau khi chuyển 1–3 giây</span>
                    </div>
                  </div>

                  {/* Thông tin chuyển khoản sao chép 1 chạm */}
                  <div className="divide-y divide-[#E8E2D9] rounded-xl border border-[#E8E2D9] bg-white text-xs">
                    <div className="flex items-center justify-between p-3">
                      <span className="text-[#6B655E]">Ngân hàng:</span>
                      <span className="font-semibold text-[#1F1D1A]">
                        {order.bin || "VietQR (payOS)"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3">
                      <span className="text-[#6B655E]">Số tài khoản:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#1F1D1A]">
                          {order.accountNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(order.accountNumber, setCopiedAccount)}
                          className="inline-flex items-center gap-1 rounded-md border border-[#E8E2D9] px-2 py-1 text-[11px] font-medium text-[#1F1D1A] transition hover:bg-[#FAF8F5]"
                        >
                          {copiedAccount ? (
                            <Check className="h-3 w-3 text-[#2F6F4E]" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span>{copiedAccount ? "Đã chép" : "Chép"}</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3">
                      <span className="text-[#6B655E]">Chủ tài khoản:</span>
                      <span className="font-semibold text-[#1F1D1A]">
                        {order.accountName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3">
                      <span className="text-[#6B655E]">Số tiền:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-bold text-[#7A1C24]">
                          {formatVnd(order.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(String(order.amount), setCopiedAmount)}
                          className="inline-flex items-center gap-1 rounded-md border border-[#E8E2D9] px-2 py-1 text-[11px] font-medium text-[#1F1D1A] transition hover:bg-[#FAF8F5]"
                        >
                          {copiedAmount ? (
                            <Check className="h-3 w-3 text-[#2F6F4E]" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span>{copiedAmount ? "Đã chép" : "Chép"}</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3">
                      <span className="text-[#6B655E]">Nội dung CK:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#7A1C24]">
                          {order.description}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(order.description, setCopiedContent)}
                          className="inline-flex items-center gap-1 rounded-md border border-[#E8E2D9] px-2 py-1 text-[11px] font-medium text-[#1F1D1A] transition hover:bg-[#FAF8F5]"
                        >
                          {copiedContent ? (
                            <Check className="h-3 w-3 text-[#2F6F4E]" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span>{copiedContent ? "Đã chép" : "Chép"}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Link mở trang thanh toán payOS dự phòng */}
                  {order.checkoutUrl && (
                    <div className="text-center pt-1">
                      <a
                        href={order.checkoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A1C24] transition hover:underline"
                      >
                        <span>Mở trang thanh toán bảo mật payOS</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#E8E2D9] bg-white px-5 py-3 text-xs text-[#6B655E]">
          <a
            href="https://zalo.me/0902955594"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-[#7A1C24] hover:underline"
          >
            Cần hỗ trợ? Zalo: 0902 955 594
          </a>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#E8E2D9] px-3.5 py-1.5 font-medium text-[#1F1D1A] transition hover:bg-[#FAF8F5]"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
