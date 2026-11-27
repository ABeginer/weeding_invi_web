import type { Gift, Guest } from "./types";
import { buildSalutation, getRelationshipLabel, preferenceLabel } from "./salutation-engine";

export interface GuestExportRow {
  name: string;
  relationshipGroup?: Guest["relationshipGroup"];
  guestLink: string;
  status: Guest["status"];
  plusOnes: number;
  diet?: Guest["diet"];
  tableNumber?: string | null;
  giftAmountVnd?: number;
  giftThanked?: boolean;
}

const STATUS_LABELS: Record<Guest["status"], string> = {
  accepted: "Đã xác nhận",
  declined: "Từ chối",
  pending: "Chờ phản hồi",
};

function escapeCsv(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/["\n\r,;]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildGuestsCsv(rows: GuestExportRow[]): string {
  const headers = [
    "Tên khách mời",
    "Vai vế",
    "Link thiệp riêng",
    "Trạng thái RSVP",
    "Số người đi cùng",
    "Chế độ ăn",
    "Số bàn",
    "Tiền mừng (VNĐ)",
    "Đã cảm ơn",
  ];

  const lines = rows.map((row) =>
    [
      row.name,
      getRelationshipLabel(row.relationshipGroup ?? "peer_formal"),
      row.guestLink,
      STATUS_LABELS[row.status] ?? row.status,
      row.plusOnes,
      preferenceLabel(row.diet === "veg" ? "vegetarian" : "standard"),
      row.tableNumber ?? "",
      row.giftAmountVnd ?? "",
      row.giftThanked ? "Có" : "Chưa",
    ]
      .map(escapeCsv)
      .join(","),
  );

  // UTF-8 BOM để Excel trên Windows mở đúng tiếng Việt.
  return `\uFEFF${[headers.join(","), ...lines].join("\r\n")}`;
}

export function buildGuestExportRows(
  guests: Guest[],
  options: { origin: string; gifts?: Gift[] },
): GuestExportRow[] {
  const giftsByGuest = new Map<string, Gift>();
  for (const gift of options.gifts ?? []) {
    if (gift.guestId) giftsByGuest.set(gift.guestId, gift);
  }

  return guests.map((guest) => {
    const gift = giftsByGuest.get(guest.id);
    const salutation = buildSalutation({
      guestName: guest.name,
      relationshipGroup: guest.relationshipGroup,
      customPronounGuest: guest.customPronounGuest,
    });

    return {
      name: salutation.guestLabel,
      relationshipGroup: guest.relationshipGroup,
      guestLink: `${options.origin}/m/${guest.slug}`,
      status: guest.status,
      plusOnes: guest.plusOnes ?? 0,
      diet: guest.diet,
      tableNumber: guest.tableNumber ?? null,
      giftAmountVnd: gift?.amountVnd,
      giftThanked: Boolean(gift?.thankedAt),
    };
  });
}

export function downloadGuestsCsv(rows: GuestExportRow[], filename: string): void {
  const csv = buildGuestsCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
