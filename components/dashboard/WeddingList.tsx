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
import { formatDateTimeVi } from "@/lib/utils";
import { FREE_PLAN_MAX_WEDDINGS, WEDDING_TEMPLATES } from "@/lib/wedding-slug";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { CreateWeddingDialog } from "./CreateWeddingDialog";

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
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-medium tracking-[0.18em] text-accent uppercase">
            Trung tâm quản lý
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-fg sm:text-4xl">
            Thiệp cưới của bạn
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            Tạo thiệp, tùy biến lễ &amp; ảnh cưới, xem trước trực tiếp và quản lý khách mời.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setCreateOpen(true)}
          disabled={reachedFreeLimit}
          title={
            reachedFreeLimit
              ? `Gói miễn phí chỉ hỗ trợ tối đa ${FREE_PLAN_MAX_WEDDINGS} thiệp`
              : undefined
          }
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Tạo thiệp mới</span>
        </Button>
      </div>

      {reachedFreeLimit && (
        <div className="rounded-xl border border-accent/35 bg-accent-soft px-4 py-3 text-xs text-fg sm:text-sm">
          Tài khoản gói miễn phí được tạo tối đa{" "}
          <strong className="font-semibold text-accent">
            {FREE_PLAN_MAX_WEDDINGS} thiệp cưới
          </strong>
          , {freeLimits.events} lễ, {freeLimits.photos.gallery} ảnh thư viện và{" "}
          <strong className="font-semibold text-accent">
            {freeLimits.guests ?? 20} khách mời
          </strong>
          .
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, idx) => (
            <Card key={idx} className="space-y-4 p-5">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto h-9 w-9 text-danger-fg" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-fg">{error}</p>
          <Button variant="outline" className="mt-4" onClick={loadWeddings}>
            Thử lại
          </Button>
        </Card>
      ) : weddings.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/30 bg-accent-soft text-accent">
            <Heart className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-semibold text-fg">
            Bạn chưa có thiệp cưới nào
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-fg-muted">
            Hãy tạo thiệp cưới đầu tiên để chỉnh sửa thông tin, thêm lịch lễ, tải ảnh cưới và chia sẻ cho khách mời.
          </p>
          <Button
            variant="primary"
            className="mt-5"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Tạo thiệp đầu tiên</span>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {weddings.map((wedding) => {
            const tplName =
              WEDDING_TEMPLATES.find((t) => t.id === wedding.templateId)?.name ??
              wedding.templateId;
            return (
              <Card
                key={wedding.id}
                className="flex flex-col justify-between p-5 transition-colors hover:border-accent/45"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-2xl font-semibold text-fg">
                        {wedding.content.couple.groomName} &amp;{" "}
                        {wedding.content.couple.brideName}
                      </h2>
                      <p className="mt-0.5 truncate text-xs text-fg-muted">
                        /w/{wedding.slug}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-accent/35 bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">
                      {getPlanLabel(wedding.plan)}
                    </span>
                  </div>

                  <dl className="mt-4 space-y-1.5 text-xs text-fg-muted">
                    <div className="flex justify-between gap-2">
                      <dt>Mẫu thiệp:</dt>
                      <dd className="font-medium text-fg">{tplName}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Cập nhật:</dt>
                      <dd>{formatDateTimeVi(wedding.updatedAt)}</dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                  <Link
                    href={`/dashboard/weddings/${wedding.id}`}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
                  >
                    <span>Quản lý</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyPublicLink(wedding.slug)}
                    aria-label={`Sao chép link /w/${wedding.slug}`}
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Link chung</span>
                  </Button>
                  <a
                    href={`/w/${wedding.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Mở thiệp /w/${wedding.slug}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-fg transition-colors hover:bg-surface-muted hover:text-accent"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </Card>
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
