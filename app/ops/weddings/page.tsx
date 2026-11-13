"use client";

import * as React from "react";
import Link from "next/link";
import { Ban, CheckCircle2, ExternalLink, Search } from "lucide-react";
import { formatDateTime, getOpsWeddings, type OpsWedding } from "@/lib/ops-api";
import { OpsTable } from "@/components/ops/OpsTable";
import { OpsPagination } from "@/components/ops/OpsPagination";

export default function OpsWeddingsPage() {
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [planFilter, setPlanFilter] = React.useState("all");
  const [suspendedFilter, setSuspendedFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [weddings, setWeddings] = React.useState<OpsWedding[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Debounce search query 300ms
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset page when filters change
  const handlePlanChange = (val: string) => {
    setPlanFilter(val);
    setPage(1);
  };

  const handleSuspendedChange = (val: string) => {
    setSuspendedFilter(val);
    setPage(1);
  };

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    getOpsWeddings({
      q: debouncedQuery,
      plan: planFilter,
      suspended: suspendedFilter,
      page,
    })
      .then((res) => {
        if (cancelled) return;
        setWeddings(res.items);
        setTotalPages(res.totalPages);
      })
      .catch(() => {
        if (cancelled) return;
        setWeddings([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, planFilter, suspendedFilter, page]);

  const columns = [
    {
      header: "Slug",
      cell: (w: OpsWedding) => (
        <a
          href={`/w/${w.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-mono font-semibold text-accent-text hover:underline"
        >
          <span>{w.slug}</span>
          <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
        </a>
      ),
    },
    {
      header: "Tiêu đề",
      cell: (w: OpsWedding) => (
        <span className="font-medium text-text line-clamp-1">{w.title}</span>
      ),
    },
    {
      header: "Chủ thiệp (Email)",
      cell: (w: OpsWedding) => (
        <span className="text-text-muted">{w.ownerEmail}</span>
      ),
    },
    {
      header: "Gói",
      cell: (w: OpsWedding) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
            w.plan === "vip"
              ? "bg-vip-bg text-vip-fg border border-vip-border"
              : w.plan === "pro"
              ? "bg-accent-soft text-accent-text border border-border"
              : "bg-surface-alt text-text-muted border border-border"
          }`}
        >
          {w.plan}
        </span>
      ),
    },
    {
      header: "Khách",
      cell: (w: OpsWedding) => (
        <span className="font-semibold text-text">{w.guestCount}</span>
      ),
    },
    {
      header: "Trạng thái",
      cell: (w: OpsWedding) =>
        w.suspended ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-danger-border bg-danger-bg px-2.5 py-0.5 text-[11px] font-medium text-danger-fg">
            <Ban className="h-3 w-3" aria-hidden="true" />
            <span>Đang khóa</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-success-border bg-success-bg px-2.5 py-0.5 text-[11px] font-medium text-success-fg">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            <span>Hoạt động</span>
          </span>
        ),
    },
    {
      header: "Ngày tạo",
      cell: (w: OpsWedding) => (
        <span className="text-text-muted">{formatDateTime(w.createdAt)}</span>
      ),
    },
    {
      header: "Thao tác",
      className: "text-right",
      headerClassName: "text-right",
      cell: (w: OpsWedding) => (
        <Link
          href={`/ops/weddings/${w.id}`}
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-accent-text hover:border-accent hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          Xem
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-text sm:text-3xl">
          Quản lý thiệp cưới
        </h1>
        <p className="mt-1 text-xs text-text-muted sm:text-sm">
          Danh sách thiệp cưới trên nền tảng, quản lý gói dịch vụ và trạng thái hiển thị.
        </p>
      </div>

      {/* Filters row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo slug, tiêu đề, email..."
            className="min-h-[44px] w-full rounded-xl border border-border bg-surface pl-10 pr-4 text-xs sm:text-sm text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          />
        </div>

        {/* Plan Select */}
        <div>
          <select
            value={planFilter}
            onChange={(e) => handlePlanChange(e.target.value)}
            aria-label="Lọc theo gói"
            className="min-h-[44px] w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs sm:text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <option value="all">Tất cả gói</option>
            <option value="free">Gói Free</option>
            <option value="pro">Gói Pro</option>
            <option value="vip">Gói VIP</option>
          </select>
        </div>

        {/* Suspended Select */}
        <div>
          <select
            value={suspendedFilter}
            onChange={(e) => handleSuspendedChange(e.target.value)}
            aria-label="Lọc theo trạng thái khóa"
            className="min-h-[44px] w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs sm:text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="suspended">Đang khóa</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <OpsTable
        columns={columns}
        data={weddings}
        keyExtractor={(w) => w.id}
        isLoading={isLoading}
        emptyText="Không tìm thấy thiệp cưới nào phù hợp."
      />

      {/* Pagination */}
      <OpsPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={isLoading}
      />
    </div>
  );
}

