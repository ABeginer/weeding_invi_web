import assert from "node:assert/strict";
import test from "node:test";
import { resolveVenueMapsUrl, VENUE_QR_THEMES } from "../lib/venue-qr.ts";

test("lib/venue-qr.ts — Tạo mã QR địa điểm đám cưới", async (t) => {
  await t.test("giữ nguyên link Google Maps hợp lệ dạng https", () => {
    const res = resolveVenueMapsUrl("https://maps.app.goo.gl/abcdef123");
    assert.equal(res.ok, true);
    assert.equal(res.kind, "url");
    assert.equal(res.url, "https://maps.app.goo.gl/abcdef123");
  });

  await t.test("chuyển đổi tọa độ lat,lng sang URL tìm kiếm Google Maps", () => {
    const res = resolveVenueMapsUrl("10.7769, 106.7009");
    assert.equal(res.ok, true);
    assert.equal(res.kind, "coordinates");
    assert.equal(
      res.url,
      "https://www.google.com/maps/search/?api=1&query=10.7769%2C106.7009",
    );
  });

  await t.test("mã hóa tên nhà hàng và địa chỉ tiếng Việt có dấu thành link Google Maps", () => {
    const res = resolveVenueMapsUrl("White Palace, 194 Hoàng Văn Thụ, Phú Nhuận");
    assert.equal(res.ok, true);
    assert.equal(res.kind, "address");
    assert.ok(res.url.startsWith("https://www.google.com/maps/search/?api=1&query="));
    assert.ok(res.url.includes("White%20Palace"));
  });

  await t.test("chặn các scheme nguy hiểm và báo lỗi rỗng rõ ràng", () => {
    const empty = resolveVenueMapsUrl("   ");
    assert.equal(empty.ok, false);
    assert.equal(empty.kind, "empty");

    const xss = resolveVenueMapsUrl("javascript:alert(1)");
    assert.equal(xss.ok, false);
    assert.equal(xss.kind, "invalid");
  });

  await t.test("cung cấp đủ 3 khung trang trí thiệp cưới theo spec", () => {
    assert.deepEqual(Object.keys(VENUE_QR_THEMES), ["cream", "burgundy", "olive"]);
  });
});
