import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  parseDiet,
  parsePlusOnes,
  sanitizeSongRequest,
  SONG_REQUEST_MAX,
} from "../lib/rsvp-input.ts";
import {
  GIFT_METHODS,
  MAX_GIFT_AMOUNT_VND,
  parseGiftAmount,
  parseGiftMethod,
} from "../lib/gift-input.ts";

describe("lib/rsvp-input.ts", () => {
  it("parsePlusOnes chấp nhận 0..10 và mặc định 0", () => {
    assert.deepEqual(parsePlusOnes(undefined), { ok: true, value: 0 });
    assert.deepEqual(parsePlusOnes(""), { ok: true, value: 0 });
    assert.deepEqual(parsePlusOnes(0), { ok: true, value: 0 });
    assert.deepEqual(parsePlusOnes(10), { ok: true, value: 10 });
  });

  it("parsePlusOnes từ chối số âm, số lẻ, quá 10 và chuỗi", () => {
    for (const raw of [-1, 11, 1.5, "3", NaN, Infinity]) {
      const result = parsePlusOnes(raw);
      assert.equal(result.ok, false);
    }
  });

  it("parseDiet chỉ nhận meat/veg hoặc null", () => {
    assert.deepEqual(parseDiet(null), { ok: true, value: null });
    assert.deepEqual(parseDiet("meat"), { ok: true, value: "meat" });
    assert.deepEqual(parseDiet("veg"), { ok: true, value: "veg" });
    assert.equal(parseDiet("vegan").ok, false);
    assert.equal(parseDiet(1).ok, false);
  });

  it("sanitizeSongRequest trim và giới hạn 200 ký tự", () => {
    assert.equal(sanitizeSongRequest("  Em ơi Hà Nội phố  "), "Em ơi Hà Nội phố");
    assert.equal(sanitizeSongRequest(""), null);
    assert.equal(sanitizeSongRequest("   "), null);
    assert.equal(sanitizeSongRequest("a".repeat(SONG_REQUEST_MAX)), "a".repeat(200));
    assert.equal(sanitizeSongRequest("a".repeat(SONG_REQUEST_MAX + 1)), null);
    assert.equal(sanitizeSongRequest(123), null);
  });
});

describe("lib/gift-input.ts", () => {
  it("parseGiftMethod chỉ nhận cash/bank/other", () => {
    for (const method of GIFT_METHODS) {
      assert.equal(parseGiftMethod(method), method);
    }
    assert.equal(parseGiftMethod("card"), null);
    assert.equal(parseGiftMethod(1), null);
    assert.equal(parseGiftMethod(undefined), null);
  });

  it("parseGiftAmount nhận số nguyên trong khoảng cho phép", () => {
    assert.equal(parseGiftAmount(0), 0);
    assert.equal(parseGiftAmount(500_000), 500_000);
    assert.equal(parseGiftAmount(MAX_GIFT_AMOUNT_VND), MAX_GIFT_AMOUNT_VND);
  });

  it("parseGiftAmount từ chối số âm, vượt trần, số lẻ và chuỗi", () => {
    for (const raw of [-1, MAX_GIFT_AMOUNT_VND + 1, 1.5, "500000", NaN, Infinity]) {
      assert.equal(parseGiftAmount(raw), null);
    }
  });
});
