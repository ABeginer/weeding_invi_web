/**
 * Tiện ích xử lý trích xuất mã QR vé mời cưới và tính toán tiến độ bàn tiệc
 */

export interface TableOccupancyInfo {
  tableName: string;
  assignedHeadcount: number;
  arrivedHeadcount: number;
  occupancyPercent: number;
  isReadyForFood: boolean; // >= 80% số khách trên bàn đã có mặt
  guestCount: number;
  arrivedGuestCount: number;
}

/**
 * Trích xuất slug định danh khách mời từ chuỗi mã QR
 * Hỗ trợ các định dạng URL:
 * - https://inviwedd.date/m/slug-khach/tra-cuu-ban
 * - https://inviwedd.date/m/slug-khach
 * - /m/slug-khach
 * - https://inviwedd.date/invite/slug-khach
 * - Mã slug thô (chữ, số, gạch nối)
 */
export function extractGuestSlugFromQr(qrText: string): string | null {
  if (!qrText || typeof qrText !== "string") return null;
  const trimmed = qrText.trim();
  if (!trimmed) return null;

  // 1. Khớp mẫu /m/:slug/tra-cuu-ban hoặc /m/:slug
  const mMatch = trimmed.match(/(?:^|\/)m\/([a-zA-Z0-9_-]+)(?:\/tra-cuu-ban)?(?:\?.*)?$/i);
  if (mMatch && mMatch[1]) {
    return mMatch[1];
  }

  // 2. Khớp mẫu /invite/:slug
  const inviteMatch = trimmed.match(/(?:^|\/)invite\/([a-zA-Z0-9_-]+)(?:\?.*)?$/i);
  if (inviteMatch && inviteMatch[1]) {
    return inviteMatch[1];
  }

  // 3. Chuỗi slug thô hoặc mã vé (vd: inv-abc12345, #INV12345)
  const cleanCode = trimmed.replace(/^#/, "");
  if (/^[a-zA-Z0-9_-]{4,64}$/.test(cleanCode)) {
    return cleanCode;
  }

  return null;
}

/**
 * Định dạng giờ phút từ chuỗi ISO (vd: 18:30)
 */
export function formatCheckInTime(isoString?: string | null): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(d);
  } catch {
    return "";
  }
}

export interface GuestCheckInItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  tableNumber?: string | null;
  plusOnes?: number | null;
  checkedInAt?: string | null;
  checkedInCount?: number | null;
}

/**
 * Tính toán tỷ lệ khách đã đến và tiến độ từng bàn tiệc theo thời gian thực
 */
export function calculateTableOccupancy(guests: GuestCheckInItem[]): {
  totalAssignedHeadcount: number;
  totalArrivedHeadcount: number;
  totalArrivedGuests: number;
  totalGuests: number;
  overallPercent: number;
  tables: TableOccupancyInfo[];
} {
  const tableMap = new Map<
    string,
    {
      assignedHeadcount: number;
      arrivedHeadcount: number;
      guestCount: number;
      arrivedGuestCount: number;
    }
  >();

  let totalAssignedHeadcount = 0;
  let totalArrivedHeadcount = 0;
  let totalArrivedGuests = 0;

  for (const g of guests) {
    if (g.status === "declined") continue;

    const basePlus = typeof g.plusOnes === "number" ? Math.max(0, g.plusOnes) : 0;
    const guestHeadcount = 1 + basePlus;
    const isArrived = Boolean(g.checkedInAt);
    const arrivedCount = isArrived
      ? typeof g.checkedInCount === "number" && g.checkedInCount > 0
        ? g.checkedInCount
        : guestHeadcount
      : 0;

    totalAssignedHeadcount += guestHeadcount;
    if (isArrived) {
      totalArrivedHeadcount += arrivedCount;
      totalArrivedGuests += 1;
    }

    const rawTable = (g.tableNumber || "").trim();
    const tableName = rawTable
      ? /^bàn\s*/i.test(rawTable)
        ? rawTable
        : `Bàn ${rawTable}`
      : "Chưa xếp bàn";

    const current = tableMap.get(tableName) || {
      assignedHeadcount: 0,
      arrivedHeadcount: 0,
      guestCount: 0,
      arrivedGuestCount: 0,
    };

    current.assignedHeadcount += guestHeadcount;
    current.arrivedHeadcount += arrivedCount;
    current.guestCount += 1;
    if (isArrived) current.arrivedGuestCount += 1;

    tableMap.set(tableName, current);
  }

  // Sắp xếp các bàn: Các bàn có số trước theo thứ tự tự nhiên, "Chưa xếp bàn" ở cuối
  const sortedNames = Array.from(tableMap.keys()).sort((a, b) => {
    if (a === "Chưa xếp bàn") return 1;
    if (b === "Chưa xếp bàn") return -1;
    return a.localeCompare(b, "vi", { numeric: true, sensitivity: "base" });
  });

  const tables: TableOccupancyInfo[] = sortedNames.map((tableName) => {
    const data = tableMap.get(tableName)!;
    const occupancyPercent =
      data.assignedHeadcount > 0
        ? Math.round((data.arrivedHeadcount / data.assignedHeadcount) * 100)
        : 0;
    const isReadyForFood =
      tableName !== "Chưa xếp bàn" &&
      data.assignedHeadcount > 0 &&
      occupancyPercent >= 80;

    return {
      tableName,
      assignedHeadcount: data.assignedHeadcount,
      arrivedHeadcount: data.arrivedHeadcount,
      occupancyPercent,
      isReadyForFood,
      guestCount: data.guestCount,
      arrivedGuestCount: data.arrivedGuestCount,
    };
  });

  const totalGuests = guests.filter((g) => g.status !== "declined").length;
  const overallPercent =
    totalAssignedHeadcount > 0
      ? Math.round((totalArrivedHeadcount / totalAssignedHeadcount) * 100)
      : 0;

  return {
    totalAssignedHeadcount,
    totalArrivedHeadcount,
    totalArrivedGuests,
    totalGuests,
    overallPercent,
    tables,
  };
}
