import { UPLOAD_ALLOWED_MIME_TYPES, UPLOAD_MAX_BYTES } from "@/config/plans";

const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 0.82;

export function validateImageFile(file: File): string | null {
  if (!(UPLOAD_ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return "Chỉ hỗ trợ định dạng ảnh JPG, PNG hoặc WebP.";
  }
  if (file.size <= 0) {
    return "File ảnh rỗng hoặc không đọc được.";
  }
  if (file.size > UPLOAD_MAX_BYTES) {
    return "Ảnh tải lên vượt quá dung lượng tối đa 5 MB.";
  }
  return null;
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Không thể đọc nội dung file ảnh."));
    };
    img.src = objectUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

/**
 * Kiểm tra định dạng/dung lượng ban đầu, co kích thước cạnh dài về <= 1600px
 * và nén sang WebP (chất lượng 0.82) trước khi tải lên server.
 */
export async function compressImageFile(file: File): Promise<File> {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const img = await loadImageElement(file);
  const srcWidth = img.naturalWidth || img.width;
  const srcHeight = img.naturalHeight || img.height;

  if (!srcWidth || !srcHeight) {
    throw new Error("Không xác định được kích thước ảnh.");
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(srcWidth, srcHeight));
  const targetWidth = Math.max(1, Math.round(srcWidth * scale));
  const targetHeight = Math.max(1, Math.round(srcHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Trình duyệt không hỗ trợ xử lý ảnh canvas.");
  }

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  let outputMime = "image/webp";
  let blob = await canvasToBlob(canvas, outputMime, WEBP_QUALITY);

  if (!blob || blob.size === 0) {
    outputMime = "image/jpeg";
    blob = await canvasToBlob(canvas, outputMime, 0.85);
  }

  if (blob && blob.size > UPLOAD_MAX_BYTES) {
    blob = await canvasToBlob(canvas, outputMime, 0.68);
  }

  if (!blob || blob.size === 0) {
    throw new Error("Không thể nén ảnh trước khi tải lên.");
  }

  if (blob.size > UPLOAD_MAX_BYTES) {
    throw new Error("Ảnh sau khi nén vẫn vượt quá giới hạn 5 MB.");
  }

  const baseName = file.name.replace(/\.[^/.]+$/, "").trim() || "photo";
  const ext = outputMime === "image/webp" ? "webp" : "jpg";

  return new File([blob], `${baseName}.${ext}`, {
    type: outputMime,
    lastModified: Date.now(),
  });
}

