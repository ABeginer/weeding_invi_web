import { compressImage, formatSavedSize, formatBytesVi } from "../lib/image/compress.ts";

async function runTests() {
  console.log("--- Testing Image Compression Logic ---");

  // Test 1: File > 10 MB rejected upfront
  const mockLargeFile = {
    name: "large.jpg",
    size: 11 * 1024 * 1024,
    type: "image/jpeg",
  };
  try {
    await compressImage(mockLargeFile, "gallery");
    console.error("FAIL: Large file was not rejected");
    process.exit(1);
  } catch (err) {
    if (err.message === "Ảnh vượt quá 10 MB. Vui lòng chọn ảnh nhỏ hơn.") {
      console.log("PASS: File > 10 MB rejected with exact message");
    } else {
      console.error("FAIL: Unexpected error message:", err.message);
      process.exit(1);
    }
  }

  // Test 2: Unsupported format rejected
  const mockTextFile = {
    name: "document.pdf",
    size: 500 * 1024,
    type: "application/pdf",
  };
  try {
    await compressImage(mockTextFile, "gallery");
    console.error("FAIL: PDF file was not rejected");
    process.exit(1);
  } catch (err) {
    if (err.message === "Định dạng ảnh chưa được hỗ trợ.") {
      console.log("PASS: Unsupported format rejected with exact message");
    } else {
      console.error("FAIL: Unexpected error message:", err.message);
      process.exit(1);
    }
  }

  // Test 3: formatSavedSize helper
  const savedMsg = formatSavedSize(4.2 * 1024 * 1024, 380 * 1024);
  console.log("Format saved size output:", savedMsg);
  if (savedMsg.includes("4,2 MB") && savedMsg.includes("380 KB")) {
    console.log("PASS: formatSavedSize matches expected Vietnamese format");
  } else {
    console.error("FAIL: formatSavedSize output unexpected:", savedMsg);
    process.exit(1);
  }

  console.log("--- ALL UNIT TESTS PASSED ---");
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});

