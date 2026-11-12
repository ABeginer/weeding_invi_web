"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, MessageSquareHeart, Search } from "lucide-react";
import { ApiError, listWishes } from "@/lib/api";
import { Wish } from "@/lib/types";
import { formatDateTimeVi } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";

export function WishList() {
  const router = useRouter();
  const [wishes, setWishes] = React.useState<Wish[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  const loadWishes = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listWishes();
      setWishes(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/admin/login");
        return;
      }
      setError(
        err instanceof Error ? err.message : "Không thể tải danh sách lời chúc."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    loadWishes();
  }, [loadWishes]);

  const filteredWishes = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return wishes;
    return wishes.filter(
      (wish) =>
        wish.name.toLowerCase().includes(q) ||
        wish.message.toLowerCase().includes(q)
    );
  }, [wishes, search]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-fg">
            Lời chúc từ khách mời
          </h1>
          <p className="text-sm text-fg-muted">
            Hiển thị lời chúc mới nhất lên đầu từ cả thiệp cá nhân và trang chung.
          </p>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute top-3.5 left-3.5 h-4 w-4 text-fg-muted"
            aria-hidden="true"
          />
          <Input
            aria-label="Tìm kiếm lời chúc"
            placeholder="Tìm theo tên hoặc nội dung..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-14 w-full" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <AlertCircle
            className="mx-auto h-9 w-9 text-danger-fg"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-medium text-fg">{error}</p>
          <Button variant="outline" className="mt-4" onClick={loadWishes}>
            Thử lại
          </Button>
        </Card>
      ) : filteredWishes.length === 0 ? (
        <Card className="p-10 text-center">
          <MessageSquareHeart
            className="mx-auto h-9 w-9 text-fg-muted/70"
            aria-hidden="true"
          />
          <p className="mt-3 font-medium text-fg">
            {wishes.length === 0
              ? "Chưa có lời chúc nào được gửi"
              : "Không tìm thấy lời chúc phù hợp"}
          </p>
          {wishes.length > 0 && search ? (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setSearch("")}
            >
              Xóa từ khóa tìm kiếm
            </Button>
          ) : null}
        </Card>
      ) : (
        <div className="space-y-3.5">
          {filteredWishes.map((wish) => (
            <Card key={wish.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-fg">{wish.name}</h2>
                  <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-[11px] font-medium text-fg-muted">
                    {wish.guestId ? "Thiệp cá nhân" : "Trang chung"}
                  </span>
                </div>
                <time
                  dateTime={wish.createdAt}
                  className="text-xs text-fg-muted"
                >
                  {formatDateTimeVi(wish.createdAt)}
                </time>
              </div>
              <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-fg">
                {wish.message}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

