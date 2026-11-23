import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTimeVi(isoString: string | null): string {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

/**
 * Chuẩn hóa chuỗi ngày (`YYYY-MM-DD`, `DD.MM.YYYY`, `DD/MM/YYYY`, hoặc ISO)
 * cùng giờ tùy chọn (`HH:mm`) thành chuỗi ISO theo múi giờ +07:00.
 */
export function resolveEventIso(dateInput: string, timeInput?: string): string {
  const raw = dateInput.trim();
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw)) {
      return raw;
    }
    return `${raw}+07:00`;
  }

  let year = "";
  let month = "";
  let day = "";

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const dotOrSlashMatch = raw.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);

  if (isoMatch) {
    [, year, month, day] = isoMatch;
  } else if (dotOrSlashMatch) {
    day = dotOrSlashMatch[1].padStart(2, "0");
    month = dotOrSlashMatch[2].padStart(2, "0");
    year = dotOrSlashMatch[3];
  } else {
    return raw;
  }

  let hh = "00";
  let mm = "00";
  if (timeInput) {
    const timeMatch = timeInput.trim().match(/(\d{1,2})[:h](\d{2})/i);
    if (timeMatch) {
      hh = timeMatch[1].padStart(2, "0");
      mm = timeMatch[2].padStart(2, "0");
    }
  }

  return `${year}-${month}-${day}T${hh}:${mm}:00+07:00`;
}

export function formatWeddingDateParts(dateInput: string, timeInput?: string) {
  const isoString = resolveEventIso(dateInput, timeInput);
  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) {
    return {
      weekday: "",
      day: "--",
      month: "--",
      year: "----",
      time: timeInput ?? "--:--",
      dotDate: dateInput,
    };
  }

  const weekday = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);

  const day = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);

  const month = new Intl.DateTimeFormat("vi-VN", {
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);

  const year = new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);

  const time = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);

  return {
    weekday,
    day,
    month,
    year,
    time,
    dotDate: `${day}.${month}.${year}`,
  };
}

/**
 * Chuẩn hóa chuỗi ngày âm lịch để hiển thị kèm tiền tố "(Tức ngày ...)" hoặc "(Nhằm ...)"
 * Loại bỏ từ "ngày" / "Ngày" / "Tức ngày" / "Nhằm" ở đầu chuỗi nếu người dùng hoặc hệ thống đã điền sẵn,
 * tránh lỗi lặp từ như "(Tức ngày Ngày 13 tháng 02 năm...)".
 */
export function formatLunarDateClean(lunarDate?: string | null): string {
  if (!lunarDate) return "";
  return lunarDate.trim().replace(/^(tức ngày|nhằm ngày|nhằm|ngày)\s+/i, "");
}

