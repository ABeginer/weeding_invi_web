import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { getTemplateFeatures } from "../config/template-features.ts";

interface RegistrySummaryItem {
  id: string;
  plan: "free" | "pro" | "vip";
  extraFeatureIds: string[];
}

function readRegistryProTemplates(): RegistrySummaryItem[] {
  const src = fs.readFileSync(path.resolve("templates/registry.ts"), "utf8");
  const startIdx = src.indexOf("export const TEMPLATE_REGISTRY");
  const endIdx = src.indexOf("export const HERO_PREVIEW_TEMPLATES");
  const section = src.slice(startIdx, endIdx);

  const items: RegistrySummaryItem[] = [];
  const blockRe = /\{\s*\n\s*id:\s*"([^"]+)"([\s\S]*?)(?=\n\s*\},\s*(?:\n\s*\{|\n\];))/g;
  let match: RegExpExecArray | null;
  while ((match = blockRe.exec(section))) {
    const id = match[1];
    const block = match[2];
    const planMatch = block.match(/plan:\s*"([^"]+)"/);
    const plan = (planMatch?.[1] ?? "free") as "free" | "pro" | "vip";
    if (plan !== "pro") continue;

    const extraMatch = block.match(/extraFeatureIds:\s*\[([\s\S]*?)\]/);
    const extraFeatureIds = extraMatch
      ? Array.from(extraMatch[1].matchAll(/"([^"]+)"/g)).map((m) => m[1])
      : [];
    items.push({ id, plan, extraFeatureIds });
  }
  return items;
}

describe("config/template-features.ts — chuẩn hóa mô tả riêng mẫu Standard", () => {
  const proTemplates = readRegistryProTemplates();

  it("toàn bộ 10/10 mẫu Standard (pro) đều có extraFeatureIds đầy đủ và resolve được nhãn", () => {
    assert.equal(proTemplates.length, 10);
    for (const tpl of proTemplates) {
      assert.ok(tpl.extraFeatureIds.length > 0, `${tpl.id} thiếu extraFeatureIds`);
      const features = getTemplateFeatures(tpl.plan, tpl.extraFeatureIds);
      assert.equal(
        features.extras.length,
        tpl.extraFeatureIds.length,
        `${tpl.id} có feature ID không tồn tại trong EXTRA_FEATURES`,
      );
    }
  });

  it("các mẫu Standard ngoài bộ Hồng Kông không bị dính mô tả Hồng Kông (K♥ & Q♥, mở vali, cửa VIP, nhũ vàng 24K)", () => {
    const nonHkProIds = ["hac-vu-luu-ly", "sen-ngoc-tram-nam", "mot-thoi-de-nho", "ho-phach-mat-thu", "nhat-ky-mua-yeu"];
    const hkOnlyPattern = /K♥|Q♥|vali|cửa\s*(đôi\s*)?VIP|kéo rèm|nhũ vàng 24K|Hương Cảng/i;

    for (const id of nonHkProIds) {
      const tpl = proTemplates.find((t) => t.id === id);
      assert.ok(tpl, `Không tìm thấy ${id}`);
      const labels = getTemplateFeatures(tpl.plan, tpl.extraFeatureIds).extras.map(
        (e) => e.label,
      );
      for (const label of labels) {
        assert.equal(
          hkOnlyPattern.test(label),
          false,
          `${id} bị dính mô tả Hồng Kông: "${label}"`,
        );
      }
    }

    const senNgoc = proTemplates.find((t) => t.id === "sen-ngoc-tram-nam");
    const senNgocLabels = getTemplateFeatures("pro", senNgoc?.extraFeatureIds).extras.map(
      (e) => e.label,
    );
    assert.equal(
      senNgocLabels.some((l) => /35mm/i.test(l)),
      false,
      "sen-ngoc-tram-nam không dùng cuộn phim 35mm",
    );
  });
});
