"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface OpsPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  isLoading?: boolean;
}

export function OpsPagination({
  page,
  totalPages,
  onPageChange,
  isLoading = false,
}: OpsPaginationProps) {
  if (totalPages <= 1) return null;

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
      <span className="text-xs text-text-muted">
        Trang <strong className="font-semibold text-text">{page}</strong> /{" "}
        <strong className="font-semibold text-text">{totalPages}</strong>
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!hasPrev || isLoading}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex min-h-[44px] cursor-pointer items-center gap-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text transition-colors hover:border-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span>Trước</span>
        </button>

        <button
          type="button"
          disabled={!hasNext || isLoading}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex min-h-[44px] cursor-pointer items-center gap-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text transition-colors hover:border-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span>Sau</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

