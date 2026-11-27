import { parseBulkGuestInput } from "./guest-import.ts";
import type { RelationshipGroup } from "./salutation-engine";

export type CeremonyId = "vu_quy" | "thanh_hon" | "tiec_cuoi";
export type GuestSide = "nha_trai" | "nha_gai" | "ban_be" | "dong_nghiep";

export interface CeremonyOption {
  id: CeremonyId;
  label: string;
  shortLabel: string;
  hint: string;
}

export const CEREMONY_OPTIONS: readonly CeremonyOption[] = [
  {
    id: "vu_quy",
    label: "Lễ Vu Quy",
    shortLabel: "Vu Quy",
    hint: "Lễ gia tiên & đón dâu tại tư gia nhà gái",
  },
  {
    id: "thanh_hon",
    label: "Lễ Thành Hôn",
    shortLabel: "Thành Hôn",
    hint: "Lễ gia tiên & ra mắt họ hàng tại tư gia nhà trai",
  },
  {
    id: "tiec_cuoi",
    label: "Tiệc Cưới Nhà Hàng",
    shortLabel: "Tiệc Cưới",
    hint: "Tiệc mặn chiêu đãi bạn bè, đồng nghiệp & hai họ",
  },
] as const;

export const SIDE_OPTIONS: ReadonlyArray<{
  id: GuestSide;
  label: string;
  shortLabel: string;
}> = [
  { id: "nha_trai", label: "Họ hàng Nhà trai", shortLabel: "Nhà trai" },
  { id: "nha_gai", label: "Họ hàng Nhà gái", shortLabel: "Nhà gái" },
  { id: "ban_be", label: "Bạn bè & Nhóm chung", shortLabel: "Bạn bè" },
  { id: "dong_nghiep", label: "Đồng nghiệp & Đối tác", shortLabel: "Đồng nghiệp" },
] as const;

export const ROLE_OPTIONS: ReadonlyArray<{
  id: RelationshipGroup;
  label: string;
  bulkKeyword: string;
}> = [
  { id: "elder", label: "Bề trên / Cô chú", bulkKeyword: "Họ hàng" },
  { id: "family", label: "Gia đình ruột thịt", bulkKeyword: "Gia đình" },
  { id: "peer_formal", label: "Bạn bè / Đồng nghiệp", bulkKeyword: "Đồng nghiệp" },
  { id: "close_friend", label: "Bạn thân", bulkKeyword: "Bạn thân" },
] as const;

export interface GuestPlanRow {
  id: string;
  name: string;
  side: GuestSide;
  role: RelationshipGroup;
  ceremonies: CeremonyId[];
  plusOnes: number;
  tableLabel: string;
  note: string;
}

export interface CeremonySummary {
  ceremony: CeremonyId;
  label: string;
  shortLabel: string;
  inviteCount: number;
  headcount: number;
  baseTables: number;
  reserveTables: number;
  totalTablesWithReserve: number;
}

export interface SideSummary {
  side: GuestSide;
  label: string;
  inviteCount: number;
  headcount: number;
}

export interface GuestPlannerSummary {
  totalInvites: number;
  totalHeadcount: number;
  maxTablesAcrossCeremonies: number;
  ceremonies: CeremonySummary[];
  sides: SideSummary[];
  assignedTableCount: number;
  unassignedCount: number;
}

export const DEFAULT_SEATS_PER_TABLE = 10;
export const MIN_SEATS_PER_TABLE = 4;
export const MAX_SEATS_PER_TABLE = 20;
export const MAX_PLUS_ONES = 10;

export function clampSeatsPerTable(raw: number | string): number {
  const num = typeof raw === "number" ? raw : Number.parseInt(String(raw).trim(), 10);
  if (!Number.isFinite(num) || Number.isNaN(num)) return DEFAULT_SEATS_PER_TABLE;
  return Math.min(MAX_SEATS_PER_TABLE, Math.max(MIN_SEATS_PER_TABLE, Math.round(num)));
}

export function clampPlusOnes(raw: number | string): number {
  const num = typeof raw === "number" ? raw : Number.parseInt(String(raw).trim(), 10);
  if (!Number.isFinite(num) || Number.isNaN(num) || num < 0) return 0;
  return Math.min(MAX_PLUS_ONES, Math.round(num));
}

export function getSideLabel(side: GuestSide): string {
  return SIDE_OPTIONS.find((item) => item.id === side)?.shortLabel ?? "Bạn bè";
}

export function getRoleLabel(role: RelationshipGroup): string {
  return ROLE_OPTIONS.find((item) => item.id === role)?.label ?? "Bạn bè / Đồng nghiệp";
}

export function getRoleBulkKeyword(role: RelationshipGroup): string {
  return ROLE_OPTIONS.find((item) => item.id === role)?.bulkKeyword ?? "Đồng nghiệp";
}

export function getCeremonyLabel(ceremony: CeremonyId): string {
  return CEREMONY_OPTIONS.find((item) => item.id === ceremony)?.shortLabel ?? ceremony;
}

function defaultRoleForSide(side: GuestSide): RelationshipGroup {
  if (side === "nha_trai" || side === "nha_gai") return "elder";
  if (side === "ban_be") return "close_friend";
  return "peer_formal";
}

function defaultSideForRole(role: RelationshipGroup, fallbackSide: GuestSide): GuestSide {
  if (role === "close_friend") return "ban_be";
  if (role === "peer_formal") return "dong_nghiep";
  return fallbackSide;
}

let idCounter = 0;
export function createGuestRowId(): string {
  idCounter += 1;
  return `g_${Date.now().toString(36)}_${idCounter.toString(36)}`;
}

export function buildSampleGuests(activeCeremonies: CeremonyId[]): GuestPlanRow[] {
  const safeCeremonies: CeremonyId[] =
    activeCeremonies.length > 0 ? activeCeremonies : ["tiec_cuoi"];
  const hasVuQuy = safeCeremonies.includes("vu_quy");
  const hasThanhHon = safeCeremonies.includes("thanh_hon");
  const hasTiecCuoi = safeCeremonies.includes("tiec_cuoi");

  const pick = (ids: CeremonyId[]): CeremonyId[] => {
    const filtered = ids.filter((id) => safeCeremonies.includes(id));
    return filtered.length > 0 ? filtered : [safeCeremonies[0]];
  };

  const samples: Array<Omit<GuestPlanRow, "id">> = [
    {
      name: "Ông Bà Nội & Cô Bác",
      side: "nha_trai",
      role: "family",
      ceremonies: pick(["thanh_hon", "tiec_cuoi"]),
      plusOnes: 3,
      tableLabel: "Bàn 1",
      note: "Bàn danh dự họ nội",
    },
    {
      name: "Chú Tư & Thím Tư",
      side: "nha_trai",
      role: "elder",
      ceremonies: pick(["thanh_hon", "tiec_cuoi"]),
      plusOnes: 1,
      tableLabel: "Bàn 1",
      note: "",
    },
    {
      name: "Cô Sáu & Chồng",
      side: "nha_trai",
      role: "elder",
      ceremonies: pick(["thanh_hon", "tiec_cuoi"]),
      plusOnes: 1,
      tableLabel: "Bàn 1",
      note: "",
    },
    {
      name: "Ông Bà Ngoại & Cậu Mợ",
      side: "nha_gai",
      role: "family",
      ceremonies: pick(["vu_quy", "tiec_cuoi"]),
      plusOnes: 3,
      tableLabel: "Bàn 2",
      note: "Bàn danh dự họ ngoại",
    },
    {
      name: "Dì Ba & Gia đình",
      side: "nha_gai",
      role: "elder",
      ceremonies: pick(["vu_quy", "tiec_cuoi"]),
      plusOnes: 2,
      tableLabel: "Bàn 2",
      note: "",
    },
    {
      name: "Bác Hai & Bác Gái",
      side: "nha_gai",
      role: "elder",
      ceremonies: pick(["vu_quy", "tiec_cuoi"]),
      plusOnes: 1,
      tableLabel: "Bàn 2",
      note: "",
    },
    {
      name: "Minh Anh (Bạn thân đại học)",
      side: "ban_be",
      role: "close_friend",
      ceremonies: pick(hasVuQuy ? ["vu_quy", "tiec_cuoi"] : ["tiec_cuoi"]),
      plusOnes: 1,
      tableLabel: "Bàn 3",
      note: "Phù dâu / đón khách",
    },
    {
      name: "Quốc Bảo & Nhóm Cấp 3",
      side: "ban_be",
      role: "close_friend",
      ceremonies: pick(["tiec_cuoi"]),
      plusOnes: 4,
      tableLabel: "Bàn 3",
      note: "Xếp chung nhóm lớp",
    },
    {
      name: "Hoàng Nam (Bạn thân chú rể)",
      side: "ban_be",
      role: "close_friend",
      ceremonies: pick(hasThanhHon ? ["thanh_hon", "tiec_cuoi"] : ["tiec_cuoi"]),
      plusOnes: 1,
      tableLabel: "Bàn 3",
      note: "",
    },
    {
      name: "Anh Tuấn (Trưởng phòng)",
      side: "dong_nghiep",
      role: "peer_formal",
      ceremonies: pick(hasTiecCuoi ? ["tiec_cuoi"] : safeCeremonies),
      plusOnes: 1,
      tableLabel: "Bàn 4",
      note: "Khách công ty",
    },
    {
      name: "Chị Lan & Team Marketing",
      side: "dong_nghiep",
      role: "peer_formal",
      ceremonies: pick(hasTiecCuoi ? ["tiec_cuoi"] : safeCeremonies),
      plusOnes: 4,
      tableLabel: "Bàn 4",
      note: "",
    },
    {
      name: "Anh Dũng (Đối tác)",
      side: "dong_nghiep",
      role: "peer_formal",
      ceremonies: pick(hasTiecCuoi ? ["tiec_cuoi"] : safeCeremonies),
      plusOnes: 1,
      tableLabel: "Bàn 4",
      note: "",
    },
  ];

  return samples.map((item, idx) => ({
    ...item,
    id: `sample_${idx + 1}`,
  }));
}

export function parseQuickLinesToRows(
  rawText: string,
  activeCeremonies: CeremonyId[],
  defaultSide: GuestSide = "ban_be",
): GuestPlanRow[] {
  const safeCeremonies: CeremonyId[] =
    activeCeremonies.length > 0 ? activeCeremonies : ["tiec_cuoi"];
  const parsed = parseBulkGuestInput(rawText);

  return parsed.validItems.map((item) => {
    const role = item.relationshipGroup ?? defaultRoleForSide(defaultSide);
    const inferredSide = item.relationshipGroup
      ? defaultSideForRole(item.relationshipGroup, defaultSide)
      : defaultSide;

    return {
      id: createGuestRowId(),
      name: item.name,
      side: inferredSide,
      role,
      ceremonies: [...safeCeremonies],
      plusOnes: 0,
      tableLabel: item.tableNumber ?? "",
      note: "",
    };
  });
}

export function autoAssignTablesByGroup(
  guests: GuestPlanRow[],
  seatsPerTableInput: number,
  ceremonyFilter: CeremonyId | "all" = "all",
): GuestPlanRow[] {
  const seatsPerTable = clampSeatsPerTable(seatsPerTableInput);
  const sideOrder: Record<GuestSide, number> = {
    nha_trai: 1,
    nha_gai: 2,
    ban_be: 3,
    dong_nghiep: 4,
  };

  const targetIds = new Set(
    guests
      .filter((g) => ceremonyFilter === "all" || g.ceremonies.includes(ceremonyFilter))
      .map((g) => g.id),
  );

  const targets = guests
    .filter((g) => targetIds.has(g.id))
    .sort((a, b) => sideOrder[a.side] - sideOrder[b.side]);

  let currentTable = 1;
  let currentSeats = 0;
  let currentSide: GuestSide | null = null;
  const assignedMap = new Map<string, string>();

  for (const guest of targets) {
    const headcount = 1 + clampPlusOnes(guest.plusOnes);
    if (currentSide !== null && guest.side !== currentSide && currentSeats > 0) {
      currentTable += 1;
      currentSeats = 0;
    } else if (currentSeats > 0 && currentSeats + headcount > seatsPerTable) {
      currentTable += 1;
      currentSeats = 0;
    }

    currentSide = guest.side;
    assignedMap.set(guest.id, `Bàn ${currentTable}`);
    currentSeats += headcount;
  }

  return guests.map((guest) => {
    const nextTable = assignedMap.get(guest.id);
    if (!nextTable) return guest;
    return { ...guest, tableLabel: nextTable };
  });
}

export function summarizeGuestPlan(
  guests: GuestPlanRow[],
  activeCeremonies: CeremonyId[],
  seatsPerTableInput: number,
): GuestPlannerSummary {
  const seatsPerTable = clampSeatsPerTable(seatsPerTableInput);
  const ceremoniesList: CeremonyId[] =
    activeCeremonies.length > 0 ? activeCeremonies : ["tiec_cuoi"];

  const ceremonies: CeremonySummary[] = ceremoniesList.map((ceremony) => {
    const opt = CEREMONY_OPTIONS.find((item) => item.id === ceremony)!;
    const matching = guests.filter((g) => g.ceremonies.includes(ceremony));
    const headcount = matching.reduce(
      (sum, g) => sum + 1 + clampPlusOnes(g.plusOnes),
      0,
    );
    const baseTables = headcount > 0 ? Math.ceil(headcount / seatsPerTable) : 0;
    const reserveTables =
      baseTables > 0 ? Math.max(1, Math.ceil(baseTables * 0.1)) : 0;

    return {
      ceremony,
      label: opt.label,
      shortLabel: opt.shortLabel,
      inviteCount: matching.length,
      headcount,
      baseTables,
      reserveTables,
      totalTablesWithReserve: baseTables + reserveTables,
    };
  });

  const sides: SideSummary[] = SIDE_OPTIONS.map((sideOpt) => {
    const matching = guests.filter((g) => g.side === sideOpt.id);
    const headcount = matching.reduce(
      (sum, g) => sum + 1 + clampPlusOnes(g.plusOnes),
      0,
    );
    return {
      side: sideOpt.id,
      label: sideOpt.shortLabel,
      inviteCount: matching.length,
      headcount,
    };
  });

  const totalHeadcount = guests.reduce(
    (sum, g) => sum + 1 + clampPlusOnes(g.plusOnes),
    0,
  );
  const assignedTableCount = new Set(
    guests.map((g) => g.tableLabel.trim()).filter((t) => t.length > 0),
  ).size;
  const unassignedCount = guests.filter((g) => g.tableLabel.trim().length === 0).length;
  const maxTablesAcrossCeremonies = ceremonies.reduce(
    (max, item) => Math.max(max, item.baseTables),
    0,
  );

  return {
    totalInvites: guests.length,
    totalHeadcount,
    maxTablesAcrossCeremonies,
    ceremonies,
    sides,
    assignedTableCount,
    unassignedCount,
  };
}

/**
 * Xuất danh sách định dạng TSV 3 cột (`Tên khách \t Vai vế \t Số bàn`)
 * tương thích trực tiếp với trình nhập 500 khách hàng loạt của Inviwedd (`lib/guest-import.ts`).
 */
export function buildInviweddBulkTsv(
  guests: GuestPlanRow[],
  ceremonyFilter: CeremonyId | "all" = "all",
): string {
  const rows =
    ceremonyFilter === "all"
      ? guests
      : guests.filter((g) => g.ceremonies.includes(ceremonyFilter));

  return rows
    .filter((g) => g.name.trim().length > 0)
    .map((g) => {
      const cleanName = g.name.replace(/[\r\n\t]+/g, " ").trim();
      const roleKeyword = getRoleBulkKeyword(g.role);
      const table = g.tableLabel.replace(/[\r\n\t]+/g, " ").trim();
      return table ? `${cleanName}\t${roleKeyword}\t${table}` : `${cleanName}\t${roleKeyword}`;
    })
    .join("\n");
}

function escapeCsvCell(raw: string): string {
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  if (/[",\r\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function buildGuestListCsv(guests: GuestPlanRow[]): string {
  const header = [
    "STT",
    "Tên khách mời",
    "Nhóm / Bên mời",
    "Vai vế xưng hô",
    "Buổi lễ tham dự",
    "Người đi cùng",
    "Tổng chỗ",
    "Bàn tiệc",
    "Ghi chú",
  ];

  const lines = guests.map((g, index) => {
    const plusOnes = clampPlusOnes(g.plusOnes);
    const totalSeats = 1 + plusOnes;
    const ceremoniesText = g.ceremonies.map(getCeremonyLabel).join(" + ");

    return [
      String(index + 1),
      g.name.trim(),
      getSideLabel(g.side),
      getRoleLabel(g.role),
      ceremoniesText,
      String(plusOnes),
      String(totalSeats),
      g.tableLabel.trim(),
      g.note.trim(),
    ]
      .map(escapeCsvCell)
      .join(",");
  });

  return `\uFEFF${header.map(escapeCsvCell).join(",")}\r\n${lines.join("\r\n")}`;
}
