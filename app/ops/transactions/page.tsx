"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Link2, Loader2, X } from "lucide-react";
import {
  formatDateTime,
  formatVnd,
  getOpsBankTransactions,
  getOpsOrders,
  matchOpsBankTransaction,
  type OpsBankTransaction,
  type OpsOrder,
} from "@/lib/ops-api";
import { OpsTable } from "@/components/ops/OpsTable";
import { OpsPagination } from "@/components/ops/OpsPagination";

export default function OpsTransactionsPage() {
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [transactions, setTransactions] = React.useState<OpsBankTransaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Match dialog states
  const [selectedTx, setSelectedTx] = React.useState<OpsBankTransaction | null>(null);
  const [pendingOrders, setPendingOrders] = React.useState<OpsOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = React.useState(false);
  const [selectedOrderId, setSelectedOrderId] = React.useState<string>("");
  const [reason, setReason] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const loadTransactions = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getOpsBankTransactions({
        unmatched: true,
        page,
      });
      setTransactions(res.items);
      setTotalPages(res.totalPages);
    } catch {
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  React.useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // When opening match dialog, fetch pending orders and sort by closest amount
  const handleOpenMatchDialog = async (tx: OpsBankTransaction) => {
    setSelectedTx(tx);
    setSelectedOrderId("");
    setReason("");
    setError(null);
    setLoadingOrders(true);

    try {
      const res = await getOpsOrders({ status: "pending", page: 1 });
      // Sort orders by closest amount to tx.amountVnd
      const sorted = [...res.items].sort((a, b) => {
        const diffA = Math.abs(a.amountVnd - tx.amountVnd);
        const diffB = Math.abs(b.amountVnd - tx.amountVnd);
        return diffA - diffB;
      });
      setPendingOrders(sorted);
      if (sorted.length > 0) {
        setSelectedOrderId(sorted[0].id);
      }
    } catch {
      setPendingOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleConfirmMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx || !selectedOrderId) return;
    const trimmed = reason.trim();
    if (trimmed.length < 5) {
      setError("Lý do phải có ít nhất 5 ký tự.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await matchOpsBankTransaction(selectedTx.id, selectedOrderId, trimmed);
      const matchedOrder = pendingOrders.find((o) => o.id === selectedOrderId);
      setSelectedTx(null);
      showToast(
        `Đã gán thành công giao dịch ${selectedTx.ref} vào đơn ${matchedOrder?.code || selectedOrderId}!`,
      );
      await loadTransactions();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Không thể gán giao dịch vào đơn hàng.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedOrder = pendingOrders.find((o) => o.id === selectedOrderId);
  const isAmountBelowOrder =
    selectedTx && selectedOrder
      ? selectedTx.amountVnd < selectedOrder.amountVnd
      : false;

  const columns = [
    {
      header: "Mã giao dịch (Ref)",
      cell: (tx: OpsBankTransaction) => (
        <span className="font-mono font-bold text-accent-text">{tx.ref}</span>
      ),
    },
    {
      header: "Số tiền",
      cell: (tx: OpsBankTransaction) => (
        <span className="font-semibold text-text tabular-nums">
          {formatVnd(tx.amountVnd)}
        </span>
      ),
    },
    {
      header: "Nội dung",
      cell: (tx: OpsBankTransaction) => (
        <span className="font-medium text-text">{tx.description}</span>
      ),
    },
    {
      header: "Nhận lúc",
      cell: (tx: OpsBankTransaction) => (
        <span className="text-text-muted">{formatDateTime(tx.receivedAt)}</span>
      ),
    },
    {
      header: "Thao tác",
      className: "text-right",
      headerClassName: "text-right",
      cell: (tx: OpsBankTransaction) => (
        <button
          type="button"
          onClick={() => handleOpenMatchDialog(tx)}
          className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
        >
          <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Gán vào đơn</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-text sm:text-3xl">
          Giao dịch ngân hàng chưa khớp
        </h1>
        <p className="mt-1 text-xs text-text-muted sm:text-sm">
          Danh sách biến động số dư ngân hàng chưa được tự động nhận diện theo mã đơn.
        </p>
      </div>

      {/* Toast message */}
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

      {/* Table */}
      <OpsTable
        columns={columns}
        data={transactions}
        keyExtractor={(t) => t.id}
        isLoading={isLoading}
        emptyText="Không có giao dịch ngân hàng nào chưa khớp."
      />

      {/* Pagination */}
      <OpsPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={isLoading}
      />

      {/* Match Transaction Dialog */}
      {selectedTx && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            aria-hidden="true"
            onClick={() => !isSubmitting && setSelectedTx(null)}
            className="fixed inset-0 bg-bg/80 backdrop-blur-xs"
          />

          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-surface p-5 text-text shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
              <div>
                <h3 className="font-display text-lg font-semibold text-text sm:text-xl">
                  Gán giao dịch vào đơn hàng
                </h3>
                <p className="mt-0.5 text-xs text-text-muted">
                  Giao dịch: <strong className="font-mono text-accent-text">{selectedTx.ref}</strong> ({formatVnd(selectedTx.amountVnd)})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                disabled={isSubmitting}
                aria-label="Đóng hộp thoại"
                className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-lg border border-border text-text-muted hover:border-accent hover:text-text disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmMatch} className="mt-4 space-y-4">
              {/* Order selector */}
              <div className="space-y-1.5">
                <label
                  htmlFor="match-order-select"
                  className="text-xs font-semibold text-text"
                >
                  Chọn đơn hàng chờ thanh toán:
                </label>
                {loadingOrders ? (
                  <div className="flex h-11 items-center justify-center rounded-lg border border-border bg-surface-alt text-xs text-text-muted">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-accent-text" />
                    <span>Đang tải danh sách đơn chờ thanh toán...</span>
                  </div>
                ) : pendingOrders.length === 0 ? (
                  <p className="rounded-lg border border-border bg-surface-alt p-3 text-xs text-text-muted">
                    Hiện không có đơn hàng nào ở trạng thái chờ thanh toán.
                  </p>
                ) : (
                  <select
                    id="match-order-select"
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    disabled={isSubmitting}
                    className="min-h-[44px] w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs sm:text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    {pendingOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.code} - Gói {o.plan.toUpperCase()} - {formatVnd(o.amountVnd)} ({o.ownerEmail})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Warning when tx amount is below order amount */}
              {isAmountBelowOrder && (
                <div className="flex items-start gap-2.5 rounded-xl border border-soon-border bg-soon-bg p-3.5 text-xs text-soon-fg">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Số tiền nhỏ hơn giá gói. Vẫn gán?</p>
                    <p className="mt-0.5 leading-relaxed">
                      Số tiền giao dịch ({formatVnd(selectedTx.amountVnd)}) thấp hơn số tiền đơn hàng ({formatVnd(selectedOrder?.amountVnd || 0)}). Bạn vẫn muốn gán và kích hoạt gói?
                    </p>
                  </div>
                </div>
              )}

              {/* Error display */}
              {error && (
                <p className="rounded-lg border border-danger-border bg-danger-bg p-2.5 text-xs text-danger-fg">
                  {error}
                </p>
              )}

              {/* Reason input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="tx-reason" className="text-xs font-semibold text-text">
                    Lý do gán đơn <span className="text-danger-fg">*</span>
                  </label>
                  <span className="text-[11px] text-text-muted">
                    {reason.trim().length}/300 ký tự (tối thiểu 5)
                  </span>
                </div>
                <textarea
                  id="tx-reason"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Nhập lý do đối chiếu và gán giao dịch (tối thiểu 5 ký tự)..."
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs sm:text-sm text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedTx(null)}
                  disabled={isSubmitting}
                  className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-lg border border-border px-4 text-xs font-medium text-text hover:bg-surface-alt disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={
                    !selectedOrderId ||
                    reason.trim().length < 5 ||
                    isSubmitting ||
                    pendingOrders.length === 0
                  }
                  className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-accent px-5 text-xs font-semibold text-accent-fg shadow-xs transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Xác nhận gán vào đơn</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

