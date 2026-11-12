/**
 * Thuật toán chuyển đổi Âm - Dương lịch Việt Nam (múi giờ cố định Asia/Ho_Chi_Minh, UTC+7).
 *
 * Nguồn tham khảo công bố rộng rãi:
 * - Hồ Ngọc Đức, "Âm lịch Việt Nam - Astronomical algorithms for the Vietnamese lunar calendar"
 *   (dựa trên Jean Meeus, "Astronomical Algorithms" để tính ngày Sóc và Trung khí theo UTC+7).
 * - Quy chuẩn tính tháng Giêng, tháng Một (Đông chí) và tháng Nhuận theo lịch Việt Nam (105°E).
 */

export interface SolarDate {
  day: number;
  month: number;
  year: number;
}

export interface LunarConversionResult {
  solar: SolarDate;
  lunarDay: number;
  lunarMonth: number;
  lunarYear: number;
  isLeapMonth: boolean;
  jd: number;
  yearCanChi: string;
  monthCanChi: string;
  dayCanChi: string;
  zodiacAnimal: string;
}

export interface LunarToSolarOutput {
  ok: boolean;
  error?: string;
  result?: LunarConversionResult;
}

export const LUNAR_TIMEZONE_OFFSET = 7; // Asia/Ho_Chi_Minh (UTC+7)
export const MIN_LUNAR_YEAR = 1900;
export const MAX_LUNAR_YEAR = 2100;

const CAN = [
  "Giáp",
  "Ất",
  "Bính",
  "Đinh",
  "Mậu",
  "Kỷ",
  "Canh",
  "Tân",
  "Nhâm",
  "Quý",
] as const;

const CHI = [
  "Tý",
  "Sửu",
  "Dần",
  "Mão",
  "Thìn",
  "Tỵ",
  "Ngọ",
  "Mùi",
  "Thân",
  "Dậu",
  "Tuất",
  "Hợi",
] as const;

const ZODIAC_ANIMALS = [
  "Tý (Chuột)",
  "Sửu (Trâu)",
  "Dần (Hổ)",
  "Mão (Mèo)",
  "Thìn (Rồng)",
  "Tỵ (Rắn)",
  "Ngọ (Ngựa)",
  "Mùi (Dê)",
  "Thân (Khỉ)",
  "Dậu (Gà)",
  "Tuất (Chó)",
  "Hợi (Lợn)",
] as const;

const PI = Math.PI;

export function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd =
    dd +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
  if (jd < 2299161) {
    jd =
      dd +
      Math.floor((153 * m + 2) / 5) +
      365 * y +
      Math.floor(y / 4) -
      32083;
  }
  return jd;
}

export function jdToDate(jd: number): SolarDate {
  let a: number;
  let b: number;
  let c: number;
  if (jd > 2299160) {
    a = jd + 32044;
    b = Math.floor((4 * a + 3) / 146097);
    c = a - Math.floor((b * 146097) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = b * 100 + d - 4800 + Math.floor(m / 10);
  return { day, month, year };
}

function getNewMoonDay(k: number, timeZone: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = PI / 180;
  let Jd1 =
    2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M =
    359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr =
    306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F =
    21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 =
    (0.1734 - 0.000393 * T) * Math.sin(M * dr) +
    0.0021 * Math.sin(2 * dr * M);
  C1 -= 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 -= 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 += 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 -= 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 -= 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 +=
    0.001 * Math.sin(dr * (2 * F - Mpr)) +
    0.0005 * Math.sin(dr * (2 * Mpr + M));
  const deltat =
    T < -11
      ? 0.001 +
        0.000839 * T +
        0.0002261 * T2 -
        0.00000845 * T3 -
        0.000000081 * T * T3
      : -0.000278 + 0.000265 * T + 0.000262 * T2;
  const JdNew = Jd1 + C1 - deltat;
  return Math.floor(JdNew + 0.5 + timeZone / 24);
}

function getSunLongitude(jdn: number, timeZone: number): number {
  const T = (jdn - 2451545.5 - timeZone / 24) / 36525;
  const T2 = T * T;
  const dr = PI / 180;
  const M =
    357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL +=
    (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) +
    0.00029 * Math.sin(dr * 3 * M);
  let L = L0 + DL;
  L *= dr;
  L -= PI * 2 * Math.floor(L / (PI * 2));
  return Math.floor((L / PI) * 6);
}

function getLunarMonth11(yy: number, timeZone: number): number {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = Math.floor(off / 29.530588853);
  let nm = getNewMoonDay(k, timeZone);
  const sunLong = getSunLongitude(nm, timeZone);
  if (sunLong >= 9) {
    nm = getNewMoonDay(k - 1, timeZone);
  }
  return nm;
}

function getLeapMonthOffset(a11: number, timeZone: number): number {
  const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0;
  let i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  do {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  } while (arc !== last && i < 14);
  return i - 1;
}

export function isValidSolarDate(day: number, month: number, year: number): boolean {
  if (
    !Number.isInteger(day) ||
    !Number.isInteger(month) ||
    !Number.isInteger(year)
  ) {
    return false;
  }
  if (year < MIN_LUNAR_YEAR || year > MAX_LUNAR_YEAR) return false;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const check = new Date(Date.UTC(year, month - 1, day));
  return (
    check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day
  );
}

export function getCanChiYear(lunarYear: number): string {
  const canIndex = (((lunarYear + 6) % 10) + 10) % 10;
  const chiIndex = (((lunarYear + 8) % 12) + 12) % 12;
  return `${CAN[canIndex]} ${CHI[chiIndex]}`;
}

export function getCanChiMonth(lunarMonth: number, lunarYear: number): string {
  const yearCanIndex = (((lunarYear + 6) % 10) + 10) % 10;
  const month1CanIndex = ((yearCanIndex % 5) * 2 + 2) % 10;
  const monthCanIndex = (month1CanIndex + (lunarMonth - 1)) % 10;
  const monthChiIndex = (lunarMonth + 1) % 12;
  return `${CAN[monthCanIndex]} ${CHI[monthChiIndex]}`;
}

export function getCanChiDay(jd: number): string {
  const canIndex = (((jd + 9) % 10) + 10) % 10;
  const chiIndex = (((jd + 1) % 12) + 12) % 12;
  return `${CAN[canIndex]} ${CHI[chiIndex]}`;
}

export function getZodiacAnimal(lunarYear: number): string {
  const chiIndex = (((lunarYear + 8) % 12) + 12) % 12;
  return ZODIAC_ANIMALS[chiIndex];
}

export function convertSolarToLunar(
  dd: number,
  mm: number,
  yy: number,
  timeZone: number = LUNAR_TIMEZONE_OFFSET,
): LunarConversionResult {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) {
    monthStart = getNewMoonDay(k, timeZone);
  }
  let a11 = getLunarMonth11(yy, timeZone);
  let b11 = a11;
  let lunarYear: number;
  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy - 1, timeZone);
  } else {
    lunarYear = yy + 1;
    b11 = getLunarMonth11(yy + 1, timeZone);
  }
  const lunarDay = dayNumber - monthStart + 1;
  const diff = Math.floor((monthStart - a11) / 29);
  let lunarLeap = false;
  let lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) {
        lunarLeap = true;
      }
    }
  }
  if (lunarMonth > 12) {
    lunarMonth -= 12;
  }
  if (lunarMonth >= 11 && diff < 4) {
    lunarYear -= 1;
  }

  return {
    solar: { day: dd, month: mm, year: yy },
    lunarDay,
    lunarMonth,
    lunarYear,
    isLeapMonth: lunarLeap,
    jd: dayNumber,
    yearCanChi: getCanChiYear(lunarYear),
    monthCanChi: getCanChiMonth(lunarMonth, lunarYear),
    dayCanChi: getCanChiDay(dayNumber),
    zodiacAnimal: getZodiacAnimal(lunarYear),
  };
}

export function convertLunarToSolar(
  lunarDay: number,
  lunarMonth: number,
  lunarYear: number,
  isLeapMonth: boolean = false,
  timeZone: number = LUNAR_TIMEZONE_OFFSET,
): LunarToSolarOutput {
  if (
    !Number.isInteger(lunarDay) ||
    !Number.isInteger(lunarMonth) ||
    !Number.isInteger(lunarYear)
  ) {
    return { ok: false, error: "Vui lòng nhập ngày, tháng, năm âm lịch hợp lệ." };
  }
  if (lunarYear < MIN_LUNAR_YEAR || lunarYear > MAX_LUNAR_YEAR) {
    return {
      ok: false,
      error: `Công cụ hỗ trợ năm âm lịch từ ${MIN_LUNAR_YEAR} đến ${MAX_LUNAR_YEAR}.`,
    };
  }
  if (lunarMonth < 1 || lunarMonth > 12) {
    return { ok: false, error: "Tháng âm lịch phải từ 1 đến 12." };
  }
  if (lunarDay < 1 || lunarDay > 30) {
    return { ok: false, error: "Ngày âm lịch phải từ 1 đến 30." };
  }

  let a11: number;
  let b11: number;
  if (lunarMonth < 11) {
    a11 = getLunarMonth11(lunarYear - 1, timeZone);
    b11 = getLunarMonth11(lunarYear, timeZone);
  } else {
    a11 = getLunarMonth11(lunarYear, timeZone);
    b11 = getLunarMonth11(lunarYear + 1, timeZone);
  }
  const k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let off = lunarMonth - 11;
  if (off < 0) {
    off += 12;
  }

  const hasLeapYearSpan = b11 - a11 > 365;
  if (isLeapMonth) {
    if (!hasLeapYearSpan) {
      return {
        ok: false,
        error: `Năm âm lịch ${lunarYear} (${getCanChiYear(lunarYear)}) không có tháng nhuận.`,
      };
    }
    const leapOff = getLeapMonthOffset(a11, timeZone);
    let leapMonth = leapOff - 2;
    if (leapMonth < 0) {
      leapMonth += 12;
    }
    const normalizedLeapMonth = leapMonth === 0 ? 12 : leapMonth;
    if (lunarMonth !== normalizedLeapMonth) {
      return {
        ok: false,
        error: `Năm ${lunarYear} chỉ nhuận tháng ${normalizedLeapMonth}, không có tháng ${lunarMonth} nhuận.`,
      };
    }
    off += 1;
  } else if (hasLeapYearSpan) {
    const leapOff = getLeapMonthOffset(a11, timeZone);
    let leapMonth = leapOff - 2;
    if (leapMonth < 0) {
      leapMonth += 12;
    }
    if (off >= leapOff) {
      off += 1;
    }
  }

  const monthStart = getNewMoonDay(k + off, timeZone);
  const nextMonthStart = getNewMoonDay(k + off + 1, timeZone);
  const monthLength = nextMonthStart - monthStart;
  if (lunarDay > monthLength) {
    return {
      ok: false,
      error: `Tháng ${lunarMonth}${isLeapMonth ? " nhuận" : ""} năm ${lunarYear} chỉ có ${monthLength} ngày.`,
    };
  }

  const jd = monthStart + lunarDay - 1;
  const solar = jdToDate(jd);
  const backCheck = convertSolarToLunar(solar.day, solar.month, solar.year, timeZone);

  return {
    ok: true,
    result: backCheck,
  };
}
