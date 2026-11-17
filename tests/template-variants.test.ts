import assert from "node:assert/strict";
import test from "node:test";
import { buildTemplateVariants, VARIANT_SUFFIXES } from "../templates/variants.ts";
import type { WeddingTemplateMeta } from "../templates/types.ts";

function base(id: string): WeddingTemplateMeta {
  return {
    id: id as WeddingTemplateMeta["id"],
    name: id,
    subtitle: "",
    description: "",
    plan: "free",
    coverImage: `/templates/${id}/cover.webp`,
    defaultMusic: { src: "/media/wedding.mp3", title: id },
    hasAdvancedEffects: false,
    accentSwatch: "#000000",
    tone: "neutral",
  };
}

test("25 base templates expand to exactly 100 catalog variants", () => {
  const bases = Array.from({ length: 25 }, (_, index) => base(`base-${index}`));
  const variants = buildTemplateVariants(bases);
  assert.equal(bases.length + variants.length, 100);
  assert.equal(variants.length, 25 * VARIANT_SUFFIXES.length);
  assert.equal(new Set(variants.map((item) => item.id)).size, variants.length);
  assert.ok(variants.every((item) => item.coverImage.startsWith("/templates/base-")));
});

test("each variant keeps the base plan and placeholder flag", () => {
  const vip = { ...base("vip-1"), plan: "vip" as const, isPlaceholder: true };
  const variants = buildTemplateVariants([vip]);
  assert.ok(variants.every((item) => item.plan === "vip" && item.isPlaceholder === true));
});
