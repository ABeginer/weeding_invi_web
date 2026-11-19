import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canUseFeature,
  getPlanLimits,
  PLAN_CONFIGS,
  type PlanFeature,
} from "../lib/plans.ts";
import { PLAN_PRICES } from "../lib/server/payments.ts";

describe("3-Tier Entitlement (Free / Pro / VIP) & Pricing Logic", () => {
  it("trả về đúng thông số hạn mức cho Gói Miễn phí (free)", () => {
    const limits = getPlanLimits("free");
    assert.equal(limits.name, "Gói Miễn phí");
    assert.equal(limits.price, "0đ");
    assert.equal(limits.priceNumber, 0);
    assert.equal(limits.maxGuests, 20);
    assert.equal(limits.maxPhotos, 5);
    assert.equal(limits.storageMonths, 6);

    const features: PlanFeature[] = [
      "customMusicUpload",
      "vietQrImages",
      "exportCsv",
      "boardingPass",
      "livePhotoWall",
      "ledMode",
      "tableQrPoster",
      "photoWallZip",
      "familyPinShare",
    ];

    for (const f of features) {
      assert.equal(
        canUseFeature("free", f),
        false,
        `Tính năng ${f} phải bị khóa trên gói free`,
      );
    }
  });

  it("trả về đúng thông số và hạn mức cho Gói Pro (159.000đ)", () => {
    const limits = getPlanLimits("pro");
    assert.equal(limits.name, "Gói Pro");
    assert.equal(limits.price, "159.000đ");
    assert.equal(limits.priceNumber, 159000);
    assert.equal(limits.originalPrice, "199.000đ");
    assert.equal(limits.originalPriceNumber, 199000);
    assert.equal(limits.maxGuests, Infinity);
    assert.equal(limits.maxPhotos, 30);
    assert.equal(limits.storageMonths, 12);

    // Tính năng Pro được bật
    assert.equal(canUseFeature("pro", "customMusicUpload"), true);
    assert.equal(canUseFeature("pro", "vietQrImages"), true);
    assert.equal(canUseFeature("pro", "exportCsv"), true);

    // Toàn bộ tính năng sảnh tiệc VIP phải bị khóa trên gói Pro
    const vipOnlyFeatures: PlanFeature[] = [
      "boardingPass",
      "livePhotoWall",
      "ledMode",
      "tableQrPoster",
      "photoWallZip",
      "familyPinShare",
    ];

    for (const f of vipOnlyFeatures) {
      assert.equal(
        canUseFeature("pro", f),
        false,
        `Tính năng VIP ${f} phải bị khóa trên gói pro`,
      );
    }
  });

  it("trả về đúng đặc quyền tối đa cho Gói VIP (399.000đ)", () => {
    const limits = getPlanLimits("vip");
    assert.equal(limits.name, "Gói VIP");
    assert.equal(limits.price, "399.000đ");
    assert.equal(limits.priceNumber, 399000);
    assert.equal(limits.originalPrice, "499.000đ");
    assert.equal(limits.originalPriceNumber, 499000);
    assert.equal(limits.maxGuests, Infinity);
    assert.equal(limits.maxPhotos, 50);
    assert.equal(limits.storageMonths, 24);

    // Tất cả tính năng đều được mở trên VIP
    const allFeatures: PlanFeature[] = [
      "customMusicUpload",
      "vietQrImages",
      "exportCsv",
      "boardingPass",
      "livePhotoWall",
      "ledMode",
      "tableQrPoster",
      "photoWallZip",
      "familyPinShare",
    ];

    for (const f of allFeatures) {
      assert.equal(
        canUseFeature("vip", f),
        true,
        `Tính năng ${f} phải được mở trên gói VIP`,
      );
    }
  });

  it("xử lý fallback an toàn khi plan là null, undefined hoặc giá trị không xác định", () => {
    assert.deepEqual(getPlanLimits(null), PLAN_CONFIGS.free);
    assert.deepEqual(getPlanLimits(undefined), PLAN_CONFIGS.free);
    assert.deepEqual(getPlanLimits("unknown-tier"), PLAN_CONFIGS.free);

    assert.equal(canUseFeature(null, "customMusicUpload"), false);
    assert.equal(canUseFeature(undefined, "boardingPass"), false);
  });

  it("đồng bộ chính xác giá thanh toán giữa plans logic và server payments", () => {
    assert.equal(PLAN_PRICES.pro, 159000);
    assert.equal(PLAN_PRICES.vip, 399000);
  });
});
