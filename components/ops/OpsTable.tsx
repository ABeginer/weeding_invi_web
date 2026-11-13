"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface OpsTableColumn<T> {
  header: React.ReactNode;
  cell: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface OpsTableProps<T> {
  columns: OpsTableColumn<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  isLoading?: boolean;
  emptyText?: string;
  skeletonRows?: number;
}

export function OpsTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyText = "Chưa có dữ liệu.",
  skeletonRows = 5,
}: OpsTableProps<T>) {
  return (
    <div className="w-full max-w-full overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
      {/* Table container with horizontal scroll only */}
      <div className="w-full max-w-full overflow-x-auto">
        <table className="w-full text-left text-sm text-text border-collapse">
          {/* Sticky header row */}
          <thead className="sticky top-0 z-10 border-b border-border bg-surface-alt text-xs font-semibold uppercase tracking-wider text-text-muted">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className={cn(
                    "whitespace-nowrap px-4 py-3.5",
                    col.headerClassName,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border/70">
            {/* Loading skeleton state */}
            {isLoading &&
              Array.from({ length: skeletonRows }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`} className="min-h-[44px]">
                  {columns.map((_, cIdx) => (
                    <td key={`skeleton-col-${cIdx}`} className="px-4 py-3.5">
                      <div className="h-4.5 w-3/4 animate-pulse rounded bg-surface-alt" />
                    </td>
                  ))}
                </tr>
              ))}

            {/* Empty state */}
            {!isLoading && data.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-text-muted"
                >
                  {emptyText}
                </td>
              </tr>
            )}

            {/* Data rows */}
            {!isLoading &&
              data.length > 0 &&
              data.map((item, index) => (
                <tr
                  key={keyExtractor(item, index)}
                  className="min-h-[44px] transition-colors hover:bg-surface-alt/60"
                >
                  {columns.map((col, cIdx) => (
                    <td
                      key={cIdx}
                      className={cn(
                        "min-h-[44px] px-4 py-3 text-xs sm:text-sm align-middle",
                        col.className,
                      )}
                    >
                      {col.cell(item, index)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

