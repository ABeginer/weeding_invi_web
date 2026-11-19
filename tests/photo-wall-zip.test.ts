import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  sanitizeZipFileName,
  resolveImageExtension,
  exportPhotoWallZip,
} from "../lib/export-photo-wall-zip.ts";

describe("Photo Wall ZIP Export Engine", () => {
  describe("sanitizeZipFileName", () => {
    it("chuyển đổi chuẩn xác tên tiếng Việt có dấu sang slug an toàn", () => {
      assert.equal(sanitizeZipFileName("Bạn Thanh Mai"), "ban-thanh-mai");
      assert.equal(sanitizeZipFileName("Nguyễn Đắc Lộc"), "nguyen-dac-loc");
      assert.equal(sanitizeZipFileName("Bác Hai & Cô Sáu"), "bac-hai-co-sau");
      assert.equal(sanitizeZipFileName("Đỗ Đức Đạt"), "do-duc-dat");
    });

    it("loại bỏ ký tự đặc biệt, emoji và chuẩn hóa dấu gạch ngang", () => {
      assert.equal(sanitizeZipFileName("---Ảnh tiệc cưới!! ❤️ 2026---"), "anh-tiec-cuoi-2026");
      assert.equal(sanitizeZipFileName("Photo #01 (VIP)"), "photo-01-vip");
      assert.equal(sanitizeZipFileName("...hello...world..."), "hello-world");
    });

    it("fallback về 'anh' khi chuỗi rỗng hoặc không hợp lệ", () => {
      assert.equal(sanitizeZipFileName(""), "anh");
      assert.equal(sanitizeZipFileName("   "), "anh");
      assert.equal(sanitizeZipFileName("!@#$%^&*()"), "anh");
      // @ts-expect-error test invalid types
      assert.equal(sanitizeZipFileName(null), "anh");
      // @ts-expect-error test invalid types
      assert.equal(sanitizeZipFileName(undefined), "anh");
    });
  });

  describe("resolveImageExtension", () => {
    it("nhận diện chuẩn xác từ Content-Type header", () => {
      assert.equal(resolveImageExtension("image/webp"), ".webp");
      assert.equal(resolveImageExtension("image/jpeg"), ".jpg");
      assert.equal(resolveImageExtension("image/jpg"), ".jpg");
      assert.equal(resolveImageExtension("image/png"), ".png");
      assert.equal(resolveImageExtension("image/gif"), ".gif");
      assert.equal(resolveImageExtension("image/heic"), ".heic");
      assert.equal(resolveImageExtension("image/jpeg; charset=utf-8"), ".jpg");
    });

    it("nhận diện chuẩn xác từ đuôi URL khi không có Content-Type", () => {
      assert.equal(
        resolveImageExtension(null, "https://res.cloudinary.com/demo/image/upload/sample.png"),
        ".png",
      );
      assert.equal(
        resolveImageExtension(undefined, "https://supabase.co/storage/v1/object/public/photos/pic.jpeg?v=1"),
        ".jpg",
      );
      assert.equal(
        resolveImageExtension("", "https://inviwedd.com/assets/banner.webp"),
        ".webp",
      );
    });

    it("fallback về .webp khi không xác định được Content-Type hoặc URL", () => {
      assert.equal(resolveImageExtension(null, null as unknown as string), ".webp");
      assert.equal(resolveImageExtension("", "https://example.com/no-extension-url"), ".webp");
      assert.equal(resolveImageExtension("application/octet-stream", "https://example.com/file"), ".webp");
    });
  });

  describe("exportPhotoWallZip guardrails", () => {
    it("báo lỗi rõ ràng khi chạy trên môi trường Node.js (non-browser)", async () => {
      await assert.rejects(
        async () => {
          await exportPhotoWallZip({
            weddingSlug: "test-slug",
            photos: [
              { id: "1", url: "https://example.com/1.jpg", guestName: "Khách 1" },
            ],
          });
        },
        {
          name: "Error",
          message: "exportPhotoWallZip chỉ có thể chạy trên trình duyệt (client-side).",
        },
      );
    });

    it("báo lỗi khi danh sách ảnh truyền vào rỗng", async () => {
      const originalWindow = globalThis.window;
      try {
        // Giả lập môi trường window
        // @ts-expect-error mock window for unit test
        globalThis.window = {};

        await assert.rejects(
          async () => {
            await exportPhotoWallZip({
              weddingSlug: "test-slug",
              photos: [],
            });
          },
          {
            name: "Error",
            message: "Danh sách ảnh tải về trống.",
          },
        );
      } finally {
        globalThis.window = originalWindow;
      }
    });
  });
});
