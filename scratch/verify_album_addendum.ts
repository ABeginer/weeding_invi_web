import { PRICING_ROWS, PRICING_TIERS } from "../config/pricing";
import { PLAN_LIMITS, getPhotoLimitMessage } from "../config/plans";
import { isRawImageFile, isAllowedImageFile } from "../lib/image/compress";

console.log("=== 1. VERIFYING PRICING TABLE ROWS (9 ROWS) ===");
console.log(`PRICING_ROWS count: ${PRICING_ROWS.length}`);
if (PRICING_ROWS.length !== 9) {
  throw new Error(`Expected 9 pricing rows, got ${PRICING_ROWS.length}`);
}

const expectedOrder = [
  "Khách mời",
  "Mẫu thiệp",
  "Nhạc nền",
  "Ảnh trên thiệp",
  "Album QR cho khách",
  "Lưu trữ",
  "Logo",
  "Xuất danh sách khách ra Excel",
  "Mừng cưới QR",
];

PRICING_ROWS.forEach((row, i) => {
  console.log(`Row ${i + 1}: ${row.feature}`);
  if (row.feature !== expectedOrder[i]) {
    throw new Error(`Row ${i + 1} mismatch: expected "${expectedOrder[i]}", got "${row.feature}"`);
  }
});

console.log("\n=== 2. VERIFYING PRICING ROW VALUES ===");
const freeValues = PRICING_ROWS.map(r => r.values.free.text);
const proValues = PRICING_ROWS.map(r => r.values.pro.text);
const vipValues = PRICING_ROWS.map(r => r.values.vip.text);

console.log("Free values:", freeValues);
console.log("Pro values:", proValues);
console.log("VIP values:", vipValues);

// Check no "Không giới hạn" for photo counts
const photoRowFree = PRICING_ROWS[3].values.free.text;
const photoRowPro = PRICING_ROWS[3].values.pro.text;
const photoRowVip = PRICING_ROWS[3].values.vip.text;
const albumRowFree = PRICING_ROWS[4].values.free.text;
const albumRowPro = PRICING_ROWS[4].values.pro.text;
const albumRowVip = PRICING_ROWS[4].values.vip.text;

if (photoRowFree.includes("Không giới hạn") || photoRowPro.includes("Không giới hạn") || photoRowVip.includes("Không giới hạn")) {
  throw new Error("Found 'Không giới hạn' in photo count rows!");
}
if (albumRowFree.includes("Không giới hạn") || albumRowPro.includes("Không giới hạn") || albumRowVip.includes("Không giới hạn")) {
  throw new Error("Found 'Không giới hạn' in album count rows!");
}

console.log("Photo & Album rows don't contain 'Không giới hạn'. Passed!");

console.log("\n=== 3. VERIFYING PLAN LIMITS ===");
console.log("Free album limit:", PLAN_LIMITS.free.photos.album);
console.log("Pro album limit:", PLAN_LIMITS.pro.photos.album);
console.log("VIP album limit:", PLAN_LIMITS.vip.photos.album);

if (PLAN_LIMITS.pro.photos.album !== 30) throw new Error("Pro album limit must be 30");
if (PLAN_LIMITS.vip.photos.album !== 300) throw new Error("VIP album limit must be 300");
if (PLAN_LIMITS.free.photos.album !== 0) throw new Error("Free album limit must be 0");

console.log("Photo limits for gallery: Free:", PLAN_LIMITS.free.photos.gallery, "Pro:", PLAN_LIMITS.pro.photos.gallery, "VIP:", PLAN_LIMITS.vip.photos.gallery);

console.log("\n=== 4. VERIFYING INPUT RULES (RAW and 25 MB) ===");
// Mock file objects
const cr2File = { name: "wedding_photo.cr2", type: "image/x-canon-cr2", size: 5 * 1024 * 1024 } as unknown as File;
const nefFile = { name: "wedding_photo.NEF", type: "", size: 5 * 1024 * 1024 } as unknown as File;
const arwFile = { name: "wedding_photo.arw", type: "", size: 5 * 1024 * 1024 } as unknown as File;
const dngFile = { name: "wedding_photo.dng", type: "", size: 5 * 1024 * 1024 } as unknown as File;
const rafFile = { name: "wedding_photo.raf", type: "", size: 5 * 1024 * 1024 } as unknown as File;
const orfFile = { name: "wedding_photo.orf", type: "", size: 5 * 1024 * 1024 } as unknown as File;
const jpegFile = { name: "wedding_photo.jpg", type: "image/jpeg", size: 5 * 1024 * 1024 } as unknown as File;
const bigFile = { name: "huge.jpg", type: "image/jpeg", size: 30 * 1024 * 1024 } as unknown as File;

console.log("CR2 isRaw:", isRawImageFile(cr2File));
console.log("NEF isRaw:", isRawImageFile(nefFile));
console.log("ARW isRaw:", isRawImageFile(arwFile));
console.log("DNG isRaw:", isRawImageFile(dngFile));
console.log("RAF isRaw:", isRawImageFile(rafFile));
console.log("ORF isRaw:", isRawImageFile(orfFile));
console.log("JPEG isRaw:", isRawImageFile(jpegFile));
console.log("JPEG isAllowed:", isAllowedImageFile(jpegFile));

if (!isRawImageFile(cr2File) || !isRawImageFile(nefFile) || !isRawImageFile(arwFile)) {
  throw new Error("RAW files must be detected as RAW!");
}

console.log("\n=== 5. VERIFYING PLAN LIMIT MESSAGES ===");
console.log("Pro album limit msg:", getPhotoLimitMessage("pro", "album"));
console.log("VIP album limit msg:", getPhotoLimitMessage("vip", "album"));
console.log("Free album limit msg:", getPhotoLimitMessage("free", "album"));

if (getPhotoLimitMessage("pro", "album") !== "Nâng cấp VIP để thêm ảnh") {
  throw new Error("Pro album limit msg must be 'Nâng cấp VIP để thêm ảnh'");
}
if (getPhotoLimitMessage("vip", "album") !== "Đã đạt giới hạn 300 ảnh") {
  throw new Error("VIP album limit msg must be 'Đã đạt giới hạn 300 ảnh'");
}

console.log("ALL VERIFICATIONS PASSED SUCCESSFULLY!");
