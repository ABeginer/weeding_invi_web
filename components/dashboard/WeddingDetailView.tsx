"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Check,
  Copy,
  ExternalLink,
  FileEdit,
  MessageSquareHeart,
  Users,
} from "lucide-react";
import { ApiError, buildWeddingLink, getWedding } from "@/lib/api";
import type { Wedding } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { GuestTable } from "./GuestTable";
import { StatCards } from "./StatCards";
import { WeddingContentEditor } from "./WeddingContentEditor";
import { WishList } from "./WishList";

type DetailTab = "guests" | "wishes" | "stats" | "content";

interface WeddingDetailViewProps {
  weddingId: string;
}

const TABS: { id: DetailTab; label: string; Icon: typeof Users }[] = [
  { id: "guests", label: "Khách mời", Icon: Users },
  { id: "wishes", label: "Lời chúc", Icon: MessageSquareHeart },
  { id: "stats", label: "Tổng quan", Icon: BarChart3 },
  { id: "content", label: "Nội dung", Icon: FileEdit },
];

export function WeddingDetailView({ weddingId }: WeddingDetailViewProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [wedding, setWedding] = React.useState<Wedding | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<DetailTab>("guests");
  const [copiedPublic, setCopiedPublic] = React.useState(false);

  const loadWedding = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWedding(weddingId);
      setWedding(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.assign("/auth/login");
        return;
      }
      setError(
        err instanceof Error ? err.message : "Không tìm thấy thông tin thiệp cưới.",
      );
    } finally {
      setLoading(false);
    }
  }, [weddingId]);

  React.useEffect(() => {
    loadWedding();
  }, [loadWedding]);

  const handleCopyPublic = async () => {
    if (!wedding) return;
    const url = buildWeddingLink(wedding.slug);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedPublic(true);
    showToast("Đã sao chép link thiệp chung", "success");
    window.setTimeout(() => setCopiedPublic(false), 1800);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !wedding) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="mx-auto h-9 w-9 text-danger-fg" aria-hidden="true" />
        <h1 className="mt-3 text-lg font-semibold text-fg">
          {error ?? "Không tìm thấy thiệp cưới."}
        </h1>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-surface px-4 text-sm font-medium text-fg hover:bg-surface-muted"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Quay lại danh sách</span>
          </Link>
          <Button variant="outline" onClick={loadWedding}>
            Thử lại
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-fg-muted hover:text-fg sm:text-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Tất cả thiệp cưới</span>
          </Link>
          <h1 className="text-2xl font-semibold text-fg sm:text-3xl">
            {wedding.content.groom.shortName} &amp; {wedding.content.bride.shortName}
          </h1>
          <p className="text-xs text-fg-muted sm:text-sm">
            Đường dẫn chung:{" "}
            <code className="rounded bg-surface-muted px-1.5 py-0.5 text-fg">
              /w/{wedding.slug}
            </code>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyPublic}>
            {copiedPublic ? (
              <Check className="h-3.5 w-3.5 text-success-fg" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{copiedPublic ? "Đã chép link chung" : "Sao chép link chung"}</span>
          </Button>
          <a
            href={`/w/${wedding.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-fg transition-colors hover:bg-surface-muted"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Xem thiệp</span>
          </a>
        </div>
      </div>

      {/* Thanh tab cuộn ngang mượt trên điện thoại */}
      <nav
        aria-label="Mục quản lý thiệp"
        className="-mx-4 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0"
      >
        <div className="flex min-w-max gap-1">
          {TABS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "border-accent text-accent"
                    : "border-transparent text-fg-muted hover:border-border hover:text-fg",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {activeTab === "guests" && (
        <GuestTable weddingId={wedding.id} plan={wedding.plan} />
      )}
      {activeTab === "wishes" && <WishList weddingId={wedding.id} />}
      {activeTab === "stats" && <StatCards weddingId={wedding.id} />}
      {activeTab === "content" && (
        <WeddingContentEditor
          wedding={wedding}
          onUpdated={setWedding}
          onDeleted={() => router.replace("/dashboard")}
        />
      )}
    </div>
  );
}

