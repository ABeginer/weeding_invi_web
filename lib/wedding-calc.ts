export interface OtherExpenseItem {
  id: string;
  name: string;
  amount: string;
}

export interface WeddingCalcRawInputs {
  invitedGuests: string;
  attendanceRate: string;
  avgPlusOnes: string;
  guestsPerTable: string;
  reserveRate: string;
  pricePerTable: string;
  otherExpenses: OtherExpenseItem[];
  avgGiftPerGuest: string;
}

export interface WeddingCalcNumbers {
  G: number;
  r: number;
  c: number;
  p: number;
  b: number;
  m: number;
  O: number;
  g: number;
}

export interface WeddingCalcFieldErrors {
  invitedGuests?: string;
  attendanceRate?: string;
  avgPlusOnes?: string;
  guestsPerTable?: string;
  reserveRate?: string;
  pricePerTable?: string;
  avgGiftPerGuest?: string;
  otherExpenseIds: Record<string, string>;
}

export interface WeddingCalcResult {
  canCalculate: boolean;
  missingMainInputs: boolean;
  hasValidationErrors: boolean;
  errors: WeddingCalcFieldErrors;
  attendingGuests: number;
  attendingPeople: number;
  tables: number;
  tablesWithReserve: number;
  reserveTables: number;
  foodCost: number;
  otherCostTotal: number;
  totalCost: number;
  expectedGifts: number;
  net: number;
  breakevenGifts: number | null;
  breakdown: Array<{
    id: string;
    label: string;
    amount: number;
    percent: number;
  }>;
}

function ceilSafe(value: number): number {
  return Math.ceil(Number(value.toFixed(8)));
}

export function formatVnd(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `${new Intl.NumberFormat("vi-VN").format(safe)} ₫`;
}

export function parseStrictNonNegativeInt(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) return NaN;
  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) ? parsed : NaN;
}

export function parseStrictNonNegativeDecimal(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (!trimmed) return null;
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return NaN;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function calculateWeddingBudgetFromNumbers(
  input: WeddingCalcNumbers,
): {
  attendingGuests: number;
  attendingPeople: number;
  tables: number;
  tablesWithReserve: number;
  reserveTables: number;
  foodCost: number;
  totalCost: number;
  expectedGifts: number;
  net: number;
  breakevenGifts: number | null;
} {
  const { G, r, c, p, b, m, O, g } = input;
  const attendingGuests = ceilSafe(G * r);
  const attendingPeople = Math.round(attendingGuests * (1 + c));
  const tables = attendingPeople === 0 ? 0 : ceilSafe(attendingPeople / p);
  const tablesWithReserve = tables === 0 ? 0 : ceilSafe(tables * (1 + b));
  const reserveTables = Math.max(0, tablesWithReserve - tables);
  const foodCost = tablesWithReserve * m;
  const totalCost = foodCost + O;
  const expectedGifts = attendingGuests * g;
  const net = expectedGifts - totalCost;
  const breakevenGifts = g > 0 ? ceilSafe(totalCost / g) : null;

  return {
    attendingGuests,
    attendingPeople,
    tables,
    tablesWithReserve,
    reserveTables,
    foodCost,
    totalCost,
    expectedGifts,
    net,
    breakevenGifts,
  };
}

export function evaluateWeddingCalculator(
  raw: WeddingCalcRawInputs,
  menuChartLabel: string = "Thực đơn tiệc cưới",
): WeddingCalcResult {
  const errors: WeddingCalcFieldErrors = {
    otherExpenseIds: {},
  };

  const invitedRaw = raw.invitedGuests.trim();
  const priceRaw = raw.pricePerTable.trim();
  const missingMainInputs = invitedRaw === "" || priceRaw === "";

  const G = parseStrictNonNegativeInt(raw.invitedGuests);
  if (invitedRaw !== "" && (G === null || Number.isNaN(G) || G < 0 || G > 2000)) {
    errors.invitedGuests = "Vui lòng nhập số nguyên từ 0 đến 2.000.";
  }

  const attendancePct = parseStrictNonNegativeDecimal(raw.attendanceRate);
  if (
    raw.attendanceRate.trim() === "" ||
    attendancePct === null ||
    Number.isNaN(attendancePct) ||
    attendancePct < 0 ||
    attendancePct > 100
  ) {
    errors.attendanceRate = "Tỉ lệ đến dự phải nằm trong khoảng 0% đến 100%.";
  }

  const plusOnes = parseStrictNonNegativeDecimal(raw.avgPlusOnes);
  if (
    raw.avgPlusOnes.trim() === "" ||
    plusOnes === null ||
    Number.isNaN(plusOnes) ||
    plusOnes < 0 ||
    plusOnes > 5
  ) {
    errors.avgPlusOnes = "Số người đi cùng trung bình phải từ 0 đến 5.";
  }

  const perTable = parseStrictNonNegativeInt(raw.guestsPerTable);
  if (
    raw.guestsPerTable.trim() === "" ||
    perTable === null ||
    Number.isNaN(perTable) ||
    perTable < 1 ||
    perTable > 30
  ) {
    errors.guestsPerTable = "Số khách mỗi bàn phải là số nguyên từ 1 đến 30.";
  }

  const reservePct = parseStrictNonNegativeDecimal(raw.reserveRate);
  if (
    raw.reserveRate.trim() === "" ||
    reservePct === null ||
    Number.isNaN(reservePct) ||
    reservePct < 0 ||
    reservePct > 20
  ) {
    errors.reserveRate = "Tỉ lệ dự phòng phải từ 0% đến 20%.";
  }

  const m = parseStrictNonNegativeInt(raw.pricePerTable);
  if (priceRaw !== "" && (m === null || Number.isNaN(m) || m < 0)) {
    errors.pricePerTable = "Giá một mâm phải là số nguyên không âm.";
  }

  const g = parseStrictNonNegativeInt(raw.avgGiftPerGuest);
  if (
    raw.avgGiftPerGuest.trim() !== "" &&
    (g === null || Number.isNaN(g) || g < 0)
  ) {
    errors.avgGiftPerGuest = "Số tiền mừng trung bình phải là số nguyên không âm.";
  }

  let otherCostTotal = 0;
  const validExpenseBreakdown: Array<{ id: string; label: string; amount: number }> = [];
  for (const item of raw.otherExpenses) {
    const trimmedAmt = item.amount.trim();
    if (!trimmedAmt) continue;
    const parsedAmt = parseStrictNonNegativeInt(trimmedAmt);
    if (parsedAmt === null || Number.isNaN(parsedAmt) || parsedAmt < 0) {
      errors.otherExpenseIds[item.id] = "Số tiền phải là số nguyên không âm.";
      continue;
    }
    otherCostTotal += parsedAmt;
    if (parsedAmt > 0) {
      validExpenseBreakdown.push({
        id: item.id,
        label: item.name.trim() || "Khoản chi khác",
        amount: parsedAmt,
      });
    }
  }

  const hasValidationErrors =
    Boolean(
      errors.invitedGuests ||
        errors.attendanceRate ||
        errors.avgPlusOnes ||
        errors.guestsPerTable ||
        errors.reserveRate ||
        errors.pricePerTable ||
        errors.avgGiftPerGuest,
    ) || Object.keys(errors.otherExpenseIds).length > 0;

  if (missingMainInputs || hasValidationErrors || G === null || m === null) {
    return {
      canCalculate: false,
      missingMainInputs,
      hasValidationErrors,
      errors,
      attendingGuests: 0,
      attendingPeople: 0,
      tables: 0,
      tablesWithReserve: 0,
      reserveTables: 0,
      foodCost: 0,
      otherCostTotal,
      totalCost: 0,
      expectedGifts: 0,
      net: 0,
      breakevenGifts: null,
      breakdown: [],
    };
  }

  const calculated = calculateWeddingBudgetFromNumbers({
    G,
    r: (attendancePct ?? 90) / 100,
    c: plusOnes ?? 0,
    p: perTable ?? 10,
    b: (reservePct ?? 5) / 100,
    m,
    O: otherCostTotal,
    g: g ?? 0,
  });

  const rawGroups: Array<{ id: string; label: string; amount: number }> = [];
  if (calculated.foodCost > 0) {
    rawGroups.push({
      id: "menu",
      label: menuChartLabel,
      amount: calculated.foodCost,
    });
  }
  rawGroups.push(...validExpenseBreakdown);
  rawGroups.sort((a, b) => b.amount - a.amount);

  const breakdown = rawGroups.map((group) => ({
    ...group,
    percent:
      calculated.totalCost > 0
        ? Math.round((group.amount / calculated.totalCost) * 1000) / 10
        : 0,
  }));

  return {
    canCalculate: true,
    missingMainInputs: false,
    hasValidationErrors: false,
    errors,
    ...calculated,
    otherCostTotal,
    breakdown,
  };
}
