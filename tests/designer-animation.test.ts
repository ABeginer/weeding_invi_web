import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createDefaultEntrance,
  createDefaultExit,
  createDefaultLoop,
  getDirectionOffset,
  getEntranceCssVars,
  getExitCssVars,
  getLoopCssVars,
  isEntrancePreset,
  isExitPreset,
  isLoopPreset,
  normalizeAnimSlot,
  supportsDirection,
} from "../components/designer/animation-catalog.ts";
import {
  createDefaultFallingEffect,
  FALLING_PRESET_META,
} from "../components/designer/falling-effect-presets.ts";
import {
  DESIGNER_FONT_GROUPS,
  DESIGNER_TEXT_EFFECT_OPTIONS,
  DESIGNER_TEXT_STYLES,
  getTextEffectStyles,
} from "../components/designer/designer-fonts.ts";

describe("designer entrance animation catalog", () => {
  it("chỉ nhận các preset Phase 1", () => {
    assert.equal(isEntrancePreset("fadeIn"), true);
    assert.equal(isEntrancePreset("wipe"), true);
    assert.equal(isEntrancePreset("typewriter"), true);
    assert.equal(isEntrancePreset("wordsIn"), true);
    assert.equal(isEntrancePreset("flipIn"), true);
    assert.equal(isEntrancePreset("khong-co"), false);
    assert.equal(isLoopPreset("float"), true);
    assert.equal(isLoopPreset("kenBurns"), true);
    assert.equal(isLoopPreset("fadeIn"), false);
    assert.equal(isExitPreset("fadeOut"), true);
    assert.equal(isExitPreset("slideOut"), true);
    assert.equal(isExitPreset("fadeIn"), false);
  });

  it("default entrance đúng thông số spec", () => {
    const animation = createDefaultEntrance("slideIn");
    assert.equal(animation.preset, "slideIn");
    assert.equal(animation.duration, 800);
    assert.equal(animation.delay, 0);
    assert.equal(animation.easing, "easeOut");
    assert.equal(animation.once, true);
    assert.equal(animation.threshold, 0.25);
    assert.equal(animation.distance, 40);
    assert.equal(animation.direction, "left");
    assert.equal(supportsDirection("wipe"), true);
  });

  it("clamp duration, delay và distance", () => {
    const normalized = normalizeAnimSlot({
      preset: "slideIn",
      duration: 99_999,
      delay: -5,
      easing: "linear",
      distance: 1,
    });
    assert.equal(normalized.duration, 5000);
    assert.equal(normalized.delay, 0);
    assert.equal(normalized.distance, 8);
  });

  it("tính hướng trượt và clip-path cho wipe", () => {
    assert.deepEqual(getDirectionOffset("left", 40), { x: -40, y: 0 });
    assert.deepEqual(getDirectionOffset("right", 40), { x: 40, y: 0 });
    assert.deepEqual(getDirectionOffset("up", 40), { x: 0, y: -40 });
    assert.deepEqual(getDirectionOffset("down", 40), { x: 0, y: 40 });

    const vars = getEntranceCssVars({
      ...createDefaultEntrance("wipe"),
      direction: "up",
    });
    assert.equal(vars["--anim-name"], "anim-wipe");
    assert.equal(vars["--anim-from-clip"], "inset(0 0 100% 0)");
  });
  it("loop defaults đúng nhịp của từng preset", () => {
    assert.equal(createDefaultLoop("float").duration, 3000);
    assert.equal(createDefaultLoop("heartbeat").duration, 1400);
    assert.equal(createDefaultLoop("spin").duration, 20_000);
    assert.equal(createDefaultLoop("spin").easing, "linear");
    assert.equal(createDefaultLoop("kenBurns").duration, 14_000);
    assert.equal(
      getLoopCssVars(createDefaultLoop("spin"))["--loop-duration"],
      "20000ms",
    );
  });
  it("exit mặc định 600ms, easeIn và có hướng cho slideOut", () => {
    const fade = createDefaultExit("fadeOut");
    assert.equal(fade.duration, 600);
    assert.equal(fade.easing, "easeIn");
    assert.equal(fade.direction, undefined);
    const slide = createDefaultExit("slideOut");
    assert.equal(slide.direction, "left");
    assert.equal(
      getExitCssVars(slide)["--out-x"],
      "-40px",
    );
  });
});

describe("falling effect presets", () => {
  it("có đủ 9 preset và default 40 hạt trong khung", () => {
    assert.equal(FALLING_PRESET_META.length, 9);
    const effect = createDefaultFallingEffect("sakura");
    assert.equal(effect.preset, "sakura");
    assert.equal(effect.scope, "box");
    assert.equal(effect.count, 40);
    assert.ok(effect.sizeMin <= effect.sizeMax);
    assert.ok(effect.speedMin <= effect.speedMax);
    assert.equal(effect.sources?.[0]?.type, "preset");
  });
});

describe("designer fonts", () => {
  it("chỉ dùng font đã self-host và có nhóm rõ ràng", () => {
    const values = DESIGNER_FONT_GROUPS.flatMap((group) =>
      group.fonts.map((font) => font.value),
    );
    assert.ok(values.length >= 8);
    assert.ok(
      values.every(
        (value) =>
          !value.includes("nautigal") &&
          !value.includes("pinyon") &&
          !value.includes("carattere"),
      ),
      "không dùng font script thiếu glyph tiếng Việt",
    );
    for (const value of values) {
      assert.match(value, /^var\(--font-[a-z-]+\)$/);
    }
    assert.ok(DESIGNER_FONT_GROUPS.every((group) => group.fonts.length > 0));
  });

  it("các kiểu chữ đều có family, size và line-height hợp lệ", () => {
    assert.ok(DESIGNER_TEXT_STYLES.length >= 6);
    for (const style of DESIGNER_TEXT_STYLES) {
      assert.ok(style.apply.fontFamily?.startsWith("var(--font-"));
      assert.ok((style.apply.fontSize ?? 0) >= 12);
      assert.ok((style.apply.lineHeight ?? 0) >= 1);
    }
  });

  it("hỗ trợ các text effects chuẩn (shadow, stroke, glow, goldGradient)", () => {
    assert.ok(DESIGNER_TEXT_EFFECT_OPTIONS.length >= 5);
    const shadowStyle = getTextEffectStyles("shadow");
    assert.ok(shadowStyle.textShadow);

    const strokeStyle = getTextEffectStyles("stroke");
    assert.ok(strokeStyle.WebkitTextStroke);

    const glowStyle = getTextEffectStyles("glow");
    assert.ok(glowStyle.textShadow);

    const goldStyle = getTextEffectStyles("goldGradient");
    assert.ok(goldStyle.backgroundImage);
    assert.equal(goldStyle.WebkitBackgroundClip, "text");

    const noneStyle = getTextEffectStyles("none");
    assert.deepEqual(noneStyle, {});
  });
});
