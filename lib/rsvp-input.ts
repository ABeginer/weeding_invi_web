import type { GuestDiet } from "./types";

export const PLUS_ONES_MAX = 10;
export const SONG_REQUEST_MAX = 200;

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

/** Số người đi cùng: 0..10, mặc định 0 khi bỏ trống. */
export function parsePlusOnes(raw: unknown): ParseResult<number> {
  if (raw === undefined || raw === null || raw === "") {
    return { ok: true, value: 0 };
  }
  if (
    typeof raw !== "number" ||
    !Number.isInteger(raw) ||
    raw < 0 ||
    raw > PLUS_ONES_MAX
  ) {
    return {
      ok: false,
      error: `Số người đi cùng phải là số nguyên từ 0 đến ${PLUS_ONES_MAX}.`,
    };
  }
  return { ok: true, value: raw };
}

/** Chế độ ăn: "meat" | "veg" | null. */
export function parseDiet(raw: unknown): ParseResult<GuestDiet | null> {
  if (raw === undefined || raw === null || raw === "") {
    return { ok: true, value: null };
  }
  if (raw === "meat" || raw === "veg") {
    return { ok: true, value: raw };
  }
  return { ok: false, error: "Lựa chọn chế độ ăn không hợp lệ." };
}

/** Bài hát yêu cầu: chuỗi 1..200 ký tự sau khi trim, hoặc null. */
export function sanitizeSongRequest(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length >= 1 && trimmed.length <= SONG_REQUEST_MAX
    ? trimmed
    : null;
}
