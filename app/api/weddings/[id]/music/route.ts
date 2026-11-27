import { authRoute, fail, json } from "@/lib/server/http";
import { toWedding, type WeddingRow } from "@/lib/server/mappers";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import {
  buildMusicStorageKey,
  deletePhotoObject,
  putMusicObject,
} from "@/lib/server/storage";
import { db } from "@/lib/server/supabase";
import { getOwnedWedding } from "@/lib/server/weddings";
import { normalizeWeddingContent } from "@/lib/wedding-data";
import { MUSIC_MAX_BYTES } from "@/config/plans";

type Ctx = { params: Promise<{ id: string }> };

function isMp3(bytes: Uint8Array): boolean {
  if (bytes.length < 3) return false;
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) return true; // ID3
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) return true; // MPEG frame
  return false;
}

export const POST = authRoute<Ctx>(async (req, user, { params }) => {
  const limited = rateLimit(req, `music-upload:${user.id}`, 5, 60_000);
  if (!limited.ok) return tooManyRequests(limited);

  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);
  if (wedding.plan === "free") {
    return fail("Nâng cấp lên Pro để tải file nhạc riêng.", 403);
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return fail("Yêu cầu phải gửi dạng multipart/form-data.");
  }

  const file = formData.get("file");
  if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
    return fail("Vui lòng chọn file MP3.");
  }
  if (file.size <= 0) return fail("File nhạc rỗng.");
  if (file.size > MUSIC_MAX_BYTES) {
    return fail("File nhạc tối đa 8 MB.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isMp3(bytes)) {
    return fail("Chỉ hỗ trợ file MP3.");
  }

  const storageKey = buildMusicStorageKey(wedding.id);
  await putMusicObject(storageKey, bytes, "audio/mpeg");

  const url = `/media/${storageKey}`;
  const rawPrevContent =
    wedding.content && typeof wedding.content === "object"
      ? (wedding.content as Record<string, unknown>)
      : {};
  const content = normalizeWeddingContent(wedding.content);
  const oldMusicUrl = content.musicUrl;
  content.musicPreset = "custom";
  content.musicUrl = url;
  content.musicTitle = String(formData.get("title") ?? "Nhạc nền của chúng tôi")
    .trim()
    .slice(0, 120) || "Nhạc nền của chúng tôi";

  const nextContent: Record<string, unknown> = {
    ...content,
    ...(typeof rawPrevContent.suspended === "boolean"
      ? { suspended: rawPrevContent.suspended }
      : {}),
    ...(typeof rawPrevContent.sharePinFailCount === "number"
      ? { sharePinFailCount: rawPrevContent.sharePinFailCount }
      : {}),
    ...(typeof rawPrevContent.sharePinLockedUntil === "string"
      ? { sharePinLockedUntil: rawPrevContent.sharePinLockedUntil }
      : {}),
  };

  const { data, error } = await db()
    .from("weddings")
    .update({ content: nextContent, updated_at: new Date().toISOString() })
    .eq("id", wedding.id)
    .eq("owner_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    await deletePhotoObject(storageKey).catch(() => undefined);
    throw error;
  }
  if (!data) return fail("Không tìm thấy thiệp cưới.", 404);

  // Dọn file MP3 cũ trên R2 để tránh rác lưu trữ
  if (
    typeof oldMusicUrl === "string" &&
    oldMusicUrl.startsWith(`/media/weddings/${wedding.id}/music/`) &&
    oldMusicUrl !== url
  ) {
    const oldKey = oldMusicUrl.slice("/media/".length);
    void deletePhotoObject(oldKey).catch(() => undefined);
  }

  return json({ wedding: toWedding(data as WeddingRow), url });
});
