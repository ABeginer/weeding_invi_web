import type { RelationshipGroup } from "./salutation-engine";

export const GUEST_NAME_MAX_LENGTH = 100;
export const BULK_IMPORT_MAX_COUNT = 500;

export interface ParsedGuestItem {
  id: string;
  name: string;
  relationshipGroup: RelationshipGroup | null;
  tableNumber: string | null;
  isDuplicateInPaste: boolean;
  isDuplicateExisting: boolean;
  isTooLong: boolean;
}

export interface ParsedBulkGuestResult {
  items: ParsedGuestItem[];
  validItems: ParsedGuestItem[];
  validNames: string[];
  blankSkipped: number;
  duplicateInPasteSkipped: number;
  duplicateExistingSkipped: number;
  tooLongNames: string[];
}

export function detectRoleGroup(input?: string | null): RelationshipGroup | null {
  if (!input) return null;
  const s = input.trim().toLowerCase();
  if (!s) return null;

  // Nếu là số bàn (bàn 1, table 2, số...), không phải vai vế
  if (/^(bàn|table)\s*\d+/i.test(s) || /^\d+$/.test(s)) {
    return null;
  }

  // Tách thành các từ độc lập để so khớp chính xác từng từ tiếng Việt có dấu
  const words = s.split(/[\s,./\-_+&]+/);

  if (
    s === "close_friend" ||
    s.includes("bạn thân") ||
    s.includes("tri kỷ") ||
    s === "bạn" ||
    words.includes("bạn")
  ) {
    return "close_friend";
  }

  if (
    s === "peer_formal" ||
    s.includes("đồng nghiệp") ||
    s.includes("công ty") ||
    s.includes("cty") ||
    s.includes("cơ quan") ||
    s.includes("đối tác") ||
    s.includes("khách quý") ||
    words.includes("sếp") ||
    words.includes("colleague")
  ) {
    return "peer_formal";
  }

  if (
    s === "family" ||
    s.includes("gia đình") ||
    s.includes("nhà trai") ||
    s.includes("nhà gái") ||
    s.includes("ruột thịt")
  ) {
    return "family";
  }

  if (
    s === "elder" ||
    s.includes("họ hàng") ||
    s.includes("bề trên") ||
    s.includes("cô chú") ||
    s.includes("chú bác") ||
    s.includes("ông bà") ||
    s.includes("cậu mợ") ||
    words.includes("cô") ||
    words.includes("chú") ||
    words.includes("bác") ||
    words.includes("ông") ||
    words.includes("bà") ||
    words.includes("thím") ||
    words.includes("dượng") ||
    words.includes("cậu") ||
    words.includes("mợ")
  ) {
    return "elder";
  }

  return null;
}

function detectTableNumber(input?: string | null): string | null {
  if (!input) return null;
  const s = input.trim();
  if (!s) return null;
  if (/^(bàn\s*|table\s*)?\d+([a-zA-Z])?$/i.test(s) || /^\d+$/.test(s)) {
    return s;
  }
  return null;
}

/**
 * Tách danh sách khách mời từ văn bản dán (hỗ trợ Google Sheets / Excel nhiều cột).
 * Cột 1: Tên khách mời.
 * Cột 2 (tuỳ chọn): Vai vế hoặc Số bàn.
 * Cột 3 (tuỳ chọn): Số bàn hoặc Ghi chú.
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
  const items: ParsedGuestItem[] = [];
  const validItems: ParsedGuestItem[] = [];
  const tooLongNames: string[] = [];
  let blankSkipped = 0;
  let duplicateInPasteSkipped = 0;
  let duplicateExistingSkipped = 0;

  const lines = rawText.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      blankSkipped += 1;
      continue;
    }

    // Phân tách cột (ưu tiên tab \t từ Excel/Sheets, sau đó là dấu phẩy nếu định dạng CSV)
    const cols = trimmedLine.includes("\t")
      ? trimmedLine.split("\t").map((c) => c.trim())
      : trimmedLine.split(",").map((c) => c.trim());

    const nameCol = cols[0] ?? "";
    if (!nameCol) {
      blankSkipped += 1;
      continue;
    }

    const col2 = cols[1] ?? "";
    const col3 = cols[2] ?? "";

    // Nhận diện vai vế và số bàn tự động từ các cột phụ
    const roleFromCol2 = detectRoleGroup(col2);
    const tableFromCol2 = !roleFromCol2 ? detectTableNumber(col2) : null;

    const roleFromCol3 = !roleFromCol2 ? detectRoleGroup(col3) : null;
    const tableFromCol3 = !tableFromCol2 ? detectTableNumber(col3) : null;

    const relationshipGroup = roleFromCol2 ?? roleFromCol3;
    const tableNumber = tableFromCol2 ?? tableFromCol3;

    const isTooLong = nameCol.length > GUEST_NAME_MAX_LENGTH;
    if (isTooLong) {
      tooLongNames.push(nameCol);
    }

    const key = nameCol.toLowerCase();
    const isDuplicateExisting = existingLower.has(key);
    const isDuplicateInPaste = seenInPaste.has(key);

    if (isDuplicateExisting) {
      duplicateExistingSkipped += 1;
    } else if (isDuplicateInPaste) {
      duplicateInPasteSkipped += 1;
    } else {
      seenInPaste.add(key);
    }

    const item: ParsedGuestItem = {
      id: `parsed-${i}-${Math.random().toString(36).slice(2, 7)}`,
      name: nameCol,
      relationshipGroup,
      tableNumber,
      isDuplicateInPaste,
      isDuplicateExisting,
      isTooLong,
    };

    items.push(item);

    if (!isTooLong && !isDuplicateExisting && !isDuplicateInPaste) {
      validItems.push(item);
    }
  }

  return {
    items,
    validItems,
    validNames: validItems.map((item) => item.name),
    blankSkipped,
    duplicateInPasteSkipped,
    duplicateExistingSkipped,
    tooLongNames,
  };
}
