import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateWeddingBudgetFromNumbers,
  evaluateWeddingCalculator,
  type WeddingCalcRawInputs,
} from "../lib/wedding-calc.ts";

function buildRawInputs(
  overrides: Partial<WeddingCalcRawInputs> = {},
): WeddingCalcRawInputs {
  return {
    invitedGuests: "",
    attendanceRate: "90",
    avgPlusOnes: "0",
    guestsPerTable: "10",
    reserveRate: "5",
    pricePerTable: "",
    otherExpenses: [],
    avgGiftPerGuest: "",
    ...overrides,
  };
}

describe("lib/wedding-calc.ts — Bảng tính chi phí đám cưới", () => {
  it("Trường hợp 1: G=100, r=0.9, c=0, p=10, b=0.05, m=5000000, O=0, g=0", () => {
    const res = calculateWeddingBudgetFromNumbers({
      G: 100,
      r: 0.9,
      c: 0,
      p: 10,
      b: 0.05,
      m: 5000000,
      O: 0,
      g: 0,
    });

    assert.equal(res.attendingGuests, 90);
    assert.equal(res.attendingPeople, 90);
    assert.equal(res.tables, 9);
    assert.equal(res.tablesWithReserve, 10);
    assert.equal(res.reserveTables, 1);
    assert.equal(res.foodCost, 50000000);
    assert.equal(res.totalCost, 50000000);
    assert.equal(res.expectedGifts, 0);
    assert.equal(res.net, -50000000);
    assert.equal(res.breakevenGifts, null);
  });

  it("Trường hợp 2: G=100, r=0.9, c=0.5, p=10, b=0, m=5000000, O=20000000, g=1000000", () => {
    const res = calculateWeddingBudgetFromNumbers({
      G: 100,
      r: 0.9,
      c: 0.5,
      p: 10,
      b: 0,
      m: 5000000,
      O: 20000000,
      g: 1000000,
    });

    assert.equal(res.attendingGuests, 90);
    assert.equal(res.attendingPeople, 135);
    assert.equal(res.tables, 14);
    assert.equal(res.tablesWithReserve, 14);
    assert.equal(res.reserveTables, 0);
    assert.equal(res.foodCost, 70000000);
    assert.equal(res.totalCost, 90000000);
    assert.equal(res.expectedGifts, 90000000);
    assert.equal(res.net, 0);
    assert.equal(res.breakevenGifts, 90);
  });

  it("Trường hợp thiếu số khách hoặc giá mâm: không tính toán kết quả", () => {
    const missingGuests = evaluateWeddingCalculator(
      buildRawInputs({ invitedGuests: "", pricePerTable: "5000000" }),
    );
    assert.equal(missingGuests.canCalculate, false);
    assert.equal(missingGuests.missingMainInputs, true);

    const missingPrice = evaluateWeddingCalculator(
      buildRawInputs({ invitedGuests: "150", pricePerTable: "" }),
    );
    assert.equal(missingPrice.canCalculate, false);
    assert.equal(missingPrice.missingMainInputs, true);
  });

  it("Trường hợp g=0: không hiển thị breakevenGifts", () => {
    const evalZeroGift = evaluateWeddingCalculator(
      buildRawInputs({
        invitedGuests: "100",
        pricePerTable: "5000000",
        avgGiftPerGuest: "0",
      }),
    );
    assert.equal(evalZeroGift.canCalculate, true);
    assert.equal(evalZeroGift.breakevenGifts, null);

    const evalEmptyGift = evaluateWeddingCalculator(
      buildRawInputs({
        invitedGuests: "100",
        pricePerTable: "5000000",
        avgGiftPerGuest: "",
      }),
    );
    assert.equal(evalEmptyGift.canCalculate, true);
    assert.equal(evalEmptyGift.breakevenGifts, null);
  });

  it("Kiểm tra validation: số âm, ngoài khoảng và sai số dấu phẩy động", () => {
    const invalidRes = evaluateWeddingCalculator(
      buildRawInputs({
        invitedGuests: "2500",
        attendanceRate: "120",
        avgPlusOnes: "-1",
        guestsPerTable: "0",
        reserveRate: "25",
        pricePerTable: "-500000",
        otherExpenses: [{ id: "decor", name: "Trang trí", amount: "-100" }],
      }),
    );
    assert.equal(invalidRes.canCalculate, false);
    assert.equal(invalidRes.hasValidationErrors, true);
    assert.ok(invalidRes.errors.invitedGuests);
    assert.ok(invalidRes.errors.attendanceRate);
    assert.ok(invalidRes.errors.avgPlusOnes);
    assert.ok(invalidRes.errors.guestsPerTable);
    assert.ok(invalidRes.errors.reserveRate);
    assert.ok(invalidRes.errors.pricePerTable);
    assert.ok(invalidRes.errors.otherExpenseIds.decor);

    // Đảm bảo không lỗi làm tròn IEEE-754 (100 * 0.14 = 14)
    const precisionCheck = calculateWeddingBudgetFromNumbers({
      G: 100,
      r: 0.14,
      c: 0,
      p: 10,
      b: 0,
      m: 1000000,
      O: 0,
      g: 0,
    });
    assert.equal(precisionCheck.attendingGuests, 14);
  });
});
