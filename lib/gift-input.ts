import type { GiftMethod } from "./types";

export const GIFT_METHODS: readonly GiftMethod[] = ["cash", "bank", "other"];
export const MAX_GIFT_AMOUNT_VND = 1_000_000_000;
export const GIFT_NOTE_MAX = 300;

export function parseGiftMethod(raw: unknown): GiftMethod | null {
  return typeof raw === "string" && GIFT_METHODS.includes(raw as GiftMethod)
    ? (raw as GiftMethod)
    : null;
}

/** Số tiền mừng: số nguyên 0..1.000.000.000 VNĐ. */
export function parseGiftAmount(raw: unknown): number | null {
  if (typeof raw !== "number" || !Number.isSafeInteger(raw)) return null;
  if (raw < 0 || raw > MAX_GIFT_AMOUNT_VND) return null;
  return raw;
}
