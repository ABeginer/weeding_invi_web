"use client";

import * as React from "react";
import Link from "next/link";
import { Check, CheckCircle2, Clock, X, XCircle } from "lucide-react";
import {
  cancelOpsOrder,
  confirmOpsOrder,
  formatDateTime,
  formatVnd,
  getOpsOrders,
  type OpsOrder,
  type OpsOrderStatus,
} from "@/lib/ops-api";
import { OpsTable } from "@/components/ops/OpsTable";
import { OpsPagination } from "@/components/ops/OpsPagination";
import { ActionConfirmDialog } from "@/components/ops/ActionConfirmDialog";

const TABS: { id: OpsOrderStatus; label: string }[] = [
  { id: "pending", label: "Chờ thanh toán" },
  { id: "paid", label: "Đã thanh toán" },
  { id: "cancelled", label: "Đã hủy" },
];

export default function OpsOrdersPage() {
  const [activeTab, setActiveTab] = React.useState<OpsOrderStatus>("pending");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [orders, setOrders] = React.useState<OpsOrder[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Toast message
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Confirm order dialog states
  const [confirmingOrder, setConfirmingOrder] = React.useState<OpsOrder | null>(null);
  const [isSubmittingConfirm, setIsSubmittingConfirm] = React.useState(false);
  const [confirmError, setConfirmError] = React.useState<string | null>(null);

  // Cancel order dialog states
  const [cancellingOrder, setCancellingOrder] = React.useState<OpsOrder | null>(null);
  const [isSubmittingCancel, setIsSubmittingCancel] = React.useState(false);
  const [cancelError, setCancelError] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const loadOrders = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getOpsOrders({
        status: activeTab,
        page,
      });
      setOrders(res.items);
      setTotalPages(res.totalPages);
    } catch {
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, page]);

  React.useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleTabChange = (tab: OpsOrderStatus) => {
    setActiveTab(tab);
    setPage(1);
  };

  // Confirm order action
  const handleConfirmOrder = async (reason: string) => {
    if (!confirmingOrder) return;
    setIsSubmittingConfirm(true);
    setConfirmError(null);
    try {
      await confirmOpsOrder(confirmingOrder.id, reason);
      setConfirmingOrder(null);
      showToast(`Đã xác nhận thanh toán thành công đơn ${confirmingOrder.code}!`);
      await loadOrders();
    } catch (err: unknown) {
      const isValidation =
        (err as { code?: string })?.code === "VALIDATION" ||
        (err instanceof Error && err.message.includes("đã được xử lý"));
      if (isValidation) {
        setConfirmError("Đơn này đã được xử lý.");
        await loadOrders();
      } else {
        setConfirmError(
          err instanceof Error ? err.message : "Không thể xác nhận đơn hàng.",
        );
      }
    } finally {
      setIsSubmittingConfirm(false);
    }
  };

  // Cancel order action
  const handleCancelOrder = async (reason: string) => {
    if (!cancellingOrder) return;
    setIsSubmittingCancel(true);
    setCancelError(null);
    try {
      await cancelOpsOrder(cancellingOrder.id, reason);
      setCancellingOrder(null);
      showToast(`Đã hủy đơn hàng ${cancellingOrder.code}.`);
      await loadOrders();
    } catch (err: unknown) {
      const isValidation =
        (err as { code?: string })?.code === "VALIDATION" ||
        (err instanceof Error && err.message.includes("đã được xử lý"));
      if (isValidation) {
        setCancelError("Đơn này đã được xử lý.");
        await loadOrders();
      } else {
        setCancelError(err instanceof Error ? err.message : "Không thể hủy đơn hàng.");
      }
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const columns = [
    {
      header: "Mã đơn",
      cell: (order: OpsOrder) => (
        <span className="font-mono font-bold text-accent-text">{order.code}</span>
      ),
    },
    {
      header: "Gói",
      cell: (order: OpsOrder) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
            order.plan === "vip"
              ? "bg-vip-bg text-vip-fg border border-vip-border"
              : "bg-accent-soft text-accent-text border border-border"
          }`}
        >
          {order.plan}
        </span>
      ),
    },
    {
      header: "Số tiền",
      cell: (order: OpsOrder) => (
        <span className="font-semibold text-text tabular-nums">
          {formatVnd(order.amountVnd)}
        </span>
      ),
    },
    {
      header: "Chủ thiệp (Email)",
      cell: (order: OpsOrder) => (
        <span className="text-text-muted">{order.ownerEmail}</span>
      ),
    },
    {
      header: "Thiệp",
      cell: (order: OpsOrder) => (
        <Link
          href={`/ops/weddings/${order.weddingId}`}
          className="text-xs font-medium text-accent-text hover:underline"
        >
          Chi tiết thiệp
        </Link>
      ),
    },
    {
      header: "Tạo lúc",
      cell: (order: OpsOrder) => (
        <span className="text-text-muted">{formatDateTime(order.createdAt)}</span>
      ),
    },
    {
      header: "Đã thanh toán lúc",
      cell: (order: OpsOrder) => (
        <span className="text-text-muted">{formatDateTime(order.paidAt)}</span>
      ),
    },
    ...(activeTab === "pending"
      ? [
          {
            header: "Thao tác",
            className: "text-right",
            headerClassName: "text-right",
            cell: (order: OpsOrder) => (
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmError(null);
                    setConfirmingOrder(order);
                  }}
                  className="inline-flex min-h-[44px] cursor-pointer items-center gap-1 rounded-lg bg-accent px-2.5 py-1.5 text-xs font-semibold text-accent-fg hover:bg-accent-hover"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Xác nhận đã nhận tiền</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCancelError(null);
                    setCancellingOrder(order);
                  }}
                  className="inline-flex min-h-[44px] cursor-pointer items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-danger-fg hover:border-danger-border hover:bg-danger-bg"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Hủy đơn</span>
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-text sm:text-3xl">
          Quản lý đơn hàng
        </h1>
        <p className="mt-1 text-xs text-text-muted sm:text-sm">
          Theo dõi trạng thái đơn hàng nâng cấp gói và đối soát thanh toán.
        </p>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="flex items-center justify-between rounded-xl border border-success-border bg-success-bg p-3.5 text-xs font-semibold text-success-fg shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-success-fg hover:opacity-75"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex border-b border-border">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`flex min-h-[44px] cursor-pointer items-center gap-2 border-b-2 px-4 text-xs font-semibold sm:text-sm transition-colors ${
                isActive
                  ? "border-accent text-accent-text"
                  : "border-transparent text-text-muted hover:text-text"
              }`}
            >
              {tab.id === "pending" && <Clock className="h-4 w-4" />}
              {tab.id === "paid" && <CheckCircle2 className="h-4 w-4" />}
              {tab.id === "cancelled" && <XCircle className="h-4 w-4" />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Orders Table */}
      <OpsTable
        columns={columns}
        data={orders}
        keyExtractor={(o) => o.id}
        isLoading={isLoading}
        emptyText={
          activeTab === "pending"
            ? "Không có đơn hàng nào đang chờ thanh toán."
            : activeTab === "paid"
            ? "Chưa có đơn hàng nào đã thanh toán."
            : "Chưa có đơn hàng nào bị hủy."
        }
      />

      {/* Pagination */}
      <OpsPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={isLoading}
      />

      {/* Confirm Order Dialog */}
      {confirmingOrder && (
        <ActionConfirmDialog
          isOpen={!!confirmingOrder}
          title="Xác nhận đã nhận tiền đơn hàng"
          description="Hệ thống sẽ kích hoạt ngay gói dịch vụ tương ứng cho thiệp cưới của khách hàng."
          details={[
            { label: "Mã đơn hàng", value: <strong className="font-mono text-accent-text">{confirmingOrder.code}</strong> },
            { label: "Số tiền", value: <strong className="tabular-nums">{formatVnd(confirmingOrder.amountVnd)}</strong> },
            { label: "Gói đăng ký", value: <strong className="uppercase">{confirmingOrder.plan}</strong> },
            { label: "Chủ thiệp", value: confirmingOrder.ownerEmail },
          ]}
          confirmLabel="Xác nhận nhận tiền & Kích hoạt gói"
          isSubmitting={isSubmittingConfirm}
          error={confirmError}
          onClose={() => setConfirmingOrder(null)}
          onConfirm={handleConfirmOrder}
        />
      )}

      {/* Cancel Order Dialog */}
      {cancellingOrder && (
        <ActionConfirmDialog
          isOpen={!!cancellingOrder}
          title="Xác nhận hủy đơn hàng"
          description="Đơn hàng bị hủy sẽ không thể tiếp tục thanh toán. Hãy cung cấp lý do hủy đơn."
          details={[
            { label: "Mã đơn hàng", value: <strong className="font-mono">{cancellingOrder.code}</strong> },
            { label: "Chủ thiệp", value: cancellingOrder.ownerEmail },
            { label: "Số tiền", value: formatVnd(cancellingOrder.amountVnd) },
          ]}
          confirmLabel="Hủy đơn hàng này"
          confirmVariant="danger"
          isSubmitting={isSubmittingCancel}
          error={cancelError}
          onClose={() => setCancellingOrder(null)}
          onConfirm={handleCancelOrder}
        />
      )}
    </div>
  );
}

