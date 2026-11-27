"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Crown,
  ExternalLink,
  Loader2,
  RotateCw,
  X,
} from "lucide-react";
import QRCode from "qrcode";
import { LANDING_COPY } from "@/config/landing";
import { getPlanLabel } from "@/config/plans";
import { VIP_SALES_ENABLED } from "@/config/pricing";
import { SITE_LINKS } from "@/config/site";
import { ApiError, createPayosOrder, getOrder, listWeddings } from "@/lib/api";
import type { PayosOrderResponse, Wedding, WeddingPlan } from "@/lib/types";
import type { WeddingTemplateMeta } from "@/templates/types";

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

export interface PaymentTransferModalProps {
  plan: Exclude<WeddingPlan, "free"> | null;
  weddingId?: string | null;
  weddings?: Wedding[];
  isAuthenticated?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PaymentTransferModal({
  plan,
  weddingId: initialWeddingId,
  weddings: externalWeddings,
  isAuthenticated = true,
  onClose,
  onSuccess,
}: PaymentTransferModalProps) {
  const router = useRouter();
  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const titleId = React.useId();

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [order, setOrder] = React.useState<PayosOrderResponse | null>(null);
  const [isPaid, setIsPaid] = React.useState(false);
  const [isTimedOut, setIsTimedOut] = React.useState(false);

  const [copiedAccountNo, setCopiedAccountNo] = React.useState(false);
  const [copiedContent, setCopiedContent] = React.useState(false);

  const [userWeddings, setUserWeddings] = React.useState<Wedding[]>(
    externalWeddings || [],
  );
  const [selectedWeddingId, setSelectedWeddingId] = React.useState<string>(
    initialWeddingId || "",
  );
  const [loadingWeddings, setLoadingWeddings] = React.useState(false);

  // Sync external weddings if passed
  React.useEffect(() => {
    if (externalWeddings && externalWeddings.length > 0) {
      setUserWeddings(externalWeddings);
    }
  }, [externalWeddings]);

  // Fetch weddings if not provided
  React.useEffect(() => {
    if (!plan) return;
    if (initialWeddingId) {
      setSelectedWeddingId(initialWeddingId);
      return;
    }
    if (externalWeddings && externalWeddings.length > 0) {
      const eligible =
        externalWeddings.find((w) => w.plan !== "vip" && (plan === "vip" || w.plan === "free")) ||
        externalWeddings[0];
      setSelectedWeddingId(eligible.id);
      return;
    }

    let cancelled = false;
    setLoadingWeddings(true);
    listWeddings()
      .then((items) => {
        if (cancelled) return;
        setUserWeddings(items);
        if (items.length > 0) {
          const eligible =
            items.find((w) => w.plan !== "vip" && (plan === "vip" || w.plan === "free")) ||
            items[0];
          setSelectedWeddingId(eligible.id);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingWeddings(false);
      });

    return () => {
      cancelled = true;
    };
  }, [plan, initialWeddingId, externalWeddings]);

  // Prevent background scrolling, trap escape, check auth
  React.useEffect(() => {
    if (!plan) return;
    if (!isAuthenticated) {
      window.location.assign(
        `/auth/login?returnTo=${encodeURIComponent("/?pay=" + plan)}`,
      );
      return;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [plan, isAuthenticated, onClose]);

  // Create or load order
  const fetchOrder = React.useCallback(
    async (targetWeddingId: string, targetPlan: Exclude<WeddingPlan, "free">) => {
      if (!targetWeddingId) return;
      setIsLoading(true);
      setError(null);
      setIsPaid(false);
      setIsTimedOut(false);

      try {
        const res = await createPayosOrder({
          weddingId: targetWeddingId,
          plan: targetPlan,
        });
        setOrder(res);
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          if (err.code === "UNAUTHORIZED" || err.status === 401) {
            window.location.assign(
              `/auth/login?returnTo=${encodeURIComponent("/?pay=" + targetPlan)}`,
            );
            return;
          }
          if (err.code === "PLAN_LIMIT" || err.code === "VALIDATION") {
            setError(err.message || "Gói không khả dụng hoặc thiệp đã ở gói tương đương.");
            return;
          }
        }
        setError("Không tạo được đơn, vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Trigger order creation when selectedWeddingId and plan are ready
  React.useEffect(() => {
    if (!plan) {
      setOrder(null);
      setError(null);
      setIsPaid(false);
      setIsTimedOut(false);
      return;
    }
    if (!selectedWeddingId) return;
    fetchOrder(selectedWeddingId, plan);
  }, [plan, selectedWeddingId, fetchOrder]);

  // Draw QR code onto canvas
  React.useEffect(() => {
    if (!order?.qrCode || !canvasRef.current) return;
    let cancelled = false;

    // Desktop: 280-320px, Mobile: 240-280px
    const isMobile = window.innerWidth < 640;
    const qrWidth = isMobile ? 260 : 300;

    QRCode.toCanvas(canvasRef.current, order.qrCode, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: qrWidth,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    }).catch((err: unknown) => {
      if (!cancelled) {
        console.error("Lỗi khi vẽ mã VietQR:", err);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [order?.qrCode]);

  // Poll GET /api/orders/:id every 3 seconds for up to 10 minutes (200 polls)
  React.useEffect(() => {
    if (!order?.orderId || isPaid || isTimedOut) return;

    let pollCount = 0;
    const maxPolls = 200; // 200 * 3s = 600s = 10 minutes

    const intervalId = window.setInterval(async () => {
      pollCount += 1;
      if (pollCount >= maxPolls) {
        window.clearInterval(intervalId);
        setIsTimedOut(true);
        return;
      }

      try {
        const check = await getOrder(order.orderId);
        if (check.status === "paid") {
          window.clearInterval(intervalId);
          setIsPaid(true);
          onSuccess?.();
        } else if (check.status === "cancelled") {
          window.clearInterval(intervalId);
          setError("Đơn thanh toán đã bị hủy.");
        }
      } catch {
        // Continue polling on transient errors
      }
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [order?.orderId, isPaid, isTimedOut, onSuccess]);

  if (!plan) return null;

  const planTitle = plan === "vip" ? "Thanh toán gói Pro" : "Thanh toán gói Standard";

  const handleCopyAccountNo = async () => {
    if (!order?.accountNumber) return;
    const ok = await copyText(order.accountNumber);
    if (ok) {
      setCopiedAccountNo(true);
      window.setTimeout(() => setCopiedAccountNo(false), 2000);
    }
  };

  const handleCopyContent = async () => {
    if (!order?.description) return;
    const ok = await copyText(order.description);
    if (ok) {
      setCopiedContent(true);
      window.setTimeout(() => setCopiedContent(false), 2000);
    }
  };

  const noWeddingsFound =
    !loadingWeddings && userWeddings.length === 0 && !initialWeddingId;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-bg/85 sm:backdrop-blur-xs"
      />

      {/* Full-screen sheet on mobile (<640px), centered dialog on desktop (>=640px) */}
      <div className="relative z-10 flex h-full w-full max-w-full flex-col overflow-y-auto bg-surface p-4 text-text sm:h-auto sm:max-h-[92vh] sm:max-w-lg sm:rounded-2xl sm:border sm:border-border sm:p-6 sm:shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3 sm:pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-accent-soft text-text">
              <CreditCard className="h-5 w-5 text-accent-text" aria-hidden="true" />
            </span>
            <div>
              <h2
                id={titleId}
                className="font-display text-xl font-semibold text-accent-text sm:text-2xl"
              >
                {planTitle}
              </h2>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ thanh toán"
            className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:border-accent hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content body */}
        <div className="mt-4 flex-1 space-y-4">
          {/* User has no wedding created yet */}
          {noWeddingsFound && (
            <div className="rounded-xl border border-border bg-surface-alt p-5 text-center">
              <p className="text-sm leading-relaxed text-text">
                Bạn chưa có thiệp cưới nào trong tài khoản. Hãy tạo thiệp cưới trước để nâng cấp và kích hoạt gói {getPlanLabel(plan)}.
              </p>
              <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
                <Link
                  href={`${SITE_LINKS.createWedding}?plan=${plan}`}
                  onClick={onClose}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  Tạo thiệp ngay
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-border px-5 text-sm font-medium text-text hover:bg-surface"
                >
                  Để sau
                </button>
              </div>
            </div>
          )}

          {/* Wedding selection when multiple weddings exist */}
          {!noWeddingsFound && userWeddings.length > 1 && !initialWeddingId && (
            <div className="rounded-xl border border-border bg-bg p-3">
              <label
                htmlFor="wedding-select"
                className="block text-xs font-medium text-text-muted mb-1.5"
              >
                Chọn thiệp cưới áp dụng gói:
              </label>
              <select
                id="wedding-select"
                value={selectedWeddingId}
                onChange={(e) => setSelectedWeddingId(e.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                {userWeddings.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.content?.couple?.groomName && w.content?.couple?.brideName
                      ? `${w.content.couple.groomName} & ${w.content.couple.brideName} (${w.slug}) - Gói ${getPlanLabel(w.plan)}`
                      : `${w.slug} - Gói ${getPlanLabel(w.plan)}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading && (
            <div
              role="status"
              aria-label="Đang tạo đơn hàng và mã VietQR"
              className="space-y-4 py-6 text-center"
            >
              <div className="mx-auto flex h-[260px] w-[260px] max-w-full items-center justify-center rounded-2xl border border-border bg-surface-alt sm:h-[280px] sm:w-[280px]">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-accent-text" />
                  <span className="text-xs font-medium text-text-muted">
                    Đang tạo mã VietQR...
                  </span>
                </div>
              </div>
              <div className="mx-auto h-6 w-40 animate-pulse rounded-md bg-surface-alt" />
              <div className="mx-auto h-4 w-56 animate-pulse rounded-md bg-surface-alt" />
            </div>
          )}

          {/* Error Display */}
          {!isLoading && error && (
            <div className="rounded-xl border border-danger-border bg-danger-bg p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-danger-fg">
                <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
                <p className="text-sm font-medium">{error}</p>
              </div>
              {selectedWeddingId && (
                <button
                  type="button"
                  onClick={() => fetchOrder(selectedWeddingId, plan)}
                  className="mt-4 inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full bg-accent px-5 text-xs font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Thử lại</span>
                </button>
              )}
            </div>
          )}

          {/* Success State (status: paid) */}
          {!isLoading && isPaid && (
            <div className="py-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-success-border bg-success-bg text-success-fg">
                <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-text sm:text-2xl">
                {plan === "vip"
                  ? "Đã kích hoạt gói Pro cho thiệp của bạn."
                  : "Đã kích hoạt gói Standard cho thiệp của bạn."}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-text-muted sm:text-sm">
                Cảm ơn bạn đã tin tưởng dịch vụ. Mọi tính năng cao cấp đã sẵn sàng trên thiệp cưới của bạn.
              </p>
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push("/dashboard");
                  }}
                  className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  Về bảng điều khiển
                </button>
              </div>
            </div>
          )}

          {/* Timeout State (10 minutes passed while pending) */}
          {!isLoading && !isPaid && isTimedOut && order && (
            <div className="space-y-4 rounded-xl border border-border bg-surface-alt p-4 text-center">
              <p className="text-sm leading-relaxed text-text">
                Chúng tôi chưa nhận được khoản chuyển của bạn. Đơn sẽ được kích hoạt tự động khi nhận được tiền, hoặc bạn có thể liên hệ hỗ trợ.
              </p>
              <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5">
                <span className="text-xs text-text-muted">Mã đơn hàng:</span>
                <span className="font-mono text-sm font-bold text-accent-text">
                  {order.orderCode}
                </span>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}

          {/* Active Payment Screen (QR + Details) */}
          {!isLoading && !isPaid && !isTimedOut && !error && order && (
            <div className="space-y-4">
              {/* QR Canvas Container (Centered) */}
              <div className="flex flex-col items-center">
                <div className="relative flex items-center justify-center rounded-2xl border border-border bg-white p-3 shadow-xs">
                  <canvas
                    ref={canvasRef}
                    role="img"
                    aria-label={`Mã QR chuyển khoản cho đơn ${order.orderCode}`}
                    className="mx-auto block aspect-square max-w-full rounded-lg"
                  />
                </div>
                <p className="mt-2 text-center text-[12px] text-text-muted">
                  Đơn sẽ được kích hoạt tự động thường trong vài phút sau khi chuyển khoản.
                </p>
              </div>

              {/* Amount and Transfer Content directly below QR */}
              <div className="rounded-xl border border-border bg-bg p-3.5 space-y-2.5 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-text-muted sm:text-sm">Số tiền:</span>
                  <span className="font-sans text-xl font-bold tracking-tight text-accent-text sm:text-2xl tabular-nums lining-nums">
                    {formatVnd(order.amount)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-border pt-2.5">
                  <span className="text-xs text-text-muted sm:text-sm">
                    Nội dung chuyển khoản:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <code className="rounded bg-surface px-2.5 py-1 font-mono text-xs font-bold text-accent-text sm:text-sm">
                      {order.description}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyContent}
                      aria-label="Sao chép nội dung chuyển khoản"
                      className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center gap-1 rounded-md border border-border bg-surface px-2.5 text-xs font-medium text-text transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                    >
                      {copiedContent ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-accent-text" aria-hidden="true" />
                          <span className="text-accent-text font-semibold">Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] leading-relaxed text-text-muted sm:text-xs">
                  <strong className="font-semibold text-accent-text">Lưu ý: </strong>
                  Nội dung chuyển khoản phải giữ nguyên để hệ thống nhận diện đơn.
                </p>
              </div>

              {/* Bank Details Last */}
              <div className="rounded-xl border border-border bg-surface-alt p-3.5 space-y-2 sm:p-4">
                <p className="text-[11px] font-semibold tracking-wider text-text-muted uppercase">
                  Thông tin tài khoản ngân hàng
                </p>
                <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                  <span className="text-text-muted">Ngân hàng:</span>
                  <span className="font-medium text-text text-right">{order.bin || "VietQR (payOS)"}</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs sm:text-sm border-t border-border/60 pt-1.5">
                  <span className="text-text-muted">Số tài khoản:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-text">
                      {order.accountNumber}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyAccountNo}
                      aria-label="Sao chép số tài khoản"
                      className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center gap-1 rounded-md border border-border bg-surface px-2.5 text-xs font-medium text-text transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                    >
                      {copiedAccountNo ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-accent-text" aria-hidden="true" />
                          <span className="text-accent-text font-semibold">Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs sm:text-sm border-t border-border/60 pt-1.5">
                  <span className="text-text-muted">Chủ tài khoản:</span>
                  <span className="font-medium text-text text-right uppercase">
                    {order.accountName}
                  </span>
                </div>
              </div>

              {/* payOS Checkout Link */}
              {order.checkoutUrl && (
                <div className="text-center pt-1">
                  <a
                    href={order.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-text transition-colors hover:underline"
                  >
                    <span>Mở trang thanh toán bảo mật payOS</span>
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              )}

              {/* Instructions 1 - 4 */}
              <div className="rounded-xl border border-border bg-bg p-3.5 text-xs leading-relaxed text-text-muted sm:p-4">
                <p className="font-semibold text-text mb-1.5">Các bước chuyển khoản:</p>
                <ol className="list-decimal space-y-1 pl-4 text-text-muted">
                  <li>Mở app ngân hàng hoặc ví, chọn quét mã QR.</li>
                  <li>Quét mã. Số tiền và nội dung sẽ tự điền.</li>
                  <li>Kiểm tra lại rồi xác nhận chuyển khoản.</li>
                  <li>Nếu app không tự điền, nhập đúng số tiền và nội dung ở trên.</li>
                </ol>
              </div>

              {/* Status polling hint */}
              <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-text-muted">
                <Loader2 className="h-3 w-3 animate-spin text-accent-text" />
                <span>Hệ thống đang tự động kiểm tra giao dịch...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export interface PlanUpgradeModalProps {
  template: WeddingTemplateMeta | null;
  onClose: () => void;
  onSelectPlan: (plan: Exclude<WeddingPlan, "free">) => void;
}

export function PlanUpgradeModal({
  template,
  onClose,
  onSelectPlan,
}: PlanUpgradeModalProps) {
  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    if (!template) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [template, onClose]);

  if (!template) return null;

  const targetPlan: Exclude<WeddingPlan, "free"> =
    template.plan === "vip" && VIP_SALES_ENABLED ? "vip" : "pro";
  const planName = LANDING_COPY.templates.planBadges[targetPlan];
  const copy = LANDING_COPY.planUpgradeModal;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-bg/85 sm:backdrop-blur-xs"
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface p-5 text-text shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-accent-soft text-text">
              <Crown className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2
              id={titleId}
              className="font-display text-2xl font-semibold text-accent-text"
            >
              {copy.title}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={copy.closeLabel}
            className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:border-accent hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-text">
          {copy.descriptionPrefix}{" "}
          <strong className="font-semibold text-accent-text">
            {template.name}
          </strong>{" "}
          {copy.descriptionMiddle}{" "}
          <strong className="font-semibold text-accent-text">{planName}</strong>{" "}
          {copy.descriptionSuffix}
        </p>

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectPlan(targetPlan);
            }}
            className="inline-flex min-h-[44px] flex-1 cursor-pointer items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            {targetPlan === "vip" ? copy.chooseVipLabel : copy.chooseProLabel}
          </button>
          <a
            href={SITE_LINKS.templatesAnchor}
            onClick={onClose}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full border border-text bg-transparent px-5 text-sm font-medium text-text transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            {copy.chooseFreeInsteadLabel}
          </a>
        </div>
      </div>
    </div>
  );
}
