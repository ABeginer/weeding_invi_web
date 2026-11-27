export const PLAN_PRICES: Record<"pro" | "vip", number> = {
  pro: 159000,
  vip: 399000,
};

export const PLAN_RANK: Record<"free" | "pro" | "vip", number> = {
  free: 0,
  pro: 1,
  vip: 2,
};

/**
 * Tính số tiền nâng cấp gói chính xác (VND).
 * - free -> pro: 159.000đ
 * - free -> vip: 399.000đ
 * - pro  -> vip: 240.000đ (chênh lệch giữa 399k và 159k)
 * Trả về null nếu không hợp lệ hoặc hạ cấp/trùng gói.
 */
export function calculateUpgradeAmount(
  currentPlan: "free" | "pro" | "vip",
  targetPlan: "pro" | "vip",
): number | null {
  if (PLAN_RANK[targetPlan] <= PLAN_RANK[currentPlan]) return null;
  if (currentPlan === "free" && targetPlan === "pro") return 159000;
  if (currentPlan === "free" && targetPlan === "vip") return 399000;
  if (currentPlan === "pro" && targetPlan === "vip") return 240000;
  return null;
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function newOrderCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let suffix = "";
  for (const b of bytes) suffix += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return `INV-${suffix}`;
}

export function findOrderCode(description: string): string | null {
  const match = description.toUpperCase().match(/INV\s*-?\s*([A-Z0-9]{6})/);
  return match ? `INV-${match[1]}` : null;
}

export { safeEqual } from "../safe-equal.ts";
