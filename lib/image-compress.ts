import { UPLOAD_ALLOWED_MIME_TYPES, UPLOAD_MAX_BYTES } from "@/config/plans";

const MAX_DIMENSION = 1280;
const WEBP_QUALITY = 0.78;

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export interface CompressResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  savedText: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 KB";
  if (bytes >= 1024 * 1024) {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1).replace(".", ",")} MB`;
  }
  return `${Math.round(bytes / 1024)} KB`;
}

export function validateImageFile(file: File): string | null {
  const allowedMime = [
    ...UPLOAD_ALLOWED_MIME_TYPES,
    "image/heic",
    "image/heif",
  ] as readonly string[];
  const isAllowedExt = /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);
  if (!allowedMime.includes(file.type.toLowerCase()) && !isAllowedExt) {
    return "Chỉ hỗ trợ định dạng ảnh JPG, PNG, WebP hoặc HEIC.";
  }
  if (file.size <= 0) {
    return "File ảnh rỗng hoặc không đọc được.";
  }
  if (file.size > 25 * 1024 * 1024) {
    return "Ảnh tải lên vượt quá dung lượng tối đa 25 MB.";
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
 * Client-side Automatic WebP Image Compression utility
 */
export async function compressImageToWebP(
  file: File,
  options: CompressOptions = {},
): Promise<CompressResult> {
  const { maxWidth = 1600, maxHeight = 1600, quality = 0.82 } = options;
  const originalSize = file.size;

  let srcW = 0;
  let srcH = 0;
  let drawable: ImageBitmap | HTMLImageElement;

  if (typeof window !== "undefined" && "createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file);
      srcW = bitmap.width;
      srcH = bitmap.height;
      drawable = bitmap;
    } catch {
      const img = await loadImageElement(file);
      srcW = img.naturalWidth || img.width;
      srcH = img.naturalHeight || img.height;
      drawable = img;
    }
  } else {
    const img = await loadImageElement(file);
    srcW = img.naturalWidth || img.width;
    srcH = img.naturalHeight || img.height;
    drawable = img;
  }

  if (!srcW || !srcH) {
    throw new Error("Không thể đọc kích thước của hình ảnh.");
  }

  let targetW = srcW;
  let targetH = srcH;
  const longerSide = Math.max(srcW, srcH);
  const maxLimit = Math.max(maxWidth, maxHeight);

  if (longerSide > maxLimit) {
    const scale = maxLimit / longerSide;
    targetW = Math.max(1, Math.round(srcW * scale));
    targetH = Math.max(1, Math.round(srcH * scale));
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Trình duyệt không hỗ trợ Canvas để nén ảnh.");
  }

  ctx.drawImage(drawable, 0, 0, targetW, targetH);

  if ("close" in drawable && typeof drawable.close === "function") {
    drawable.close();
  }

  let blob = await canvasToBlob(canvas, "image/webp", quality);
  let outputType = "image/webp";
  let outputExt = "webp";

  if (!blob || blob.type !== "image/webp") {
    blob = await canvasToBlob(canvas, "image/jpeg", 0.85);
    outputType = "image/jpeg";
    outputExt = "jpg";
  }

  if (!blob) {
    throw new Error("Không thể xuất file nén.");
  }

  if (blob.size >= originalSize) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      savedText: `Giữ nguyên kích thước gốc: ${formatFileSize(originalSize)}`,
    };
  }

  const baseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
  const compressedFile = new File([blob], `${baseName}.${outputExt}`, {
    type: outputType,
    lastModified: Date.now(),
  });

  return {
    file: compressedFile,
    originalSize,
    compressedSize: blob.size,
    savedText: `Đã tối ưu ${formatFileSize(originalSize)} → ${formatFileSize(blob.size)} (${outputExt.toUpperCase()})`,
  };
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

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const OG_MAX_BYTES = 300 * 1024;

/**
 * Tạo ảnh đại diện chia sẻ mạng xã hội (Open Graph) kích thước 1200x630 (cover crop)
 * và nén xuống dưới 300 KB.
 */
export async function createOgCoverImage(file: File): Promise<File> {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const img = await loadImageElement(file);
  const srcWidth = img.naturalWidth || img.width;
  const srcHeight = img.naturalHeight || img.height;

  if (!srcWidth || !srcHeight) {
    throw new Error("Không xác định được kích thước ảnh để tạo ảnh chia sẻ.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = OG_WIDTH;
  canvas.height = OG_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Trình duyệt không hỗ trợ xử lý ảnh canvas.");
  }

  const scale = Math.max(OG_WIDTH / srcWidth, OG_HEIGHT / srcHeight);
  const drawWidth = srcWidth * scale;
  const drawHeight = srcHeight * scale;
  const drawX = (OG_WIDTH - drawWidth) / 2;
  const drawY = (OG_HEIGHT - drawHeight) * 0.35;

  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

  const qualities = [0.85, 0.72, 0.6, 0.5, 0.4];
  let outputMime = "image/webp";
  let bestBlob: Blob | null = null;

  for (const quality of qualities) {
    const candidate = await canvasToBlob(canvas, outputMime, quality);
    if (!candidate || candidate.size === 0) break;
    bestBlob = candidate;
    if (candidate.size <= OG_MAX_BYTES) break;
  }

  if (!bestBlob || bestBlob.size === 0) {
    outputMime = "image/jpeg";
    for (const quality of qualities) {
      const candidate = await canvasToBlob(canvas, outputMime, quality);
      if (!candidate || candidate.size === 0) break;
      bestBlob = candidate;
      if (candidate.size <= OG_MAX_BYTES) break;
    }
  }

  if (!bestBlob || bestBlob.size === 0) {
    throw new Error("Không thể tạo ảnh chia sẻ Open Graph.");
  }

  const ext = outputMime === "image/webp" ? "webp" : "jpg";
  return new File([bestBlob], `og-cover.${ext}`, {
    type: outputMime,
    lastModified: Date.now(),
  });
}
