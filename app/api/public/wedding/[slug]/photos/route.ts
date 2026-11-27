import { getPlanLimits, type AllowedUploadMimeType } from "@/config/plans";
import { fail, json, route, text } from "@/lib/server/http";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { toPhoto, type PhotoRow } from "@/lib/server/mappers";
import {
  buildPhotoStorageKey,
  deletePhotoObject,
  detectImageMimeFromBytes,
  putPhotoObject,
} from "@/lib/server/storage";
import { db } from "@/lib/server/supabase";
import { verifyTurnstileToken } from "@/lib/server/turnstile";
import { isWeddingSuspendedRow } from "@/lib/server/weddings";
import { saveWishOnce } from "@/lib/server/wishes";
import { normalizeWeddingContent } from "@/lib/wedding-data";
import type { WeddingPhoto } from "@/lib/wedding-types";

type Ctx = { params: Promise<{ slug: string }> };

const MAX_GUEST_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_FILES_PER_REQUEST = 5;

export const POST = route(async (req: Request, { params }: Ctx) => {
  // Rate limit: Tối đa 25 lượt gửi ảnh trong 10 phút trên mỗi IP
  const limited = rateLimit(req, "guest-photo-upload", 25, 600_000);
  if (!limited.ok) return tooManyRequests(limited);

  const { slug } = await params;
  const client = db();

  const { data: wedding, error: weddingError } = await client
    .from("weddings")
    .select("id, slug, plan, content, suspended")
    .eq("slug", slug)
    .maybeSingle();

  if (weddingError || !wedding) {
    return fail("Không tìm thấy thiệp cưới.", 404);
  }

  if (isWeddingSuspendedRow(wedding)) {
    return fail("Thiệp cưới hiện đang tạm ngưng.", 403);
  }

  // Khóa tính năng gửi ảnh khách: chỉ khả dụng riêng cho gói VIP (Live Photo Wall)
  if (wedding.plan !== "vip") {
    return fail("Tính năng gửi ảnh lên Live Photo Wall chỉ dành riêng cho gói VIP.", 403);
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return fail("Dữ liệu gửi lên không hợp lệ.", 400);
  }

  const captcha = await verifyTurnstileToken(req, formData.get("turnstileToken"));
  if (!captcha.ok) {
    return fail(
      captcha.error ?? "Xác thực chống spam không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.",
      400,
    );
  }

  // Hỗ trợ cả gửi gộp nhiều ảnh (`files`) lẫn gửi 1 ảnh (`file`) để tương thích ngược
  const rawEntries = [
    ...formData.getAll("files"),
    ...formData.getAll("file"),
  ].filter((entry): entry is File => typeof entry !== "string" && entry instanceof Blob);

  if (rawEntries.length === 0) {
    return fail("Vui lòng chọn ảnh cần gửi.", 400);
  }
  if (rawEntries.length > MAX_FILES_PER_REQUEST) {
    return fail(`Chỉ được gửi tối đa ${MAX_FILES_PER_REQUEST} ảnh mỗi lượt.`, 400);
  }

  const validatedFiles: Array<{ bytes: Uint8Array; mime: AllowedUploadMimeType }> = [];
  for (const fileEntry of rawEntries) {
    if (fileEntry.size > MAX_GUEST_PHOTO_BYTES) {
      return fail("Dung lượng mỗi ảnh tối đa là 10 MB.", 400);
    }
    const bytes = new Uint8Array(await fileEntry.arrayBuffer());
    const detectedMime = detectImageMimeFromBytes(bytes);
    if (!detectedMime) {
      return fail("Định dạng file không hợp lệ. Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.", 400);
    }
    validatedFiles.push({ bytes, mime: detectedMime });
  }

  const guestName = text(formData.get("guestName"), 100) ?? "";
  const wishMessage = text(formData.get("wishMessage"), 500) ?? "";

  // Kiểm tra giới hạn tổng số ảnh album theo gói cước & tính vị trí tiếp theo
  const { data: existingRows, error: existingRowsError } = await client
    .from("photos")
    .select("position")
    .eq("wedding_id", wedding.id)
    .eq("kind", "album");

  if (existingRowsError) throw existingRowsError;

  const currentRows = existingRows ?? [];
  const maxAlbumPhotos = getPlanLimits(wedding.plan as "free" | "pro" | "vip").photos.album;
  if (currentRows.length + validatedFiles.length > maxAlbumPhotos) {
    const remaining = Math.max(0, maxAlbumPhotos - currentRows.length);
    return fail(
      remaining === 0
        ? `Album ảnh đã đạt giới hạn tối đa ${maxAlbumPhotos} ảnh.`
        : `Album chỉ còn trống ${remaining} ảnh (giới hạn ${maxAlbumPhotos} ảnh).`,
      403,
    );
  }

  let nextPosition =
    currentRows.reduce(
      (max, row) => Math.max(max, Number(row.position ?? 0)),
      -1,
    ) + 1;

  const uploadedPhotos: WeddingPhoto[] = [];

  for (const item of validatedFiles) {
    const storageKey = buildPhotoStorageKey(wedding.id, "album");
    await putPhotoObject(storageKey, item.bytes, item.mime);

    const { data: inserted, error: insertError } = await client
      .from("photos")
      .insert({
        wedding_id: wedding.id,
        kind: "album",
        storage_key: storageKey,
        position: nextPosition,
      })
      .select("*")
      .single();

    if (insertError) {
      await deletePhotoObject(storageKey).catch(() => undefined);
      throw insertError;
    }

    uploadedPhotos.push(toPhoto(inserted as PhotoRow));
    nextPosition += 1;
  }

  const rawPrevContent =
    wedding.content && typeof wedding.content === "object"
      ? (wedding.content as Record<string, unknown>)
      : {};
  const content = normalizeWeddingContent(wedding.content);
  const isAutoApprove = content.photoApprovalMode === "auto";
  const wishAutoApprove =
    content.wishApprovalMode === "auto" &&
    !(content.hiddenSections ?? []).includes("rsvp");

  // Cập nhật trạng thái duyệt vào content.photoModeration (bảo toàn trường do server quản lý)
  const nextModeration: Record<string, "pending" | "approved" | "hidden"> = {
    ...(content.photoModeration || {}),
  };
  for (const photo of uploadedPhotos) {
    nextModeration[photo.id] = isAutoApprove ? "approved" : "pending";
  }

  await client
    .from("weddings")
    .update({
      content: {
        ...content,
        photoModeration: nextModeration,
        ...(typeof rawPrevContent.suspended === "boolean"
          ? { suspended: rawPrevContent.suspended }
          : {}),
        ...(typeof rawPrevContent.sharePinFailCount === "number"
          ? { sharePinFailCount: rawPrevContent.sharePinFailCount }
          : {}),
        ...(typeof rawPrevContent.sharePinLockedUntil === "string"
          ? { sharePinLockedUntil: rawPrevContent.sharePinLockedUntil }
          : {}),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", wedding.id);

  // Nếu khách có để lại tên hoặc lời chúc, tự động lưu 1 lần vào sổ lời chúc (tôn trọng wishApprovalMode)
  if (guestName || wishMessage) {
    try {
      await saveWishOnce(client, {
        weddingId: wedding.id,
        guestId: null,
        authorKey: null,
        name: guestName || "Khách mời tiệc cưới",
        message: wishMessage || "Chúc hai bạn trăm năm hạnh phúc, đầu bạc răng long!",
        autoApprove: wishAutoApprove,
      });
    } catch (err) {
      console.warn("Không thể lưu kèm lời chúc từ khách gửi ảnh:", err);
    }
  }

  return json({
    ok: true,
    photo: uploadedPhotos[0],
    photos: uploadedPhotos,
    count: uploadedPhotos.length,
    autoApproved: isAutoApprove,
    message: isAutoApprove
      ? "Đã gửi ảnh thành công! Ảnh sẽ sớm xuất hiện trên màn hình tiệc cưới."
      : "Đã gửi ảnh thành công! Ảnh của bạn đang chờ duyệt và sẽ xuất hiện trên màn hình tiệc sau khi được duyệt.",
  });
});
