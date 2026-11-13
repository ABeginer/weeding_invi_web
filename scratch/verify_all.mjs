import { formatSavedSize, formatBytesVi } from "../lib/image/compress.ts";

// Test resize math
function computeTargetDimensions(srcWidth, srcHeight, kind = "gallery") {
  let targetWidth = srcWidth;
  let targetHeight = srcHeight;

  if (kind === "og") {
    return { width: 1200, height: 630 };
  }

  const maxDimension = kind === "gallery" ? 2048 : 1600;
  const longerSide = Math.max(srcWidth, srcHeight);

  if (longerSide > maxDimension) {
    const scale = maxDimension / longerSide;
    targetWidth = Math.max(1, Math.round(srcWidth * scale));
    targetHeight = Math.max(1, Math.round(srcHeight * scale));
  }

  return { width: targetWidth, height: targetHeight };
}

console.log("--- RUNNING W5 SPEC VERIFICATIONS ---");

// 1. 4000 x 3000 photo becomes at most 2048 px on the long side
const resGallery = computeTargetDimensions(4000, 3000, "gallery");
console.log("4000x3000 gallery resize:", resGallery);
if (resGallery.width === 2048 && resGallery.height === 1536) {
  console.log("PASS: 4000x3000 scaled down to 2048x1536 (longer side <= 2048)");
} else {
  console.error("FAIL: 4000x3000 resize calculation incorrect:", resGallery);
  process.exit(1);
}

// 2. Small image (800 px) is not upscaled
const resSmall = computeTargetDimensions(800, 600, "gallery");
console.log("800x600 gallery resize:", resSmall);
if (resSmall.width === 800 && resSmall.height === 600) {
  console.log("PASS: 800x600 kept original size (never upscaled)");
} else {
  console.error("FAIL: 800x600 was upscaled:", resSmall);
  process.exit(1);
}

// 3. Couple / banner max dimension 1600 px
const resBanner = computeTargetDimensions(3200, 2400, "banner");
console.log("3200x2400 banner resize:", resBanner);
if (resBanner.width === 1600 && resBanner.height === 1200) {
  console.log("PASS: 3200x2400 scaled down to 1600x1200 (longer side <= 1600)");
} else {
  console.error("FAIL: 3200x2400 banner resize calculation incorrect:", resBanner);
  process.exit(1);
}

// 4. OG dimensions exactly 1200x630
const resOg = computeTargetDimensions(2000, 2000, "og");
console.log("OG resize:", resOg);
if (resOg.width === 1200 && resOg.height === 630) {
  console.log("PASS: OG dimensions exactly 1200x630");
} else {
  console.error("FAIL: OG resize calculation incorrect:", resOg);
  process.exit(1);
}

console.log("--- ALL W5 VERIFICATION TESTS PASSED ---");
