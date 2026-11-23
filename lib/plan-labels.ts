import type { WeddingPlan } from "@/lib/types";

/**
 * Bảng ánh xạ tên hiển thị người dùng cho các gói dịch vụ (User-facing labels).
 * Mã nội bộ (DB/API/permissions) giữ nguyên 100%: "free", "pro" (159k), "vip" (399k).
 */
export const PLAN_DISPLAY_NAME: Record<WeddingPlan, string> = {
  free: "Miễn phí",
  pro: "Standard",
  vip: "Pro",
};

export const PLAN_DISPLAY_TITLE: Record<WeddingPlan, string> = {
  free: "Gói Miễn phí",
  pro: "Gói Standard",
  vip: "Gói Pro",
};

export function getPlanDisplayName(plan: WeddingPlan): string {
  return PLAN_DISPLAY_NAME[plan] ?? plan;
}

export function getPlanDisplayTitle(plan: WeddingPlan): string {
  return PLAN_DISPLAY_TITLE[plan] ?? `Gói ${plan}`;
}

/**
 * Classes Tailwind CSS cho Badge Standard và Pro chuẩn phong cách mới:
 * - Standard: Thanh lịch, chỉn chu — viền vàng champagne / nền rượu nhạt hoặc kem (border-[#C8AD7F]/60).
 * - Pro: Black-Gold Couture đẳng cấp — nền đen tuyền #141210 viền vàng kim #D8B15B, chữ vàng sáng.
 */
export const PLAN_BADGE_CLASSES: Record<WeddingPlan, string> = {
  free: "border border-[#E8E2D9] bg-white text-[#6B655E]",
  pro: "border border-[#C8AD7F]/60 bg-[#FAF4EB] text-[#7A1C24] font-semibold tracking-wider",
  vip: "border border-[#D8B15B]/70 bg-[#141210] text-[#D8B15B] font-semibold tracking-wider shadow-xs",
};
