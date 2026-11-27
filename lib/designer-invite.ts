/**
 * Ghép dữ liệu thiệp thật vào placeholder của designer template.
 * Module thuần (không import server/client) để dùng ở trang thiệp và test.
 */

export interface DesignerInviteEventLike {
  title?: string | null;
  startsAt?: string | null;
  lunarDate?: string | null;
  venueName?: string | null;
  venueAddress?: string | null;
  mapDirectionsUrl?: string | null;
  mapEmbedUrl?: string | null;
}

export interface DesignerInviteSource {
  groomName?: string | null;
  brideName?: string | null;
  /** Ngày cưới đã format theo kiểu Việt Nam, ví dụ "20.03.2027". */
  dateLabel?: string | null;
  /** ISO của ngày cưới để block lịch vẽ đúng tháng. */
  dateIso?: string | null;
  events?: readonly DesignerInviteEventLike[] | null;
  guestName?: string | null;
  /** Tiền tố xưng hô, ví dụ "Trân trọng kính mời". */
  salutation?: string | null;
  /** Ảnh/giá trị custom do khách điền, key = element id. */
  designerFields?: Record<string, string> | null;
  /** Thông tin bổ sung cho các block tương tác (quà, album, nhạc). */
  hasGifts?: boolean | null;
  hasPhotos?: boolean | null;
  photoCount?: number | null;
  hasMusic?: boolean | null;
  musicTitle?: string | null;
  musicUrl?: string | null;
}

type DesignerInvitePlaceholder =
  | "groom"
  | "bride"
  | "date"
  | "venue"
  | "guestName"
  | "salutation";

export type DesignerInviteValues = Record<string, string>;

function clean(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function eventDateParts(
  event: DesignerInviteEventLike | null,
  fallbackIso: string,
): { day: string; month: string; year: string; weekday: string; time: string } {
  const raw = event?.startsAt || fallbackIso;
  const date = raw ? new Date(raw) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return { day: "", month: "", year: "", weekday: "", time: "" };
  }
  const parts = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const pick = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    day: pick("day"),
    month: pick("month"),
    year: pick("year"),
    weekday: pick("weekday").toUpperCase(),
    time: `${pick("hour")}:${pick("minute")}`,
  };
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
  const eventsCount = events.length;
  const firstEvent = events[0] ?? null;
  const secondEvent = events[1] ?? null;
  const venue = buildDesignerVenueLabel(firstEvent);
  const venue2 = buildDesignerVenueLabel(secondEvent);
  const mapUrlFor = (event: DesignerInviteEventLike | null, label: string) =>
    event?.mapDirectionsUrl ||
    (label
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label)}`
      : "");
  const mapUrl = mapUrlFor(firstEvent, venue);
  const mapUrl2 = mapUrlFor(secondEvent, venue2);
  const dateParts = eventDateParts(firstEvent, clean(source.dateIso));
  const eventVenueName = clean(firstEvent?.venueName);
  const eventAddress = clean(firstEvent?.venueAddress);

  // Xử lý danh sách tối đa 3 sự kiện cho block bản đồ đa sự kiện
  const multiEventValues: Record<string, string> = {
    eventsCount: String(eventsCount),
  };
  events.slice(0, 3).forEach((evt, idx) => {
    const vLabel = buildDesignerVenueLabel(evt);
    const mUrl = mapUrlFor(evt, vLabel);
    const dParts = eventDateParts(evt, clean(source.dateIso));
    multiEventValues[`event_${idx}_title`] = clean(evt.title) || (idx === 0 ? "LỄ THÀNH HÔN" : `LỄ ${idx + 1}`);
    multiEventValues[`event_${idx}_venueName`] = clean(evt.venueName);
    multiEventValues[`event_${idx}_address`] = clean(evt.venueAddress);
    multiEventValues[`event_${idx}_venue`] = vLabel;
    multiEventValues[`event_${idx}_mapUrl`] = mUrl;
    multiEventValues[`event_${idx}_lunar`] = clean(evt.lunarDate);
    multiEventValues[`event_${idx}_day`] = dParts.day;
    multiEventValues[`event_${idx}_month`] = dParts.month;
    multiEventValues[`event_${idx}_year`] = dParts.year;
    multiEventValues[`event_${idx}_weekday`] = dParts.weekday;
    multiEventValues[`event_${idx}_time`] = dParts.time;
  });

  const custom = Object.fromEntries(
    Object.entries(source.designerFields ?? {})
      .filter(([, value]) => typeof value === "string" && value.trim())
      .map(([key, value]) => [`field:${key}`, value]),
  );
  return {
    groom: clean(source.groomName),
    bride: clean(source.brideName),
    date: clean(source.dateLabel),
    dateIso: clean(source.dateIso),
    venue,
    venue2,
    mapUrl,
    mapUrl2,
    eventTitle: clean(firstEvent?.title) || "LỄ THÀNH HÔN",
    eventVenueName,
    eventAddress,
    eventLunar: clean(firstEvent?.lunarDate),
    eventDay: dateParts.day,
    eventMonth: dateParts.month,
    eventYear: dateParts.year,
    eventWeekday: dateParts.weekday,
    eventTime: dateParts.time,
    guestName: clean(source.guestName),
    salutation: clean(source.salutation),
    hasGifts: source.hasGifts ? "true" : "false",
    hasPhotos: source.hasPhotos ? "true" : "false",
    photoCount: source.photoCount ? String(source.photoCount) : "0",
    hasMusic: source.hasMusic ? "true" : "false",
    musicTitle: clean(source.musicTitle),
    musicUrl: clean(source.musicUrl),
    ...multiEventValues,
    ...custom,
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
