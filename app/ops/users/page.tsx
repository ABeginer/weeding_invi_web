"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { formatDateTime, getOpsUsers, type OpsUser } from "@/lib/ops-api";
import { OpsTable } from "@/components/ops/OpsTable";
import { OpsPagination } from "@/components/ops/OpsPagination";

export default function OpsUsersPage() {
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [users, setUsers] = React.useState<OpsUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Debounce search query 300ms
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch users
  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    getOpsUsers({ q: debouncedQuery, page })
      .then((res) => {
        if (cancelled) return;
        setUsers(res.items);
        setTotalPages(res.totalPages);
      })
      .catch(() => {
        if (cancelled) return;
        setUsers([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, page]);

  const columns = [
    {
      header: "Email",
      cell: (user: OpsUser) => (
        <span className="font-medium text-text">{user.email}</span>
      ),
    },
    {
      header: "Ngày tạo",
      cell: (user: OpsUser) => (
        <span className="text-text-muted">{formatDateTime(user.createdAt)}</span>
      ),
    },
    {
      header: "Đăng nhập",
      cell: (user: OpsUser) => (
        <span className="text-text-muted">{user.identityCount ?? 1} cách</span>
      ),
    },
    {
      header: "Số thiệp",
      cell: (user: OpsUser) => (
        <span className="font-semibold text-text">{user.weddingCount}</span>
      ),
    },
    {
      header: "Thao tác",
      className: "text-right",
      headerClassName: "text-right",
      cell: (user: OpsUser) => (
        <Link
          href={`/ops/users/${user.id}`}
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
          Quản lý người dùng
        </h1>
        <p className="mt-1 text-xs text-text-muted sm:text-sm">
          Danh sách tài khoản đăng ký trên hệ thống.
        </p>
      </div>

      {/* Search box */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo email..."
          className="min-h-[44px] w-full rounded-xl border border-border bg-surface pl-10 pr-4 text-xs sm:text-sm text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        />
      </div>

      {/* Users table */}
      <OpsTable
        columns={columns}
        data={users}
        keyExtractor={(u) => u.id}
        isLoading={isLoading}
        emptyText="Không tìm thấy người dùng nào."
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

