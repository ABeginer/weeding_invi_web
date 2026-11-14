/**
 * Ghép dữ liệu thiệp thật vào placeholder của designer template.
 * Module thuần (không import server/client) để dùng ở trang thiệp và test.
 */

export interface DesignerInviteEventLike {
  venueName?: string | null;
  venueAddress?: string | null;
}

export interface DesignerInviteSource {
  groomName?: string | null;
  brideName?: string | null;
  /** Ngày cưới đã format theo kiểu Việt Nam, ví dụ "20.03.2027". */
  dateLabel?: string | null;
  events?: readonly DesignerInviteEventLike[] | null;
  guestName?: string | null;
  /** Tiền tố xưng hô, ví dụ "Trân trọng kính mời". */
  salutation?: string | null;
}

type DesignerInvitePlaceholder =
  | "groom"
  | "bride"
  | "date"
  | "venue"
  | "guestName"
  | "salutation";

export type DesignerInviteValues = Record<DesignerInvitePlaceholder, string>;

function clean(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Nhãn địa điểm gọn cho khổ thiệp: "White Palace, TP.HCM".
 * Lấy tên địa điểm + địa danh cuối trong địa chỉ (thành phố/tỉnh) để không tràn chữ.
 */
export function buildDesignerVenueLabel(
  event?: DesignerInviteEventLike | null,
): string {
  const name = clean(event?.venueName);
  const address = clean(event?.venueAddress);
  if (!name) return address;
  if (!address) return name;

  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const locality = parts.length > 1 ? parts[parts.length - 1] : "";
  if (!locality) return name;
  if (name.toLowerCase().includes(locality.toLowerCase())) return name;
  return `${name}, ${locality}`;
}

/** Giá trị cho 6 placeholder của designer, luôn đủ khóa để renderer tra cứu. */
export function buildDesignerInviteValues(
  source: DesignerInviteSource,
): DesignerInviteValues {
  const events = source.events ?? [];
  return {
    groom: clean(source.groomName),
    bride: clean(source.brideName),
    date: clean(source.dateLabel),
    venue: buildDesignerVenueLabel(events[0] ?? null),
    guestName: clean(source.guestName),
    salutation: clean(source.salutation),
  };
}

/**
 * Trả về số version cần cập nhật khi bản mới nhất của mẫu đã vượt bản đang ghim,
 * ngược lại `null`. UI dùng để hiện nút "Cập nhật lên vN".
 */
export function getDesignerUpdateVersion(
  pinnedVersion: number | null | undefined,
  latestVersion: number | null | undefined,
): number | null {
  if (
    typeof pinnedVersion !== "number" ||
    !Number.isInteger(pinnedVersion) ||
    pinnedVersion < 1 ||
    typeof latestVersion !== "number" ||
    !Number.isInteger(latestVersion) ||
    latestVersion <= pinnedVersion
  ) {
    return null;
  }
  return latestVersion;
}
