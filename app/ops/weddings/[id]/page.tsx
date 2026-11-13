"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  ExternalLink,
  Heart,
  RotateCw,
  ShieldAlert,
} from "lucide-react";
import {
  formatDateTime,
  getOpsWedding,
  updateOpsWeddingPlan,
  updateOpsWeddingSuspend,
  type OpsWeddingDetail,
} from "@/lib/ops-api";
import type { WeddingPlan } from "@/lib/types";
import { ActionConfirmDialog } from "@/components/ops/ActionConfirmDialog";

export default function OpsWeddingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [wedding, setWedding] = React.useState<OpsWeddingDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Dialog states for "Đổi gói"
  const [isPlanDialogOpen, setIsPlanDialogOpen] = React.useState(false);
  const [targetPlan, setTargetPlan] = React.useState<WeddingPlan>("pro");
  const [isSubmittingPlan, setIsSubmittingPlan] = React.useState(false);
  const [planError, setPlanError] = React.useState<string | null>(null);

  // Dialog states for "Khóa/Mở khóa"
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = React.useState(false);
  const [isSubmittingSuspend, setIsSubmittingSuspend] = React.useState(false);
  const [suspendError, setSuspendError] = React.useState<string | null>(null);

  const loadWedding = React.useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await getOpsWedding(id);
      setWedding(res);
      if (res) {
        setTargetPlan(res.plan === "vip" ? "pro" : "vip");
      }
    } catch {
      setWedding(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadWedding();
  }, [loadWedding]);

  // Handle plan change
  const handleConfirmPlanChange = async (reason: string) => {
    if (!wedding) return;
    setIsSubmittingPlan(true);
    setPlanError(null);
    try {
      await updateOpsWeddingPlan(wedding.id, targetPlan, reason);
      setIsPlanDialogOpen(false);
      await loadWedding();
    } catch (err: unknown) {
      setPlanError(
        err instanceof Error ? err.message : "Không thể thay đổi gói dịch vụ.",
      );
    } finally {
      setIsSubmittingPlan(false);
    }
  };

  // Handle suspend / unsuspend
  const handleConfirmSuspend = async (reason: string) => {
    if (!wedding) return;
    setIsSubmittingSuspend(true);
    setSuspendError(null);
    const newSuspendedState = !wedding.suspended;
    try {
      await updateOpsWeddingSuspend(wedding.id, newSuspendedState, reason);
      setIsSuspendDialogOpen(false);
      await loadWedding();
    } catch (err: unknown) {
      setSuspendError(
        err instanceof Error ? err.message : "Không thể cập nhật trạng thái khóa.",
      );
    } finally {
      setIsSubmittingSuspend(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 py-8">
        <div className="h-6 w-32 animate-pulse rounded bg-surface-alt" />
        <div className="h-44 w-full animate-pulse rounded-xl bg-surface-alt" />
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-text-muted">Không tìm thấy thiệp cưới.</p>
        <button
          type="button"
          onClick={() => router.push("/ops/weddings")}
          className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-border px-4 text-xs font-semibold text-text hover:bg-surface-alt"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại danh sách</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Link
          href="/ops/weddings"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Quay lại danh sách thiệp cưới</span>
        </Link>
      </div>

      {/* Suspended Alert Banner */}
      {wedding.suspended && (
        <div className="flex items-start gap-3 rounded-xl border border-danger-border bg-danger-bg p-4 text-danger-fg shadow-xs">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-bold">Thiệp cưới này đang bị khóa!</h2>
            <p className="mt-0.5 text-xs leading-relaxed opacity-90">
              Trang thiệp công khai và link khách mời hiện tạm thời không thể truy cập bởi người dùng bên ngoài.
            </p>
          </div>
        </div>
      )}

      {/* Main summary header & Actions */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-text">
              <Heart className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl font-bold text-text sm:text-2xl">
                  {wedding.title}
                </h1>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                    wedding.plan === "vip"
                      ? "bg-vip-bg text-vip-fg border border-vip-border"
                      : wedding.plan === "pro"
                      ? "bg-accent-soft text-accent-text border border-border"
                      : "bg-surface-alt text-text-muted border border-border"
                  }`}
                >
                  Gói {wedding.plan}
                </span>
                {wedding.suspended ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-danger-border bg-danger-bg px-2.5 py-0.5 text-[11px] font-medium text-danger-fg">
                    <Ban className="h-3 w-3" />
                    <span>Đang khóa</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-success-border bg-success-bg px-2.5 py-0.5 text-[11px] font-medium text-success-fg">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Hoạt động</span>
                  </span>
                )}
              </div>
              <p className="mt-1 font-mono text-xs font-semibold text-text-muted">
                Slug: /{wedding.slug}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
            {/* Open Public Page */}
            <a
              href={`/w/${wedding.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-text transition-colors hover:border-accent hover:bg-surface-alt"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              <span>Mở trang công khai</span>
            </a>

            {/* Change Plan Button */}
            <button
              type="button"
              onClick={() => {
                setPlanError(null);
                setIsPlanDialogOpen(true);
              }}
              className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-text transition-colors hover:border-accent hover:bg-surface-alt"
            >
              <RotateCw className="h-4 w-4" aria-hidden="true" />
              <span>Đổi gói</span>
            </button>

            {/* Suspend / Unsuspend Button */}
            <button
              type="button"
              onClick={() => {
                setSuspendError(null);
                setIsSuspendDialogOpen(true);
              }}
              className={`inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                wedding.suspended
                  ? "border border-success-border bg-success-bg text-success-fg hover:opacity-90"
                  : "border border-danger-border bg-danger-bg text-danger-fg hover:opacity-90"
              }`}
            >
              {wedding.suspended ? (
                <>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  <span>Mở khóa thiệp</span>
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4" aria-hidden="true" />
                  <span>Khóa thiệp</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Detailed statistics grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
          <span className="text-xs text-text-muted">Chủ thiệp</span>
          <p className="mt-1 font-semibold text-text truncate">{wedding.ownerEmail}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
          <span className="text-xs text-text-muted">Ngày tạo</span>
          <p className="mt-1 font-semibold text-text">
            {formatDateTime(wedding.createdAt)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
          <span className="text-xs text-text-muted">Khách mời (Đã đồng ý)</span>
          <p className="mt-1 font-display text-xl font-bold text-text">
            {wedding.guestCount} ({wedding.acceptedCount} nhận lời)
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
          <span className="text-xs text-text-muted">Ảnh (Kỷ niệm / Album)</span>
          <p className="mt-1 font-display text-xl font-bold text-text">
            {wedding.photoCount} ảnh / {wedding.albumPhotoCount} album
          </p>
        </div>
      </div>

      {/* Plan Change Dialog */}
      <ActionConfirmDialog
        isOpen={isPlanDialogOpen}
        title="Đổi gói dịch vụ thiệp cưới"
        description="Thay đổi gói dịch vụ sẽ áp dụng ngay các giới hạn và tính năng của gói mới cho thiệp này."
        details={[
          { label: "Thiệp cưới", value: `${wedding.title} (${wedding.slug})` },
          {
            label: "Gói hiện tại (Cũ)",
            value: (
              <span className="font-bold text-text-muted uppercase">
                {wedding.plan}
              </span>
            ),
          },
          {
            label: "Gói mới (Sẽ đổi)",
            value: (
              <select
                value={targetPlan}
                onChange={(e) => setTargetPlan(e.target.value as WeddingPlan)}
                className="rounded-md border border-border bg-surface px-2 py-1 text-xs font-bold uppercase text-accent-text"
              >
                <option value="free">FREE</option>
                <option value="pro">PRO</option>
                <option value="vip">VIP</option>
              </select>
            ),
          },
        ]}
        confirmLabel="Lưu thay đổi gói"
        isSubmitting={isSubmittingPlan}
        error={planError}
        onClose={() => setIsPlanDialogOpen(false)}
        onConfirm={handleConfirmPlanChange}
      />

      {/* Suspend / Unsuspend Dialog */}
      <ActionConfirmDialog
        isOpen={isSuspendDialogOpen}
        title={wedding.suspended ? "Xác nhận mở khóa thiệp" : "Xác nhận khóa thiệp cưới"}
        description={
          wedding.suspended
            ? "Mở khóa sẽ khôi phục trạng thái hoạt động bình thường, khách mời có thể truy cập lại link thiệp."
            : "Khóa thiệp sẽ tạm ngưng hiển thị trang thiệp công khai và chặn truy cập từ khách mời."
        }
        warningNotice={
          wedding.suspended
            ? undefined
            : "Hành động này ảnh hưởng trực tiếp đến người xem thiệp. Cần nêu rõ lý do trước khi áp dụng."
        }
        details={[
          { label: "Thiệp cưới", value: `${wedding.title} (${wedding.slug})` },
          { label: "Chủ thiệp", value: wedding.ownerEmail },
          {
            label: "Trạng thái cũ",
            value: wedding.suspended ? "Đang khóa" : "Đang hoạt động",
          },
          {
            label: "Trạng thái mới",
            value: (
              <strong className={wedding.suspended ? "text-success-fg" : "text-danger-fg"}>
                {wedding.suspended ? "Hoạt động" : "Bị khóa"}
              </strong>
            ),
          },
        ]}
        confirmLabel={wedding.suspended ? "Mở khóa thiệp" : "Khóa thiệp ngay"}
        confirmVariant={wedding.suspended ? "default" : "danger"}
        isSubmitting={isSubmittingSuspend}
        error={suspendError}
        onClose={() => setIsSuspendDialogOpen(false)}
        onConfirm={handleConfirmSuspend}
      />
    </div>
  );
}

