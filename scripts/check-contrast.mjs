import fs from "node:fs";
import path from "node:path";

/**
 * Script tự động kiểm tra độ tương phản WCAG 2.1 cho cả hai bảng màu
 * Light & Dark trong lib/brand-theme.ts.
 * Mọi cặp chữ-nền đều phải đạt tối thiểu 4.5:1.
 */

const MIN_CONTRAST = 4.5;

function parsePaletteFromSource(source, constName) {
  const re = new RegExp(`export const ${constName}[^=]*=\\s*\\{([\\s\\S]*?)\\};`);
  const match = source.match(re);
  if (!match) {
    throw new Error(`Không tìm thấy ${constName} trong lib/brand-theme.ts`);
  }
  const map = {};
  const entryRe = /(\w+)\s*:\s*"(#[0-9A-Fa-f]{6})"/g;
  let m;
  while ((m = entryRe.exec(match[1])) !== null) {
    map[m[1]] = m[2];
  }
  return map;
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(fgHex, bgHex) {
  const l1 = relativeLuminance(fgHex);
  const l2 = relativeLuminance(bgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function buildPairs(t) {
  return [
    ["text trên bg", t.text, t.bg],
    ["text trên surface", t.text, t.surface],
    ["text trên surfaceAlt", t.text, t.surfaceAlt],
    ["textMuted trên bg", t.textMuted, t.bg],
    ["textMuted trên surface", t.textMuted, t.surface],
    ["textMuted trên surfaceAlt", t.textMuted, t.surfaceAlt],
    ["accentText trên bg", t.accentText, t.bg],
    ["accentText trên surface", t.accentText, t.surface],
    ["accentFg trên accent (nút chính / Pro)", t.accentFg, t.accent],
    ["accentFg trên accentHover", t.accentFg, t.accentHover],
    ["text trên accentSoft", t.text, t.accentSoft],
    ["vipBadgeFg trên vipBadgeBg", t.vipBadgeFg, t.vipBadgeBg],
    ["text trên surface (huy hiệu Miễn phí viền sage)", t.text, t.surface],
    ["soonBadgeFg trên soonBadgeBg", t.soonBadgeFg, t.soonBadgeBg],
    ["successFg trên successBg", t.successFg, t.successBg],
    ["successFg trên surface", t.successFg, t.surface],
    ["dangerFg trên dangerBg", t.dangerFg, t.dangerBg],
    ["dangerFg trên surface", t.dangerFg, t.surface],
    ["dangerBtnFg trên dangerBtnBg", t.dangerBtnFg, t.dangerBtnBg],
    ["neutralFg trên neutralBg", t.neutralFg, t.neutralBg],
  ];
}

const sourcePath = path.join(process.cwd(), "lib", "brand-theme.ts");
const source = fs.readFileSync(sourcePath, "utf8");

const light = parsePaletteFromSource(source, "brandLightTheme");
const dark = parsePaletteFromSource(source, "brandDarkTheme");

let failed = 0;

for (const [modeName, palette] of [
  ["LIGHT", light],
  ["DARK", dark],
]) {
  console.log(`\n=== ${modeName} THEME ===`);
  for (const [label, fg, bg] of buildPairs(palette)) {
    const ratio = contrastRatio(fg, bg);
    const pass = ratio >= MIN_CONTRAST;
    if (!pass) failed += 1;
    console.log(
      `${pass ? "PASS" : "FAIL"} | ${ratio.toFixed(2)}:1 | ${label} (${fg} / ${bg})`,
    );
  }
}

if (failed > 0) {
  console.error(`\nCó ${failed} cặp màu chưa đạt ngưỡng ${MIN_CONTRAST}:1`);
  process.exit(1);
}

console.log(`\nTất cả các cặp màu đều đạt tối thiểu ${MIN_CONTRAST}:1 trên cả Light & Dark.`);
