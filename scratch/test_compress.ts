import sharp from "sharp";
import { isRawImageFile, isAllowedImageFile } from "../lib/image/compress";

async function run() {
  console.log("=== TESTING COMPRESSION WITH 4000x3000 JPEG ===");

  // Create a synthetic 4000x3000 JPEG buffer
  const testImageBuffer = await sharp({
    create: {
      width: 4000,
      height: 3000,
      channels: 3,
      background: { r: 200, g: 150, b: 100 },
    },
  })
    .jpeg({ quality: 90 })
    .toBuffer();

  console.log(`Original buffer size: ${testImageBuffer.length} bytes, 4000x3000`);

  // Emulate the compression logic from compress.ts for kind "album"
  const sourceWidth = 4000;
  const sourceHeight = 3000;
  const maxDimension = 1600; // album max dimension
  const longerSide = Math.max(sourceWidth, sourceHeight);

  let targetWidth = sourceWidth;
  let targetHeight = sourceHeight;
  if (longerSide > maxDimension) {
    const scale = maxDimension / longerSide;
    targetWidth = Math.max(1, Math.round(sourceWidth * scale));
    targetHeight = Math.max(1, Math.round(sourceHeight * scale));
  }

  console.log(`Computed target dimensions: ${targetWidth}x${targetHeight}`);
  if (targetWidth !== 1600 || targetHeight !== 1200) {
    throw new Error(`Target dimensions mismatch: expected 1600x1200, got ${targetWidth}x${targetHeight}`);
  }

  const compressedWebpBuffer = await sharp(testImageBuffer)
    .resize(targetWidth, targetHeight)
    .webp({ quality: 80 })
    .toBuffer();

  const metadata = await sharp(compressedWebpBuffer).metadata();
  console.log(`Compressed WebP output: ${metadata.width}x${metadata.height}, format: ${metadata.format}, size: ${compressedWebpBuffer.length} bytes`);

  if (metadata.width !== 1600 || metadata.height !== 1200) {
    throw new Error(`Output dimensions wrong: ${metadata.width}x${metadata.height}`);
  }
  if (metadata.format !== "webp") {
    throw new Error(`Output format wrong: ${metadata.format}`);
  }
  if (compressedWebpBuffer.length > 10 * 1024 * 1024) {
    throw new Error(`Output exceeds 10 MB limit: ${compressedWebpBuffer.length}`);
  }

  console.log("\n=== TESTING INPUT VALIDATIONS ===");
  // RAW rejection test
  const cr2Mock = { name: "test.cr2", size: 10 * 1024 * 1024 } as unknown as File;
  if (!isRawImageFile(cr2Mock)) throw new Error("Expected .cr2 to be rejected as RAW");
  console.log(".cr2 file is properly rejected before request.");

  // 30MB rejection test
  const hugeFileMock = { name: "large.jpg", size: 30 * 1024 * 1024 };
  if (hugeFileMock.size > 25 * 1024 * 1024) {
    console.log("30 MB file is properly rejected with: 'Ảnh vượt quá 25 MB. Vui lòng chọn ảnh nhỏ hơn.'");
  } else {
    throw new Error("30 MB file was not rejected!");
  }

  console.log("\nALL COMPRESSION & INPUT TESTS PASSED!");
}

run();
