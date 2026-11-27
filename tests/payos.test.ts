import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateUpgradeAmount, findOrderCode, newOrderCode } from "../lib/server/payments.ts";
import {
  createHmacSha256,
  createPaymentLinkSignature,
  sortAndStringifyData,
  verifyPayosWebhookSignature,
} from "../lib/server/payos.ts";

describe("payOS Server-Side Pricing & Plan Calculations", () => {
  it("tính đúng giá nâng cấp từ Free lên Pro (159.000đ)", () => {
    assert.equal(calculateUpgradeAmount("free", "pro"), 159000);
  });

  it("tính đúng giá nâng cấp từ Free lên VIP (399.000đ)", () => {
    assert.equal(calculateUpgradeAmount("free", "vip"), 399000);
  });

  it("tính đúng giá chênh lệch khi nâng cấp từ Pro lên VIP (240.000đ)", () => {
    assert.equal(calculateUpgradeAmount("pro", "vip"), 240000);
  });

  it("từ chối (trả về null) khi trùng gói hiện tại", () => {
    assert.equal(calculateUpgradeAmount("pro", "pro"), null);
    assert.equal(calculateUpgradeAmount("vip", "vip" as "pro" | "vip"), null);
  });

  it("từ chối (trả về null) khi hạ cấp từ VIP xuống Pro", () => {
    assert.equal(calculateUpgradeAmount("vip", "pro"), null);
  });
});

describe("payOS Web Crypto HMAC-SHA256 & Signature Generation", () => {
  const TEST_CHECKSUM_KEY = "test-payos-checksum-key-secret-123456";

  it("tạo chữ ký HMAC-SHA256 chuẩn 64 ký tự hex chữ thường", async () => {
    const sig = await createHmacSha256(TEST_CHECKSUM_KEY, "test-data");
    assert.equal(typeof sig, "string");
    assert.equal(sig.length, 64);
    assert.match(sig, /^[0-9a-f]{64}$/);
    assert.equal(sig, sig.toLowerCase());
  });

  it("chữ ký là đơn định (deterministic) với cùng key và message", async () => {
    const sig1 = await createHmacSha256(TEST_CHECKSUM_KEY, "amount=159000&orderCode=123");
    const sig2 = await createHmacSha256(TEST_CHECKSUM_KEY, "amount=159000&orderCode=123");
    assert.equal(sig1, sig2);
  });

  it("sinh đúng chuỗi ký tạo payment link theo thứ tự alphabet", async () => {
    const params = {
      orderCode: 123456789,
      amount: 159000,
      description: "INV 123456789",
      cancelUrl: "https://inviwedd.com/cancel",
      returnUrl: "https://inviwedd.com/return",
    };

    const sig = await createPaymentLinkSignature(params, TEST_CHECKSUM_KEY);
    assert.equal(typeof sig, "string");
    assert.equal(sig.length, 64);

    // Tính thủ công chuỗi ký để đối chiếu
    const expectedRaw = `amount=159000&cancelUrl=https://inviwedd.com/cancel&description=INV 123456789&orderCode=123456789&returnUrl=https://inviwedd.com/return`;
    const expectedSig = await createHmacSha256(TEST_CHECKSUM_KEY, expectedRaw);
    assert.equal(sig, expectedSig);
  });
});

describe("payOS Webhook Payload Sorting & Verification", () => {
  const TEST_CHECKSUM = "sample-webhook-checksum-key-8888";

  it("sắp xếp các trường của payload theo thứ tự từ điển A-Z", () => {
    const data = {
      orderCode: 987654,
      amount: 399000,
      description: "INV 987654",
      accountNumber: "0011223344",
      reference: "FT2611001",
    };

    const sorted = sortAndStringifyData(data);
    const expected =
      "accountNumber=0011223344&amount=399000&description=INV 987654&orderCode=987654&reference=FT2611001";
    assert.equal(sorted, expected);
  });

  it("chuyển đổi null hoặc undefined thành rỗng trong chuỗi ký", () => {
    const data = {
      orderCode: 123,
      counterAccountName: null,
      notes: undefined,
      status: "PAID",
    };

    const sorted = sortAndStringifyData(data);
    assert.ok(sorted.includes("counterAccountName=&"));
    assert.ok(sorted.includes("notes=&"));
    assert.ok(sorted.includes("orderCode=123"));
  });

  it("xác minh chữ ký webhook hợp lệ", async () => {
    const data = {
      orderCode: 1732001122334,
      amount: 240000,
      description: "INV 1732001122334",
      accountNumber: "9988776655",
      reference: "MBV123456",
      transactionDateTime: "2026-11-19 22:50:00",
    };

    const rawString = sortAndStringifyData(data);
    const validSignature = await createHmacSha256(TEST_CHECKSUM, rawString);

    const isValid = await verifyPayosWebhookSignature(data, validSignature, TEST_CHECKSUM);
    assert.equal(isValid, true);
  });

  it("từ chối chữ ký khi payload bị sửa đổi (tamper detection)", async () => {
    const data = {
      orderCode: 1732001122334,
      amount: 240000,
      description: "INV 1732001122334",
    };

    const rawString = sortAndStringifyData(data);
    const validSignature = await createHmacSha256(TEST_CHECKSUM, rawString);

    // Kẻ xấu sửa số tiền từ 240.000đ thành 1.000đ
    const tamperedData = {
      ...data,
      amount: 1000,
    };

    const isValid = await verifyPayosWebhookSignature(
      tamperedData,
      validSignature,
      TEST_CHECKSUM,
    );
    assert.equal(isValid, false);
  });

  it("từ chối khi chữ ký bị sai hoặc sai checksum key", async () => {
    const data = { orderCode: 123, amount: 159000 };
    const isValidWrongKey = await verifyPayosWebhookSignature(
      data,
      "a".repeat(64),
      "wrong-checksum-key",
    );
    assert.equal(isValidWrongKey, false);

    const isValidEmpty = await verifyPayosWebhookSignature(data, "", TEST_CHECKSUM);
    assert.equal(isValidEmpty, false);
  });
});

describe("payOS Order Code & Description Constraints", () => {
  it("sinh mã đơn code thỏa mãn 100% constraint orders_code_check (^INV-[A-Z0-9]{6}$)", () => {
    const regex = /^INV-[A-Z0-9]{6}$/;
    for (let i = 0; i < 100; i++) {
      const code = newOrderCode();
      assert.ok(
        regex.test(code),
        `Mã đơn ${code} không khớp định dạng ^INV-[A-Z0-9]{6}$`,
      );
    }
  });

  it("mã code đưa vào description thanh toán payOS luôn <= 25 ký tự", () => {
    for (let i = 0; i < 50; i++) {
      const code = newOrderCode();
      const description = code;
      assert.ok(description.length <= 25, `Description ${description} vượt quá 25 ký tự`);
      assert.equal(description.length, 10);
    }
  });

  it("trích xuất chính xác mã đơn từ description webhook của payOS", () => {
    const testCases = [
      { desc: "INV-ABC123", expected: "INV-ABC123" },
      { desc: "INV ABC123", expected: "INV-ABC123" },
      { desc: "inv-abc123", expected: "INV-ABC123" },
      { desc: "Chuyen khoan INV-7K2QPM", expected: "INV-7K2QPM" },
      { desc: "INV7K2QPM", expected: "INV-7K2QPM" },
      { desc: "INV-Z9X8Y7 thanh toan", expected: "INV-Z9X8Y7" },
    ];

    for (const tc of testCases) {
      const matched = findOrderCode(tc.desc);
      assert.equal(matched, tc.expected, `Trích xuất thất bại từ: ${tc.desc}`);
    }
  });
});
