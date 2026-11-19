import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { STANDEE_DIMENSIONS } from "../lib/export-table-qr-poster.ts";
import {
  extractStoragePath,
  collectMediaUrlsFromContent,
  diffOrphanedStorageKeys,
} from "../lib/server/storage-cleanup.ts";
import type { WeddingContent } from "../lib/wedding-types.ts";

describe("Table QR Standee & Storage Hygiene", () => {
  it("khổ in Standee chuẩn 300 DPI A5 và A6", () => {
    assert.equal(STANDEE_DIMENSIONS.a6.width, 1240);
    assert.equal(STANDEE_DIMENSIONS.a6.height, 1748);
    assert.equal(STANDEE_DIMENSIONS.a5.width, 1748);
    assert.equal(STANDEE_DIMENSIONS.a5.height, 2480);
  });

  describe("extractStoragePath & IDOR protection", () => {
    const weddingId = "11111111-2222-3333-4444-555555555555";
    const validKey = `weddings/${weddingId}/album/aaaa1111-bbbb-2222-cccc-333344445555.webp`;

    it("trích xuất chính xác relative path từ /media/ URL", () => {
      const url = `/media/${validKey}?v=123`;
      const extracted = extractStoragePath(url, weddingId);
      assert.equal(extracted, validKey);
    });

    it("trích xuất chính xác từ full HTTP origin URL", () => {
      const url = `https://inviwedd.com/media/${validKey}`;
      const extracted = extractStoragePath(url, weddingId);
      assert.equal(extracted, validKey);
    });

    it("bảo vệ chống IDOR: từ chối xóa file nếu không thuộc weddingId hiện tại", () => {
      const otherWeddingId = "99999999-8888-7777-6666-555555555555";
      const otherKey = `weddings/${otherWeddingId}/album/aaaa1111-bbbb-2222-cccc-333344445555.webp`;
      const extracted = extractStoragePath(otherKey, weddingId);
      assert.equal(extracted, null);
    });

    it("bảo vệ tài nguyên tĩnh hệ thống: không bao giờ xóa /templates/, /photos/, /images/", () => {
      assert.equal(extractStoragePath("/templates/basic-1/hero.webp", weddingId), null);
      assert.equal(extractStoragePath("/photos/1.webp", weddingId), null);
      assert.equal(extractStoragePath("/images/olive-wax-seal.webp", weddingId), null);
      assert.equal(extractStoragePath("https://inviwedd.com/photos/portrait_cd.webp", weddingId), null);
    });
  });

  describe("diffOrphanedStorageKeys", () => {
    const weddingId = "11111111-2222-3333-4444-555555555555";
    const qrKey1 = `weddings/${weddingId}/gift/aaaa1111-bbbb-2222-cccc-333344445555.webp`;
    const qrKey2 = `weddings/${weddingId}/gift/bbbb2222-cccc-3333-dddd-444455556666.webp`;

    it("thu thập đúng các URL ảnh trong WeddingContent", () => {
      const content = {
        gift: {
          groomQrUrl: `/media/${qrKey1}`,
          brideQrUrl: `/media/${qrKey2}`,
        },
      } as unknown as WeddingContent;

      const collected = collectMediaUrlsFromContent(content);
      assert.equal(collected.has(`/media/${qrKey1}`), true);
      assert.equal(collected.has(`/media/${qrKey2}`), true);
    });

    it("phát hiện chính xác file mồ côi khi người dùng thay thế mã VietQR", () => {
      const newQrKey = `weddings/${weddingId}/gift/cccc3333-dddd-4444-eeee-555566667777.webp`;

      const prevContent = {
        gift: {
          groomQrUrl: `/media/${qrKey1}`,
          brideQrUrl: `/media/${qrKey2}`,
        },
      } as unknown as WeddingContent;

      const nextContent = {
        gift: {
          groomQrUrl: `/media/${newQrKey}`, // groomQrUrl đã thay bằng key mới
          brideQrUrl: `/media/${qrKey2}`,    // brideQrUrl giữ nguyên
        },
      } as unknown as WeddingContent;

      const orphaned = diffOrphanedStorageKeys(prevContent, nextContent, weddingId);
      assert.deepEqual(orphaned, [qrKey1]);
    });
  });
});
