import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateElementCenter,
  degreesToRadians,
  calculateRotatedBoundingBox,
} from "../lib/designer-export-math.ts";

describe("designer export rotation geometry", () => {
  it("tính toán tâm xoay chính xác cho phần tử", () => {
    const center = calculateElementCenter(100, 200, 300, 150);
    assert.equal(center.cx, 250);
    assert.equal(center.cy, 275);

    const originCenter = calculateElementCenter(0, 0, 100, 100);
    assert.equal(originCenter.cx, 50);
    assert.equal(originCenter.cy, 50);
  });

  it("chuyển đổi độ sang radian chính xác", () => {
    assert.equal(degreesToRadians(0), 0);
    assert.ok(Math.abs(degreesToRadians(90) - Math.PI / 2) < 1e-10);
    assert.ok(Math.abs(degreesToRadians(180) - Math.PI) < 1e-10);
    assert.ok(Math.abs(degreesToRadians(-90) - -Math.PI / 2) < 1e-10);
  });

  it("tính toán bounding box sau khi xoay đúng hình học", () => {
    // 0 độ: giữ nguyên kích thước
    const unrotated = calculateRotatedBoundingBox(200, 100, 0);
    assert.equal(unrotated.width, 200);
    assert.equal(unrotated.height, 100);

    // 90 độ: hoán đổi chiều rộng và chiều cao
    const rotated90 = calculateRotatedBoundingBox(200, 100, 90);
    assert.equal(rotated90.width, 100);
    assert.equal(rotated90.height, 200);

    // 180 độ: giữ nguyên kích thước
    const rotated180 = calculateRotatedBoundingBox(200, 100, 180);
    assert.equal(rotated180.width, 200);
    assert.equal(rotated180.height, 100);

    // 45 độ của hình vuông 100x100: đường chéo = 100 * sqrt(2) ≈ 141
    const rotated45Square = calculateRotatedBoundingBox(100, 100, 45);
    assert.equal(rotated45Square.width, 141);
    assert.equal(rotated45Square.height, 141);
  });
});
