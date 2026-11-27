import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildVietQrPayload,
  sanitizeContent,
} from "../lib/server/vietqr.ts";
import {
  findOrderCode,
  newOrderCode,
  safeEqual,
} from "../lib/server/payments.ts";

describe("lib/server/payments.ts", () => {
  it("sinh mã đơn đúng định dạng INV-XXXXXX", () => {
    for (let i = 0; i < 20; i += 1) {
      const code = newOrderCode();
      assert.match(code, /^INV-[A-HJ-NP-Z2-9]{6}$/);
    }
  });

  it("tìm mã đơn trong nội dung chuyển khoản", () => {
    assert.equal(findOrderCode("CK INV-7K2QPM cam on"), "INV-7K2QPM");
    assert.equal(findOrderCode("inv 7k2qpm"), "INV-7K2QPM");
    assert.equal(findOrderCode("INV-7K2QPM"), "INV-7K2QPM");
    assert.equal(findOrderCode("khong co ma"), null);
  });

  it("safeEqual so sánh đúng và sai độ dài", () => {
    assert.equal(safeEqual("abc", "abc"), true);
    assert.equal(safeEqual("abc", "abd"), false);
    assert.equal(safeEqual("abc", "ab"), false);
  });
});

describe("lib/server/vietqr.ts", () => {
  it("tạo payload VietQR có cấu trúc và CRC 4 ký tự", () => {
    const payload = buildVietQrPayload({
      bin: "970436",
      accountNo: "0011009988776",
      amount: 199000,
      content: "INV-7K2QPM",
    });

    assert.ok(payload.startsWith("000201"));
    assert.ok(payload.includes("6304"));
    assert.equal(payload.slice(-4), payload.slice(-4).toUpperCase());
    assert.match(payload.slice(-4), /^[0-9A-F]{4}$/);
    assert.ok(payload.includes("5406199000"));
    assert.ok(payload.includes("INV-7K2QPM"));
  });

  it("cùng đầu vào cho cùng payload (deterministic)", () => {
    const input = {
      bin: "970436",
      accountNo: "0011009988776",
      amount: 50000,
      content: "INV-ABC123",
    };
    assert.equal(buildVietQrPayload(input), buildVietQrPayload(input));
  });

  it("chuẩn hoá nội dung chuyển khoản", () => {
    assert.equal(sanitizeContent("inv-7k2qpm"), "INV-7K2QPM");
    assert.equal(sanitizeContent("chuyển khoản"), "CHUYNKHON");
    assert.equal(sanitizeContent("a".repeat(40)).length, 25);
  });
});
