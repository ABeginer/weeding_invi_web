import { db } from "./supabase";

export const INVITE_VIEW_COOKIE = "invite_view_key";
export const FREE_INVITE_VIEW_LIMIT = 30;

const CRAWLER_RE =
  /bot|crawler|spider|facebookexternalhit|zalo|telegrambot|whatsapp|slack|discord|google-inspectiontool|bingpreview/i;

export function isLikelyCrawler(userAgent: string | null | undefined): boolean {
  return Boolean(userAgent && CRAWLER_RE.test(userAgent));
}

/**
 * Records one unique view for a guest link and returns the total unique views.
 * Returns null when the migration/RPC is not available yet, so callers can
 * fail open instead of taking the invitation down.
 */
export async function trackGuestView(
  guestId: string,
  viewKey: string,
): Promise<number | null> {
  if (!guestId || !viewKey) return null;
  const { data, error } = await db().rpc("track_guest_view", {
    p_guest_id: guestId,
    p_view_key: viewKey,
  });
  if (error) {
    const message = error.message ?? "";
    if (
      error.code === "42883" ||
      /function .*track_guest_view|does not exist|schema cache/i.test(message)
    ) {
      return null;
    }
    throw error;
  }
  return typeof data === "number" ? data : null;
}
