import { db } from "./supabase";

/** Gói free được lưu 30 ngày kể từ ngày tạo thiệp (cam kết với khách hàng). */
export const RETENTION_DAYS = 30;
const MAX_BATCH = 50;

export interface RetentionCandidate {
  id: string;
  slug: string;
  createdAt: string;
}

export interface RetentionResult {
  cutoff: string;
  dryRun: boolean;
  candidates: RetentionCandidate[];
  deleted: number;
  failed: number;
}

interface RetentionOptions {
  dryRun?: boolean;
  /** Xoá object R2 tương ứng; bỏ trống thì chỉ xoá dữ liệu DB. */
  deleteObject?: (storageKey: string) => Promise<void>;
}

/**
 * Xoá các thiệp gói free đã quá hạn lưu trữ. Chạy theo lô 50 thiệp/lần để
 * tránh một lần chạy quá lâu; gọi lặp lại cho tới khi `deleted === 0`.
 */
export async function purgeExpiredFreeWeddings(
  options: RetentionOptions = {},
): Promise<RetentionResult> {
  const cutoff = new Date(
    Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const client = db();
  const { data, error } = await client
    .from("weddings")
    .select("id, slug, created_at")
    .eq("plan", "free")
    .lt("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(MAX_BATCH);

  if (error) throw error;

  const rows = (data ?? []) as Array<{
    id: string;
    slug: string;
    created_at: string;
  }>;
  const candidates = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    createdAt: row.created_at,
  }));

  if (options.dryRun) {
    return { cutoff, dryRun: true, candidates, deleted: 0, failed: 0 };
  }

  let deleted = 0;
  let failed = 0;

  for (const row of rows) {
    if (options.deleteObject) {
      const { data: photos } = await client
        .from("photos")
        .select("storage_key")
        .eq("wedding_id", row.id);

      for (const photo of photos ?? []) {
        const key = photo.storage_key ? String(photo.storage_key) : "";
        if (!key) continue;
        try {
          await options.deleteObject(key);
        } catch {
          // Object có thể đã bị xoá trước đó; không chặn việc xoá thiệp.
        }
      }
    }

    const { error: deleteError } = await client
      .from("weddings")
      .delete()
      .eq("id", row.id);

    if (deleteError) {
      failed += 1;
    } else {
      deleted += 1;
    }
  }

  return { cutoff, dryRun: false, candidates, deleted, failed };
}
