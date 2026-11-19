import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Mỗi người chỉ có MỘT lời chúc cho mỗi thiệp.
 *
 * Khoá định danh:
 *  - khách có link riêng → `guest:<guest_id>`
 *  - khách vào link chung → `anon:<uuid>` (uuid sinh ở client, lưu localStorage)
 *
 * Gửi lại = sửa lời chúc cũ (update), không tạo bản ghi mới.
 * Nếu DB chưa chạy migration v18 (thiếu cột `author_key`) thì lùi về tra theo
 * `guest_id` — vẫn chặn được spam từ link cá nhân.
 */

export type SaveWishInput = {
  weddingId: string;
  guestId: string | null;
  authorKey: string | null;
  name: string;
  message: string;
  autoApprove: boolean;
};

export type SaveWishResult = {
  saved: boolean;
  updated: boolean;
  id: string | null;
};

const AUTHOR_KEY_RE = /^(guest|anon):[A-Za-z0-9-]{6,64}$/;

export function normalizeAuthorKey(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return AUTHOR_KEY_RE.test(trimmed) ? trimmed : null;
}

function isMissingAuthorKey(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42703") return true;
  return /author_key/i.test(error.message ?? "");
}

function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}

export async function saveWishOnce(
  client: SupabaseClient,
  input: SaveWishInput,
): Promise<SaveWishResult> {
  const { weddingId, guestId, name, message, autoApprove } = input;
  const authorKey = input.authorKey ?? (guestId ? `guest:${guestId}` : null);

  let existing: { id: string; approved: boolean | null } | null = null;
  let supportsAuthorKey = Boolean(authorKey);

  if (authorKey) {
    const { data, error } = await client
      .from("wishes")
      .select("id, approved")
      .eq("wedding_id", weddingId)
      .eq("author_key", authorKey)
      .maybeSingle();
    if (error && isMissingAuthorKey(error)) {
      supportsAuthorKey = false;
    } else if (error) {
      throw error;
    } else {
      existing = data ?? null;
    }
  }

  // Fallback khi chưa có cột author_key: chỉ tra được theo guest_id.
  if (!supportsAuthorKey && guestId) {
    const { data, error } = await client
      .from("wishes")
      .select("id, approved")
      .eq("wedding_id", weddingId)
      .eq("guest_id", guestId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    existing = data ?? null;
  }

  if (existing) {
    const patch: Record<string, unknown> = { message, name };
    if (autoApprove && existing.approved !== true) patch.approved = true;
    const { error } = await client.from("wishes").update(patch).eq("id", existing.id);
    if (error) throw error;
    return { saved: true, updated: true, id: existing.id };
  }

  const row: Record<string, unknown> = {
    wedding_id: weddingId,
    guest_id: guestId,
    name,
    message,
    approved: autoApprove,
  };
  if (supportsAuthorKey && authorKey) row.author_key = authorKey;

  const { data, error } = await client.from("wishes").insert(row).select("id").maybeSingle();
  if (error && isUniqueViolation(error) && authorKey) {
    // Hai request đồng thời: bản ghi đã được request kia tạo → cập nhật.
    const { error: updateError } = await client
      .from("wishes")
      .update({ message, name })
      .eq("wedding_id", weddingId)
      .eq("author_key", authorKey);
    if (updateError) throw updateError;
    return { saved: true, updated: true, id: null };
  }
  if (error) throw error;
  return { saved: true, updated: false, id: data?.id ?? null };
}
