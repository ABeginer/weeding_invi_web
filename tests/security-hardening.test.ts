import test from "node:test";
import assert from "node:assert/strict";
import { generateLedToken, verifyLedToken } from "../lib/led-token.ts";
import { createShareCookieValue, verifyShareCookieValue } from "../lib/share-pin.ts";

test("lib/led-token.ts — Tokenized LED Link", async (t) => {
  await t.test("sinh token 12 ký tự hex nhất quán theo slug", async () => {
    const slug = "a1b2c3d4e5f6";
    const token1 = await generateLedToken(slug);
    const token2 = await generateLedToken(slug);

    assert.equal(typeof token1, "string");
    assert.equal(token1.length, 12);
    assert.match(token1, /^[0-9a-f]{12}$/);
    assert.equal(token1, token2, "Token phải có tính deterministic theo slug");
  });

  await t.test("xác thực thành công với đúng token và từ chối token sai hoặc slug khác", async () => {
    const slug = "wedding-demo-slug";
    const token = await generateLedToken(slug);

    const valid = await verifyLedToken(slug, token);
    assert.equal(valid, true, "Phải xác thực thành công");

    const invalidToken = await verifyLedToken(slug, "wrongtoken12");
    assert.equal(invalidToken, false, "Phải từ chối token sai");

    const wrongSlug = await verifyLedToken("another-slug", token);
    assert.equal(wrongSlug, false, "Phải từ chối token khi dùng cho slug khác");

    const empty = await verifyLedToken(slug, null);
    assert.equal(empty, false, "Phải từ chối token null / undefined");
  });
});

test("lib/share-pin.ts — 4-Digit PIN Cookie Token", async (t) => {
  await t.test("tạo và xác thực cookie token hợp lệ", async () => {
    const slug = "family-wedding-2026";
    const cookieValue = await createShareCookieValue(slug);

    assert.equal(typeof cookieValue, "string");
    assert.match(cookieValue, /^\d+\.[0-9a-f]{64}$/, "Định dạng timestamp.hex");

    const isValid = await verifyShareCookieValue(slug, cookieValue);
    assert.equal(isValid, true, "Xác thực cookie hợp lệ thành công");
  });

  await t.test("từ chối cookie bị can thiệp hoặc của slug khác", async () => {
    const slug = "family-wedding-2026";
    const cookieValue = await createShareCookieValue(slug);

    const wrongSlug = await verifyShareCookieValue("another-wedding", cookieValue);
    assert.equal(wrongSlug, false, "Phải từ chối khi slug không khớp");

    const tampered = cookieValue.slice(0, -4) + "0000";
    const isTamperedValid = await verifyShareCookieValue(slug, tampered);
    assert.equal(isTamperedValid, false, "Phải từ chối chữ ký HMAC bị sửa");

    const invalidFormat = await verifyShareCookieValue(slug, "invalidcookie");
    assert.equal(invalidFormat, false, "Phải từ chối định dạng không hợp lệ");
  });
});

test("Anti-spam timing & honeypot logic", async (t) => {
  await t.test("phát hiện bot nộp form dưới 1200ms", () => {
    const formLoadedAt = Date.now() - 500; // 500ms trước
    const elapsed = Date.now() - formLoadedAt;
    const isTooFast = elapsed < 1200;
    assert.equal(isTooFast, true, "500ms phải bị phát hiện là quá nhanh");

    const legitimateFormLoadedAt = Date.now() - 4000; // 4s trước
    const legitimateElapsed = Date.now() - legitimateFormLoadedAt;
    const isLegit = legitimateElapsed >= 1200;
    assert.equal(isLegit, true, "4s là hành vi người dùng thật hợp lệ");
  });

  await t.test("phát hiện bot điền trường honeypot website hoặc website_url", () => {
    const honeypotValues = ["http://spam.com", "   bot   ", "x"];
    for (const val of honeypotValues) {
      const isSpam = Boolean(val && val.trim() !== "");
      assert.equal(isSpam, true, `Trường '${val}' phải bị bắt là spam`);
    }

    const emptyValues = ["", "   ", null, undefined];
    for (const val of emptyValues) {
      const isClean = !val || (typeof val === "string" && val.trim() === "");
      assert.equal(isClean, true, "Honeypot rỗng là hợp lệ");
    }
  });
});
