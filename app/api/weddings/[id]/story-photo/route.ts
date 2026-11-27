import {
  UPLOAD_ALLOWED_MIME_TYPES,
  UPLOAD_MAX_BYTES,
  type AllowedUploadMimeType,
} from "@/config/plans";
import { authRoute, fail, json } from "@/lib/server/http";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import {
  buildStoryPhotoStorageKey,
  detectImageMimeFromBytes,
  putPhotoObject,
} from "@/lib/server/storage";
import { getOwnedWedding } from "@/lib/server/weddings";

type Ctx = { params: Promise<{ id: string }> };

function isAllowedMime(value: string): value is AllowedUploadMimeType {
  return (UPLOAD_ALLOWED_MIME_TYPES as readonly string[]).includes(value);
}

export const POST = authRoute<Ctx>(async (req, user, { params }) => {
  const limited = rateLimit(req, `story-photo-upload:${user.id}`, 20, 60_000);
  if (!limited.ok) return tooManyRequests(limited);

  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);
  if (wedding.plan === "free") {
    return fail("Tính năng Chuyện chúng mình dành cho gói Standard và Pro.", 403);
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return fail("Yêu cầu phải gửi dạng multipart/form-data.");
  }

  const fileEntry = formData.get("file");
  if (
    !fileEntry ||
    typeof fileEntry === "string" ||
    typeof fileEntry.arrayBuffer !== "function"
  ) {
    return fail("Vui lòng chọn file ảnh để tải lên.");
  }

  if (fileEntry.size <= 0) {
    return fail("File ảnh rỗng.");
  }

  if (fileEntry.size > UPLOAD_MAX_BYTES) {
    return fail("Ảnh tải lên vượt quá dung lượng tối đa 5 MB.");
  }

  if (!isAllowedMime(fileEntry.type)) {
    return fail("Chỉ hỗ trợ định dạng ảnh JPG, PNG hoặc WebP.");
  }

  const bytes = new Uint8Array(await fileEntry.arrayBuffer());
  const detectedMime = detectImageMimeFromBytes(bytes);
  if (!detectedMime) {
    return fail("File không phải ảnh hợp lệ (chỉ nhận JPG, PNG, WebP).");
  }

  const storageKey = buildStoryPhotoStorageKey(wedding.id);
  await putPhotoObject(storageKey, bytes, detectedMime);

  return json({ url: `/media/${storageKey}` });
});
