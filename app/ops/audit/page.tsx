"use client";

import * as React from "react";
import { formatDateTime, getOpsAudit, type OpsAuditLog } from "@/lib/ops-api";
import { OpsTable } from "@/components/ops/OpsTable";
import { OpsPagination } from "@/components/ops/OpsPagination";

export default function OpsAuditPage() {
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [logs, setLogs] = React.useState<OpsAuditLog[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    getOpsAudit({ page })
      .then((res) => {
        if (cancelled) return;
        setLogs(res.items);
        setTotalPages(res.totalPages);
      })
      .catch(() => {
        if (cancelled) return;
        setLogs([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page]);

  const columns = [
    {
      header: "Thời gian",
      cell: (log: OpsAuditLog) => (
        <span className="text-text-muted whitespace-nowrap">
          {formatDateTime(log.createdAt)}
        </span>
      ),
    },
    {
      header: "Admin",
      cell: (log: OpsAuditLog) => (
        <span className="font-medium text-text">{log.adminEmail}</span>
      ),
    },
    {
      header: "Hành động",
      cell: (log: OpsAuditLog) => (
        <span className="inline-flex rounded bg-surface-alt px-2 py-0.5 font-mono text-[11px] font-bold text-accent-text">
          {log.action}
        </span>
      ),
    },
    {
      header: "Đối tượng",
      cell: (log: OpsAuditLog) => (
        <div className="text-xs">
          <span className="text-text-muted">{log.targetType}: </span>
          <span className="font-mono font-medium text-text">{log.targetId}</span>
        </div>
      ),
    },
    {
      header: "Lý do ghi nhận",
      cell: (log: OpsAuditLog) => (
        <span className="text-text leading-snug">{log.reason}</span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-text sm:text-3xl">
          Nhật ký thao tác (Audit Log)
        </h1>
        <p className="mt-1 text-xs text-text-muted sm:text-sm">
          Lịch sử các thao tác thay đổi dữ liệu từ quản trị viên. Dữ liệu chỉ đọc và sắp xếp mới nhất lên đầu.
        </p>
      </div>

      {/* Table */}
      <OpsTable
        columns={columns}
        data={logs}
        keyExtractor={(l) => l.id}
        isLoading={isLoading}
        emptyText="Chưa có nhật ký thao tác nào."
        skeletonRows={8}
      />

      {/* Pagination (Page size 50) */}
      <OpsPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={isLoading}
      />
    </div>
  );
}

