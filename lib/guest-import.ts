export const GUEST_NAME_MAX_LENGTH = 100;
export const BULK_IMPORT_MAX_COUNT = 500;

export interface ParsedBulkGuestResult {
  validNames: string[];
  blankSkipped: number;
  duplicateInPasteSkipped: number;
  duplicateExistingSkipped: number;
  tooLongNames: string[];
}

/**
 * Tách danh sách tên khách mời từ văn bản dán (hỗ trợ Google Sheets / Excel nhiều cột).
 * Chỉ lấy cột đầu tiên trước ký tự tab (\t), bỏ dòng trống và loại trùng không phân biệt hoa thường.
 */
export function parseBulkGuestInput(
  rawText: string,
  existingNames: Iterable<string> = [],
): ParsedBulkGuestResult {
  const existingLower = new Set<string>();
  for (const name of existingNames) {
    const normalized = name.trim().toLowerCase();
    if (normalized) existingLower.add(normalized);
  }

  const seenInPaste = new Set<string>();
  const validNames: string[] = [];
  const tooLongNames: string[] = [];
  let blankSkipped = 0;
  let duplicateInPasteSkipped = 0;
  let duplicateExistingSkipped = 0;

  const lines = rawText.split(/\r?\n/);
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      blankSkipped += 1;
      continue;
    }

    const firstCol = trimmedLine.split("\t")[0]?.trim() ?? "";
    if (!firstCol) {
      blankSkipped += 1;
      continue;
    }

    if (firstCol.length > GUEST_NAME_MAX_LENGTH) {
      tooLongNames.push(firstCol);
      continue;
    }

    const key = firstCol.toLowerCase();
    if (existingLower.has(key)) {
      duplicateExistingSkipped += 1;
      continue;
    }
    if (seenInPaste.has(key)) {
      duplicateInPasteSkipped += 1;
      continue;
    }

    seenInPaste.add(key);
    validNames.push(firstCol);
  }

  return {
    validNames,
    blankSkipped,
    duplicateInPasteSkipped,
    duplicateExistingSkipped,
    tooLongNames,
  };
}
