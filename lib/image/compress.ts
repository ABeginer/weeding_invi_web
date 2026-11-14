export type CompressKind = "gallery" | "couple" | "banner" | "og" | "gift" | "album";

export interface CompressResult {
  blob: Blob;
  width: number;
  height: number;
  contentType: "image/webp" | "image/jpeg";
  originalBytes: number;
  outputBytes: number;
}

const MAX_INPUT_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_OUTPUT_BYTES = 10 * 1024 * 1024; // 10 MB

const RAW_EXTENSIONS = new Set(["cr2", "nef", "arw", "dng", "raf", "orf"]);

export function isRawImageFile(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext && RAW_EXTENSIONS.has(ext)) return true;
  return false;
}

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export function isAllowedImageFile(file: File): boolean {
  if (isRawImageFile(file)) return false;
  if (ALLOWED_MIME_TYPES.has(file.type)) return true;
  // Một số trình duyệt Safari / iOS có thể để trống mime cho file .heic
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext === "heic" || ext === "heif" || ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp";
}

function loadImageElementFallback(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Định dạng ảnh chưa được hỗ trợ."));
    };
    img.src = objectUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

export async function compressImage(
  file: File,
  kind: CompressKind = "gallery",
): Promise<CompressResult> {
  // 1. Kiểm tra định dạng RAW
  if (isRawImageFile(file)) {
    throw new Error("Ảnh RAW chưa được hỗ trợ. Vui lòng xuất sang JPEG rồi tải lên.");
  }

  // 2. Kiểm tra dung lượng > 25 MB trước khi đọc file
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Ảnh vượt quá 25 MB. Vui lòng chọn ảnh nhỏ hơn.");
  }

  // 3. Kiểm tra định dạng ảnh được hỗ trợ
  if (!isAllowedImageFile(file)) {
    throw new Error("Định dạng ảnh chưa được hỗ trợ.");
  }

  // 4. Giải mã ảnh bằng createImageBitmap hoặc Image element fallback
  let sourceWidth = 0;
  let sourceHeight = 0;
  let sourceDrawable: ImageBitmap | HTMLImageElement;

  if (typeof window !== "undefined" && "createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file);
      sourceWidth = bitmap.width;
      sourceHeight = bitmap.height;
      sourceDrawable = bitmap;
    } catch {
      // Fallback sang HTMLImageElement
      const img = await loadImageElementFallback(file);
      sourceWidth = img.naturalWidth || img.width;
      sourceHeight = img.naturalHeight || img.height;
      sourceDrawable = img;
    }
  } else {
    const img = await loadImageElementFallback(file);
    sourceWidth = img.naturalWidth || img.width;
    sourceHeight = img.naturalHeight || img.height;
    sourceDrawable = img;
  }

  if (!sourceWidth || !sourceHeight) {
    throw new Error("Định dạng ảnh chưa được hỗ trợ.");
  }

  // 5. Tính toán kích thước co lại theo loại ảnh (không phóng to nếu ảnh nhỏ hơn)
  let targetWidth = sourceWidth;
  let targetHeight = sourceHeight;

  if (kind === "og") {
    targetWidth = 1200;
    targetHeight = 630;
  } else {
    // 1600px đủ nét trên điện thoại và nhẹ hơn 2048px ~35%.
    const maxDimension = 1600;
    const longerSide = Math.max(sourceWidth, sourceHeight);

    if (longerSide > maxDimension) {
      const scale = maxDimension / longerSide;
      targetWidth = Math.max(1, Math.round(sourceWidth * scale));
      targetHeight = Math.max(1, Math.round(sourceHeight * scale));
    }
  }

  // 6. Vẽ ra canvas để strip EXIF metadata
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Trình duyệt không hỗ trợ xử lý ảnh canvas.");
  }

  ctx.drawImage(sourceDrawable, 0, 0, targetWidth, targetHeight);

  // Giải phóng ImageBitmap nếu có
  if ("close" in sourceDrawable && typeof sourceDrawable.close === "function") {
    sourceDrawable.close();
  }

  // 7. Xuất blob: ưu tiên WebP (chất lượng 0.8), fallback sang JPEG (0.85)
  let outputType: "image/webp" | "image/jpeg" = "image/webp";
  let blob = await canvasToBlob(canvas, "image/webp", 0.8);

  if (!blob || blob.type !== "image/webp") {
    outputType = "image/jpeg";
    blob = await canvasToBlob(canvas, "image/jpeg", 0.85);
  }

  if (!blob) {
    throw new Error("Không thể xử lý và nén ảnh.");
  }

  if (blob.size > MAX_OUTPUT_BYTES) {
    throw new Error("Ảnh sau khi nén vẫn vượt quá 10 MB. Vui lòng chọn ảnh nhỏ hơn.");
  }

  return {
    blob,
    width: targetWidth,
    height: targetHeight,
    contentType: outputType,
    originalBytes: file.size,
    outputBytes: blob.size,
  };
}

export function formatBytesVi(bytes: number): string {
  if (bytes <= 0) return "0 KB";
  if (bytes >= 1024 * 1024) {
    const mb = bytes / (1024 * 1024);
    const formatted = mb >= 10 ? mb.toFixed(0) : mb.toFixed(1).replace(".", ",");
    return `${formatted} MB`;
  }
  const kb = Math.round(bytes / 1024);
  return `${kb} KB`;
}

export function formatSavedSize(originalBytes: number, outputBytes: number): string {
  return `Đã giảm từ ${formatBytesVi(originalBytes)} xuống ${formatBytesVi(outputBytes)}`;
}

