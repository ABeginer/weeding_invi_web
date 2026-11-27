"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Copy,
  ExternalLink,
  Heart,
  Plus,
} from "lucide-react";
import { getPlanLabel, getPlanLimits } from "@/config/plans";
import { ApiError, buildWeddingLink, listWeddings } from "@/lib/api";
import type { Wedding } from "@/lib/types";
import { cn, formatDateTimeVi } from "@/lib/utils";
import { FREE_PLAN_MAX_WEDDINGS, WEDDING_TEMPLATES } from "@/lib/wedding-slug";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { CreateWeddingDialog } from "./CreateWeddingDialog";

function getPlanBadgeClasses(plan: Wedding["plan"]): string {
  if (plan === "free") return "border-[#E8E2D9] bg-[#FAF8F5] text-[#6B655E]";
  if (plan === "pro") return "border-[#B89B72]/40 bg-[#F4EFEA] text-[#7A1C24] font-semibold";
  return "border-[#BBDBC9] bg-[#ECF5F0] text-[#2F6F4E] font-semibold";
}

interface WeddingListProps {
  initialCreateTemplateId?: string;
}

export function WeddingList({ initialCreateTemplateId }: WeddingListProps = {}) {
  const { showToast } = useToast();
  const [weddings, setWeddings] = React.useState<Wedding[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const initialDialogOpenedRef = React.useRef(false);

  const loadWeddings = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listWeddings();
      setWeddings(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.assign("/auth/login");
        return;
      }
      setError(
        err instanceof Error ? err.message : "Không thể tải danh sách thiệp cưới.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadWeddings();
  }, [loadWeddings]);

  const hasPaidPlan = weddings.some((w) => w.plan === "pro" || w.plan === "vip");
  const reachedFreeLimit = !hasPaidPlan && weddings.length >= FREE_PLAN_MAX_WEDDINGS;
  const freeLimits = getPlanLimits("free");

  React.useEffect(() => {
    if (
      initialCreateTemplateId &&
      !loading &&
      !error &&
      !reachedFreeLimit &&
      !initialDialogOpenedRef.current
    ) {
      initialDialogOpenedRef.current = true;
      setCreateOpen(true);
    }
  }, [initialCreateTemplateId, loading, error, reachedFreeLimit]);

  const handleCopyPublicLink = async (slug: string) => {
    const url = buildWeddingLink(slug);
    try {
      await navigator.clipboard.writeText(url);
      showToast("Đã sao chép link thiệp chung", "success");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      showToast("Đã sao chép link thiệp chung", "success");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 text-[#1F1D1A]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-medium tracking-[0.2em] text-[#7A1C24] uppercase">
            Trung tâm quản lý
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-[#1F1D1A] sm:text-4xl">
            Thiệp cưới của bạn
          </h1>
          <p className="mt-1 text-xs text-[#6B655E] sm:text-sm">
            Tạo thiệp, tùy biến lễ &amp; ảnh cưới, xem trước trực tiếp và quản lý khách mời.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          disabled={reachedFreeLimit}
          title={
            reachedFreeLimit
              ? `Gói miễn phí chỉ hỗ trợ tối đa ${FREE_PLAN_MAX_WEDDINGS} thiệp`
              : undefined
          }
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#7A1C24] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#5E141B] disabled:opacity-50"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Tạo thiệp mới</span>
        </button>
      </div>

      {reachedFreeLimit && (
        <div className="rounded-2xl border border-[#B89B72]/40 bg-[#F4EFEA] px-4 py-3 text-xs text-[#1F1D1A] sm:text-sm">
          Tài khoản gói miễn phí được tạo tối đa{" "}
          <strong className="font-semibold text-[#7A1C24]">
            {FREE_PLAN_MAX_WEDDINGS} thiệp cưới
          </strong>
          , {freeLimits.events} lễ, {freeLimits.photos.gallery} ảnh thư viện và{" "}
          <strong className="font-semibold text-[#7A1C24]">
            {freeLimits.guests ?? 20} khách mời
          </strong>
          .
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div key={idx} className="rounded-2xl border border-[#E8E2D9] bg-white space-y-4 p-5 shadow-2xs">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-800">
          <AlertCircle className="mx-auto h-9 w-9 text-rose-600" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium">{error}</p>
          <button
            type="button"
            className="mt-4 rounded-full border border-rose-300 bg-white px-4 py-1.5 text-xs font-semibold hover:bg-rose-50"
            onClick={loadWeddings}
          >
            Thử lại
          </button>
        </div>
      ) : weddings.length === 0 ? (
        <div className="rounded-2xl border border-[#E8E2D9] bg-white p-10 text-center shadow-2xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E8E2D9] bg-[#FAF8F5] text-[#7A1C24]">
            <Heart className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-serif text-2xl font-semibold text-[#1F1D1A]">
            Bạn chưa có thiệp cưới nào
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-xs text-[#6B655E]">
            Hãy tạo thiệp cưới đầu tiên để chỉnh sửa thông tin, thêm lịch lễ, tải ảnh cưới và chia sẻ cho khách mời.
          </p>
          <button
            type="button"
            className="mt-5 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#7A1C24] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#5E141B]"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Tạo thiệp đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {weddings.map((wedding) => {
            const tplName =
              WEDDING_TEMPLATES.find((t) => t.id === wedding.templateId)?.name ??
              wedding.templateId;
            return (
              <div
                key={wedding.id}
                className="flex flex-col justify-between rounded-2xl border border-[#E8E2D9] bg-white p-5 shadow-2xs transition-all hover:border-[#B89B72]/60 hover:shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-serif text-2xl font-semibold text-[#1F1D1A]">
                        {wedding.content.couple.groomName} &amp;{" "}
                        {wedding.content.couple.brideName}
                      </h2>
                      <p className="mt-0.5 truncate text-xs text-[#6B655E]">
                        Mã link: {wedding.slug}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        getPlanBadgeClasses(wedding.plan),
                      )}
                    >
                      {getPlanLabel(wedding.plan)}
                    </span>
                  </div>

                  <dl className="mt-4 space-y-1.5 text-xs text-[#6B655E]">
                    <div className="flex justify-between gap-2">
                      <dt>Mẫu thiệp:</dt>
                      <dd className="font-medium text-[#1F1D1A]">{tplName}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Cập nhật:</dt>
                      <dd>{formatDateTimeVi(wedding.updatedAt)}</dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#E8E2D9] pt-4">
                  <Link
                    href={`/dashboard/weddings/${wedding.id}`}
                    className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#7A1C24] px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#5E141B]"
                  >
                    <span>Quản lý thiệp</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleCopyPublicLink(wedding.slug)}
                    className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[#E8E2D9] bg-white px-3 text-xs font-semibold text-[#1F1D1A] transition-colors hover:bg-[#FAF8F5]"
                  >
                    <Copy className="h-3.5 w-3.5 text-[#6B655E]" aria-hidden="true" />
                    <span>Link chung</span>
                  </button>
                  <a
                    href={`/w/${wedding.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Mở trang thiệp ${wedding.content.couple.groomName} & ${wedding.content.couple.brideName}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E8E2D9] bg-white text-[#6B655E] transition-colors hover:border-[#7A1C24] hover:bg-[#FAF8F5] hover:text-[#7A1C24]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateWeddingDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(created) => setWeddings((prev) => [created, ...prev])}
        initialTemplateId={initialCreateTemplateId}
      />
    </div>
  );
}
