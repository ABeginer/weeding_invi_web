"use client";

import * as React from "react";
import {
  AlertCircle,
  ExternalLink,
  Loader2,
  Palette,
  RefreshCw,
} from "lucide-react";
import { getPlanLabel, isTemplateAllowedForPlan } from "@/config/plans";
import {
  ApiError,
  assignDesignerTemplate,
  listDesignerTemplateOptions,
} from "@/lib/api";
import { getDesignerUpdateVersion } from "@/lib/designer-invite";
import type {
  DesignerTemplateAssignmentResult,
  DesignerTemplateOption,
  WeddingDesignerTemplateInfo,
  WeddingDetail,
} from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";

interface DesignerTemplateCardProps {
  wedding: WeddingDetail;
  current: WeddingDesignerTemplateInfo | null;
  onChanged: (result: DesignerTemplateAssignmentResult) => void;
}

/**
 * Gán mẫu designer cho thiệp và ghim version tại thời điểm gán.
 * Designer publish bản mới sẽ không tự đổi thiệp của khách.
 */
export function DesignerTemplateCard({
  wedding,
  current,
  onChanged,
}: DesignerTemplateCardProps) {
  const { showToast } = useToast();
  const [options, setOptions] = React.useState<DesignerTemplateOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [busyKey, setBusyKey] = React.useState<string | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;

    listDesignerTemplateOptions()
      .then((res) => {
        if (!cancelled) setOptions(res.items ?? []);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          window.location.assign("/auth/login");
          return;
        }
        setLoadError(
          err instanceof Error
            ? err.message
            : "Không tải được danh sách mẫu thiết kế.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const runAssignment = async (
    key: string,
    input: { designerTemplateId: string | null; version?: number },
    successMessage: string,
  ) => {
    setBusyKey(key);
    setActionError(null);
    try {
      const result = await assignDesignerTemplate(wedding.id, input);
      onChanged(result);
      showToast(successMessage, "success");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.assign("/auth/login");
        return;
      }
      setActionError(
        err instanceof Error ? err.message : "Không cập nhật được mẫu thiết kế.",
      );
    } finally {
      setBusyKey(null);
    }
  };

  const updateTarget =
    current && current.status === "published"
      ? getDesignerUpdateVersion(current.pinnedVersion, current.latestVersion)
      : null;

  return (
    <Card className="space-y-4 p-4 sm:p-6">
      <div>
        <h3 className="flex items-center gap-2 font-sans text-base font-semibold text-fg">
          <Palette className="h-4 w-4 text-accent-text" aria-hidden="true" />
          <span>Mẫu thiết kế Designer</span>
        </h3>
        <p className="mt-0.5 text-xs text-fg-muted">
          Thiệp mời khách tại <code className="rounded bg-surface-alt px-1 py-0.5">/m/&lt;slug&gt;</code>{" "}
          sẽ hiển thị đúng phiên bản đã ghim. Khi designer xuất bản bản mới, thiệp
          của bạn không tự đổi — bạn chủ động bấm cập nhật. Khung xem trước bên
          phải vẫn hiển thị mẫu giao diện; dùng nút “Xem trước” để xem mẫu
          designer.
        </p>
      </div>

      {current ? (
        <div className="rounded-xl border border-accent/40 bg-accent-soft/40 p-3.5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-fg">{current.name}</p>
              <p className="mt-0.5 text-xs text-fg-muted">
                {current.pinnedVersion
                  ? `Đang ghim v${current.pinnedVersion}`
                  : "Chưa ghim phiên bản"}{" "}
                · bản mới nhất v{current.latestVersion}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {updateTarget && (
                <Button
                  size="sm"
                  variant="primary"
                  loading={busyKey === "update"}
                  disabled={Boolean(busyKey)}
                  onClick={() =>
                    runAssignment(
                      "update",
                      {
                        designerTemplateId: current.id,
                        version: updateTarget,
                      },
                      `Đã cập nhật thiệp lên v${updateTarget}`,
                    )
                  }
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Cập nhật lên v{updateTarget}</span>
                </Button>
              )}
              {current.pinnedVersion && (
                <a
                  href={`/mau/designer/${current.id}?v=${current.pinnedVersion}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-fg transition-colors hover:border-accent/60 hover:bg-surface-muted hover:text-accent-text"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Xem trước</span>
                </a>
              )}
              <Button
                size="sm"
                variant="outline"
                loading={busyKey === "unassign"}
                disabled={Boolean(busyKey)}
                onClick={() =>
                  runAssignment(
                    "unassign",
                    { designerTemplateId: null },
                    "Đã bỏ mẫu designer, thiệp quay lại mẫu giao diện",
                  )
                }
              >
                <span>Bỏ gán</span>
              </Button>
            </div>
          </div>
          {current.status !== "published" && (
            <p className="mt-2 text-[11px] text-fg-muted">
              Mẫu này không còn ở trạng thái xuất bản. Bản đã ghim vẫn hiển thị
              cho khách; bỏ gán nếu muốn quay lại mẫu giao diện.
            </p>
          )}
          {current.pinnedVersion === null && (
            <p className="mt-2 text-[11px] text-danger-fg">
              Thiệp chưa ghim phiên bản nào nên đang dùng mẫu giao diện. Chọn
              lại mẫu này bên dưới để ghim bản mới nhất.
            </p>
          )}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border bg-surface-alt px-3.5 py-3 text-xs text-fg-muted">
          Thiệp đang dùng mẫu giao diện ở trên. Chọn một mẫu designer bên dưới
          để thay thế.
        </p>
      )}

      {actionError && (
        <p
          role="alert"
          className="rounded-xl border border-danger-border bg-danger-bg px-3.5 py-2.5 text-xs text-danger-fg"
        >
          {actionError}
        </p>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-fg">Mẫu đã xuất bản</p>
          <Button
            size="sm"
            variant="ghost"
            disabled={loading || Boolean(busyKey)}
            onClick={() => {
              setLoading(true);
              setLoadError(null);
              setReloadToken((value) => value + 1);
            }}
          >
            Tải lại
          </Button>
        </div>

        {loading ? (
          <p className="flex items-center gap-2 text-xs text-fg-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Đang tải mẫu thiết kế…
          </p>
        ) : loadError ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-danger-border bg-danger-bg px-3.5 py-2.5 text-xs text-danger-fg"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{loadError}</span>
          </p>
        ) : options.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface-alt px-3.5 py-3 text-xs text-fg-muted">
            Chưa có mẫu designer nào được xuất bản. Designer cần publish mẫu
            trong trang quản trị trước khi gán cho thiệp.
          </p>
        ) : (
          <ul className="max-h-[320px] divide-y divide-border overflow-y-auto rounded-xl border border-border">
            {options.map((option) => {
              const assigned = current?.id === option.id;
              const allowed = isTemplateAllowedForPlan(wedding.plan, option.plan);
              const busy = busyKey === option.id;

              return (
                <li
                  key={option.id}
                  className="flex items-center gap-3 bg-bg px-3 py-2.5"
                >
                  <span className="h-12 w-8 shrink-0 overflow-hidden rounded-md border border-border bg-surface-alt">
                    {option.coverUrl && (
                      <img
                        src={option.coverUrl}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-fg">
                      {option.name}
                    </span>
                    <span className="block truncate text-[11px] text-fg-muted">
                      v{option.version} · Gói {getPlanLabel(option.plan)}
                      {option.ritual ? ` · ${option.ritual}` : ""}
                    </span>
                  </span>
                  {assigned && current?.pinnedVersion ? (
                    <span className="shrink-0 rounded-full border border-accent/45 bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-text">
                      Đang gán
                    </span>
                  ) : allowed ? (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={busy}
                      disabled={Boolean(busyKey)}
                      onClick={() =>
                        runAssignment(
                          option.id,
                          { designerTemplateId: option.id },
                          `Đã gán mẫu “${option.name}” ở v${option.version}`,
                        )
                      }
                    >
                      {assigned ? `Ghim v${option.version}` : "Gán"}
                    </Button>
                  ) : (
                    <span className="shrink-0 rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium text-fg-muted">
                      Cần gói {getPlanLabel(option.plan)}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
