import {
  getPhotoLimitMessage,
  getPlanLimits,
  UPLOAD_ALLOWED_MIME_TYPES,
  UPLOAD_MAX_BYTES,
  type AllowedUploadMimeType,
} from "@/config/plans";
import { authRoute, fail, json } from "@/lib/server/http";
import { toPhoto, type PhotoRow } from "@/lib/server/mappers";
import {
  buildPhotoStorageKey,
  deletePhotoObject,
  detectImageMimeFromBytes,
  putPhotoObject,
} from "@/lib/server/storage";
import { db } from "@/lib/server/supabase";
import { getOwnedWedding, listWeddingPhotos } from "@/lib/server/weddings";
import { normalizeWeddingContent } from "@/lib/wedding-data";
import {
  reorderPositionsSchema,
  type PhotoKind,
  type PhotoSlot,
} from "@/lib/wedding-types";

type Ctx = { params: Promise<{ id: string }> };

const VALID_KINDS = new Set<PhotoKind>(["banner", "couple", "gallery"]);
const VALID_SLOTS = new Set<PhotoSlot>(["hero", "groom", "bride"]);

function isAllowedMime(value: string): value is AllowedUploadMimeType {
  return (UPLOAD_ALLOWED_MIME_TYPES as readonly string[]).includes(value);
}

export const GET = authRoute<Ctx>(async (_req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  const photos = await listWeddingPhotos(wedding.id);
  return json(photos);
});

export const POST = authRoute<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return fail("Yêu cầu phải gửi dạng multipart/form-data.");
  }

  const rawKind = formData.get("kind");
  const kind =
    typeof rawKind === "string" && VALID_KINDS.has(rawKind as PhotoKind)
      ? (rawKind as PhotoKind)
      : null;

  if (!kind) {
    return fail("Loại ảnh (kind) phải là banner, couple hoặc gallery.");
  }

  const rawSlot = formData.get("slot");
  const slot =
    typeof rawSlot === "string" && VALID_SLOTS.has(rawSlot as PhotoSlot)
      ? (rawSlot as PhotoSlot)
      : null;

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

  const client = db();
  const { data: existingRows, error: listError } = await client
    .from("photos")
    .select("id, position")
    .eq("wedding_id", wedding.id)
    .eq("kind", kind);

  if (listError) throw listError;

  const maxForKind = getPlanLimits(wedding.plan).photos[kind];
  const currentRows = existingRows ?? [];
  if (currentRows.length >= maxForKind) {
    return fail(getPhotoLimitMessage(wedding.plan, kind), 403);
  }

  const bytes = new Uint8Array(await fileEntry.arrayBuffer());
  if (bytes.byteLength > UPLOAD_MAX_BYTES) {
    return fail("Ảnh tải lên vượt quá dung lượng tối đa 5 MB.");
  }

  const detectedMime = detectImageMimeFromBytes(bytes);
  if (!detectedMime) {
    return fail("Nội dung file không phải ảnh JPG, PNG hoặc WebP hợp lệ.");
  }

  const nextPosition =
    currentRows.reduce(
      (max, row) => Math.max(max, Number(row.position ?? 0)),
      -1,
    ) + 1;

  const storageKey = buildPhotoStorageKey(wedding.id, kind);
  await putPhotoObject(storageKey, bytes, detectedMime);

  const { data: inserted, error: insertError } = await client
    .from("photos")
    .insert({
      wedding_id: wedding.id,
      kind,
      storage_key: storageKey,
      position: nextPosition,
    })
    .select("*")
    .single();

  if (insertError) {
    await deletePhotoObject(storageKey).catch(() => undefined);
    throw insertError;
  }

  const photo = toPhoto(inserted as PhotoRow);
  let updatedContent = normalizeWeddingContent(wedding.content);

  if (
    (kind === "banner" && slot === "hero") ||
    (kind === "couple" && (slot === "groom" || slot === "bride"))
  ) {
    const fieldKey =
      slot === "hero"
        ? "heroPhotoId"
        : slot === "groom"
          ? "groomPhotoId"
          : "bridePhotoId";

    updatedContent = {
      ...updatedContent,
      [fieldKey]: photo.id,
    };

    const { error: contentError } = await client
      .from("weddings")
      .update({
        content: updatedContent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", wedding.id)
      .eq("owner_id", user.id);

    if (contentError) throw contentError;
  }

  return json({ photo, content: updatedContent }, 201);
});

export const PATCH = authRoute<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  let rawJson: unknown = null;
  try {
    rawJson = await req.json();
  } catch {
    return fail("Dữ liệu sắp xếp ảnh không hợp lệ.");
  }

  const candidate = Array.isArray(rawJson)
    ? rawJson
    : rawJson && typeof rawJson === "object" && "items" in rawJson
      ? (rawJson as { items: unknown }).items
      : null;

  const parsed = reorderPositionsSchema.safeParse(candidate);
  if (!parsed.success) {
    return fail(
      parsed.error.issues[0]?.message ?? "Danh sách sắp xếp ảnh không hợp lệ.",
    );
  }

  const items = parsed.data;
  const client = db();
  const { data: galleryRows, error: checkError } = await client
    .from("photos")
    .select("id")
    .eq("wedding_id", wedding.id)
    .eq("kind", "gallery");

  if (checkError) throw checkError;
  const ownedGalleryIds = new Set(
    (galleryRows ?? []).map((row) => String(row.id)),
  );
  if (items.some((item) => !ownedGalleryIds.has(item.id))) {
    return fail("Có ảnh không thuộc thư viện của thiệp này.", 404);
  }

  await Promise.all(
    items.map(async (item) => {
      const { error } = await client
        .from("photos")
        .update({ position: item.position })
        .eq("id", item.id)
        .eq("wedding_id", wedding.id);
      if (error) throw error;
    }),
  );

  const photos = await listWeddingPhotos(wedding.id);
  return json(photos);
});

