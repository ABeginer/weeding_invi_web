import { db } from "./supabase";

export const FREE_INVITE_VIEW_LIMIT = 30;

const CRAWLER_RE =
  /bot|crawler|spider|facebookexternalhit|zalo|telegrambot|whatsapp|slack|discord|google-inspectiontool|bingpreview/i;

export function isLikelyCrawler(userAgent: string | null | undefined): boolean {
  return Boolean(userAgent && CRAWLER_RE.test(userAgent));
}

/**
 * Cộng 1 lượt mở cho link thiệp cá nhân và trả về tổng số lượt.
 * Đếm MỌI lượt mở (không phân biệt thiết bị), đúng nghiệp vụ "30 lần xem".
 *
 * Trả null khi migration/RPC chưa có, để caller fail open thay vì làm sập thiệp.
 */
export async function trackGuestView(guestId: string): Promise<number | null> {
  if (!guestId) return null;
  const { data, error } = await db().rpc("track_guest_view_open", {
    p_guest_id: guestId,
  });
  if (error) {
    const message = error.message ?? "";
    if (
      error.code === "42883" ||
      /function .*track_guest_view_open|does not exist|schema cache/i.test(message)
    ) {
      return null;
    }
    throw error;
  }
  return typeof data === "number" ? data : null;
}
