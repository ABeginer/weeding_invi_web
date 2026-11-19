import { zipSync, strToU8 } from "fflate";

export interface PhotoWallZipItem {
  id: string;
  url: string;
  guestName?: string | null;
  caption?: string | null;
  createdAt?: string | null;
}

export interface ExportPhotoWallZipProgress {
  loaded: number;
  total: number;
  percent: number;
  currentFileName?: string;
}

export interface ExportPhotoWallZipOptions {
  weddingSlug: string;
  photos: PhotoWallZipItem[];
  onProgress?: (progress: ExportPhotoWallZipProgress) => void;
  signal?: AbortSignal;
  concurrency?: number;
}

export interface ExportPhotoWallZipResult {
  success: boolean;
  totalPhotos: number;
  downloadedCount: number;
  failedCount: number;
  fileName: string;
  cancelled?: boolean;
}

/**
 * Loại bỏ dấu tiếng Việt và ký tự đặc biệt để đặt tên file an toàn trong file ZIP
 */
export function sanitizeZipFileName(name: string): string {
  if (!name || typeof name !== "string") return "anh";
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, (m) => (m === "đ" ? "d" : "D"));

  const cleaned = normalized
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return cleaned || "anh";
}

/**
 * Xác định phần mở rộng file (.webp, .jpg, .png...) từ Content-Type hoặc URL
 */
export function resolveImageExtension(contentType?: string | null, url?: string): string {
  const mime = (contentType || "").toLowerCase();
  if (mime.includes("image/webp")) return ".webp";
  if (mime.includes("image/jpeg") || mime.includes("image/jpg")) return ".jpg";
  if (mime.includes("image/png")) return ".png";
  if (mime.includes("image/gif")) return ".gif";
  if (mime.includes("image/heic") || mime.includes("image/heif")) return ".heic";

  if (url) {
    const match = url.match(/\.(webp|jpg|jpeg|png|gif|heic|heif)(?:\?.*)?$/i);
    if (match && match[1]) {
      const ext = match[1].toLowerCase();
      return ext === "jpeg" ? ".jpg" : `.${ext}`;
    }
  }

  return ".webp";
}

/**
 * Tải toàn bộ ảnh Photo Wall và đóng gói thành file ZIP ngay trên trình duyệt (Client-side)
 * Sử dụng fflate STORE (level 0) để tốc độ đóng gói tức thì và tiết kiệm CPU/RAM máy khách.
 */
export async function exportPhotoWallZip({
  weddingSlug,
  photos,
  onProgress,
  signal,
  concurrency = 4,
}: ExportPhotoWallZipOptions): Promise<ExportPhotoWallZipResult> {
  if (typeof window === "undefined") {
    throw new Error("exportPhotoWallZip chỉ có thể chạy trên trình duyệt (client-side).");
  }

  if (photos.length === 0) {
    throw new Error("Danh sách ảnh tải về trống.");
  }

  const padLength = photos.length >= 100 ? 3 : 2;
  const downloadedFiles: { fileName: string; bytes: Uint8Array }[] = [];
  const textCaptions: string[] = [];

  let loadedCount = 0;
  let failedCount = 0;
  let indexCursor = 0;

  // Hàng đợi tải ảnh với concurrency giới hạn (mặc định 4 kết nối đồng thời)
  const worker = async () => {
    while (indexCursor < photos.length) {
      if (signal?.aborted) {
        throw new DOMException("Người dùng đã hủy tải ảnh.", "AbortError");
      }

      const currentIndex = indexCursor++;
      const photo = photos[currentIndex];
      const paddedIndex = String(currentIndex + 1).padStart(padLength, "0");
      const baseName = sanitizeZipFileName(photo.guestName || "khach-moi");

      try {
        const response = await fetch(photo.url, {
          signal,
          mode: "cors",
          cache: "force-cache",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        const ext = resolveImageExtension(contentType, photo.url);
        const fileName = `${paddedIndex}-${baseName}${ext}`;

        const buffer = await response.arrayBuffer();
        downloadedFiles.push({
          fileName,
          bytes: new Uint8Array(buffer),
        });

        if (photo.caption || photo.guestName) {
          textCaptions.push(
            `[${fileName}]\nNgười gửi: ${photo.guestName || "Khách mời"}\nLời chúc: ${photo.caption || "(Không có lời chúc)"}\n`,
          );
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          throw err;
        }
        console.warn(`Không thể tải ảnh index ${currentIndex}:`, err);
        failedCount += 1;
      } finally {
        loadedCount += 1;
        onProgress?.({
          loaded: loadedCount,
          total: photos.length,
          percent: Math.min(100, Math.round((loadedCount / photos.length) * 100)),
        });
      }
    }
  };

  // Khởi chạy nhóm worker tải đồng thời
  const activeWorkers = Array.from(
    { length: Math.min(concurrency, photos.length) },
    () => worker(),
  );

  try {
    await Promise.all(activeWorkers);
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return {
        success: false,
        totalPhotos: photos.length,
        downloadedCount: downloadedFiles.length,
        failedCount,
        fileName: "",
        cancelled: true,
      };
    }
    throw err;
  }

  if (downloadedFiles.length === 0) {
    throw new Error("Không thể tải ảnh nào do lỗi kết nối mạng.");
  }

  // 1. Chuẩn bị các file trong ZIP dạng level: 0 (STORE mode - không nén lại ảnh đã tối ưu)
  const zipEntries: Record<string, [Uint8Array, { level: 0 }]> = {};

  for (const file of downloadedFiles) {
    zipEntries[file.fileName] = [file.bytes, { level: 0 }];
  }

  // 2. Đính kèm file văn bản lời chúc nếu có
  if (textCaptions.length > 0) {
    const dateFormatted = new Date().toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    });
    const txtHeader = [
      "===========================================================",
      "  DANH SÁCH LỜI CHÚC & ẢNH KỶ NIỆM PHOTO WALL — INVIWEDD",
      `  Tiệc cưới: ${weddingSlug}`,
      `  Thời gian xuất: ${dateFormatted}`,
      `  Tổng số ảnh: ${downloadedFiles.length}/${photos.length}`,
      "===========================================================\n\n",
    ].join("\n");

    const fullTxt = txtHeader + textCaptions.join("\n-----------------------------------------------------------\n\n");
    zipEntries["loi-chuc-kem-anh.txt"] = [strToU8(fullTxt), { level: 0 }];
  }

  // 3. Đóng gói ZIP đồng bộ siêu nhanh
  const zipBytes = zipSync(zipEntries, { level: 0 });

  // 4. Kích hoạt tải file về máy
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const zipFileName = `inviwedd-photo-wall-${weddingSlug}-${yyyy}${mm}${dd}.zip`;

  const blob = new Blob([zipBytes], { type: "application/zip" });
  const downloadUrl = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = zipFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Giải phóng Object URL sau khi tải
  setTimeout(() => {
    URL.revokeObjectURL(downloadUrl);
  }, 10000);

  return {
    success: true,
    totalPhotos: photos.length,
    downloadedCount: downloadedFiles.length,
    failedCount,
    fileName: zipFileName,
  };
}
