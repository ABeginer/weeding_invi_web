/**
 * PostgREST (Supabase) trả tối đa 1.000 dòng mỗi request theo cấu hình mặc
 * định, nên mọi truy vấn "lấy hết" phải phân trang bằng range() thay vì tin
 * vào `.limit(2000)`.
 */

const DEFAULT_PAGE_SIZE = 1000;
const DEFAULT_MAX_ROWS = 20000;

interface PageResult<T> {
  data: T[] | null;
  error: unknown;
}

export async function fetchAllRows<T>(
  makeQuery: (from: number, to: number) => PromiseLike<PageResult<T>>,
  options?: { pageSize?: number; maxRows?: number },
): Promise<T[]> {
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const maxRows = options?.maxRows ?? DEFAULT_MAX_ROWS;
  const rows: T[] = [];

  for (let from = 0; from < maxRows; from += pageSize) {
    const { data, error } = await makeQuery(from, from + pageSize - 1);
    if (error) throw error;

    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < pageSize) break;
  }

  return rows;
}

/** Chia mảng id để tránh URL quá dài khi dùng `.in()`. */
export function chunkIds(ids: string[], size = 200): string[][] {
  const chunks: string[][] = [];
  for (let index = 0; index < ids.length; index += size) {
    chunks.push(ids.slice(index, index + size));
  }
  return chunks;
}
