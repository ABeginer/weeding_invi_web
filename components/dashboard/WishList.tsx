"use client";

import * as React from "react";
import { AlertCircle, MessageSquareHeart, RefreshCw, Search } from "lucide-react";
import { ApiError, listWishes } from "@/lib/api";
import type { Wish } from "@/lib/types";
import { cn, formatDateTimeVi } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

interface WishListProps {
  weddingId: string;
}

export function WishList({ weddingId }: WishListProps) {
  const [wishes, setWishes] = React.useState<Wish[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  const loadWishes = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listWishes(weddingId);
      const sorted = [...data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setWishes(sorted);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.assign("/auth/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Không thể tải danh sách lời chúc.");
    } finally {
      setLoading(false);
    }
  }, [weddingId]);

  React.useEffect(() => {
    loadWishes();
  }, [loadWishes]);

  const filteredWishes = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return wishes;
    return wishes.filter(
      (w) =>
        w.name.toLowerCase().includes(keyword) ||
        w.message.toLowerCase().includes(keyword),
    );
  }, [wishes, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-fg">
            Lời chúc từ khách mời
          </h2>
          <p className="text-xs text-fg-muted sm:text-sm">
            Sắp xếp từ mới nhất đến cũ nhất ({wishes.length} lời chúc).
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadWishes}
          disabled={loading}
          className="self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Làm mới</span>
        </Button>
      </div>

      {wishes.length > 0 && (
        <Card className="p-3 sm:p-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-fg-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên người gửi hoặc nội dung lời chúc..."
              aria-label="Tìm lời chúc"
              className="h-10 w-full rounded-xl border border-border bg-bg pr-3.5 pl-10 text-sm text-fg placeholder:text-fg-muted/70 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            />
          </div>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} className="space-y-3 p-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-12 w-full" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto h-9 w-9 text-danger-fg" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-fg">{error}</p>
          <Button variant="outline" className="mt-4" onClick={loadWishes}>
            Thử lại
          </Button>
        </Card>
      ) : wishes.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/35 bg-accent-soft text-accent-text">
            <MessageSquareHeart className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="mt-4 font-display text-xl font-semibold text-fg">
            Chưa có lời chúc nào
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-fg-muted">
            Lời chúc gửi từ thiệp cá nhân (/m/...) và trang thiệp chung (/w/...) sẽ xuất hiện tại đây.
          </p>
        </Card>
      ) : filteredWishes.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-fg-muted">
            Không tìm thấy lời chúc phù hợp với từ khóa.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredWishes.map((wish) => {
            const isPersonal = wish.guestId !== null;
            return (
              <Card key={wish.id} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-fg">{wish.name}</span>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                        isPersonal
                          ? "border-success-border bg-success-bg text-success-fg"
                          : "border-border bg-surface-muted text-fg-muted",
                      )}
                    >
                      {isPersonal ? "Thiệp cá nhân" : "Trang chung"}
                    </span>
                  </div>
                  <time
                    dateTime={wish.createdAt}
                    className="text-xs text-fg-muted"
                  >
                    {formatDateTimeVi(wish.createdAt)}
                  </time>
                </div>

                <p className="mt-2.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-fg">
                  {wish.message}
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
