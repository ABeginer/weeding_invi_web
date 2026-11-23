import type { WeddingEvent, TemplateData } from "./wedding-types";

export interface LegacyEventFallbackData {
  date?: string;
  venueName?: string;
  venueAddress?: string;
  mapDirectionsUrl?: string | null;
  mapEmbedUrl?: string | null;
  title?: string;
  lunarDate?: string;
}

export function createFallbackEvent(data?: LegacyEventFallbackData): WeddingEvent {
  const startsAt = data?.date || "2027-03-20T10:00:00+07:00";
  return {
    id: "default-event",
    title: data?.title || "LỄ THÀNH HÔN",
    startsAt,
    lunarDate: data?.lunarDate || "",
    venueName: data?.venueName || "Trung tâm tiệc cưới",
    venueAddress: data?.venueAddress || "TP. Hồ Chí Minh",
    mapEmbedUrl: data?.mapEmbedUrl || null,
    mapDirectionsUrl: data?.mapDirectionsUrl || null,
    position: 0,
  };
}

/**
 * Lọc danh sách sự kiện mà khách được phép xem:
 * - Nếu guestEventIds là null, undefined, "all", hoặc mảng rỗng []:
 *   Khách được xem TẤT CẢ các sự kiện (sorted theo position).
 * - Nếu guestEventIds là mảng ID:
 *   Lọc chính xác các sự kiện có ID khớp (so sánh String(id)), giữ nguyên thứ tự cấu hình.
 * - Tương thích dữ liệu cũ: Chỉ khi events rỗng/thiếu hoàn toàn mới tạo 1 sự kiện fallback.
 */
export function getVisibleEventsForGuest(
  events: WeddingEvent[] | undefined | null,
  guestEventIds?: (string | number)[] | string | null,
  fallbackData?: LegacyEventFallbackData,
): WeddingEvent[] {
  const sorted = events && events.length > 0
    ? [...events].sort((a, b) => a.position - b.position)
    : [];

  if (sorted.length === 0) {
    return [createFallbackEvent(fallbackData)];
  }

  // Khách được chọn "Tất cả lễ"
  if (
    guestEventIds == null ||
    guestEventIds === "all" ||
    (Array.isArray(guestEventIds) && guestEventIds.length === 0)
  ) {
    return sorted;
  }

  // Khách được gán một số ID lễ cụ thể
  const idArray = Array.isArray(guestEventIds) ? guestEventIds : [guestEventIds];
  const targetIdSet = new Set(idArray.map((id) => String(id)));

  const filtered = sorted.filter((evt) => targetIdSet.has(String(evt.id)));

  // Nếu đã lọc nhưng có kết quả => trả về chính xác danh sách được gán (KHÔNG fallback về events[0])
  if (filtered.length > 0) {
    return filtered;
  }

  // Trường hợp dự phòng nếu ID gán không còn tồn tại trong DB, trả về toàn bộ
  return sorted;
}

/**
 * Helper dùng trong Template component để lấy danh sách lễ hiển thị từ TemplateData.
 * Đảm bảo luôn trả về ít nhất 1 sự kiện hợp lệ (không bao giờ trả về mảng rỗng).
 */
export function getVisibleEvents(data: TemplateData): WeddingEvent[] {
  if (data.events && data.events.length > 0) {
    return [...data.events].sort((a, b) => a.position - b.position);
  }
  return [
    createFallbackEvent({
      date: data.date,
      title: data.ui?.eventsTitle || "LỄ THÀNH HÔN",
      venueName: data.ui?.eventsTitle || "Trung tâm tiệc cưới",
      venueAddress: "TP. Hồ Chí Minh",
    }),
  ];
}

/**
 * Lấy buổi lễ gần nhất sắp diễn ra (hoặc buổi lễ đầu tiên nếu tất cả đã qua hoặc chưa tới)
 * dùng cho Countdown timer và hiển thị ngày nổi bật.
 */
export function getNearestUpcomingEvent(
  events: WeddingEvent[],
  fallbackDate?: string,
): WeddingEvent {
  if (!events || events.length === 0) {
    return createFallbackEvent({ date: fallbackDate });
  }

  const now = Date.now();
  // Tìm sự kiện đầu tiên trong tương lai
  const upcoming = events.find((evt) => {
    const time = Date.parse(evt.startsAt);
    return !Number.isNaN(time) && time >= now;
  });

  return upcoming ?? events[0];
}

/**
 * Tạo link Google Maps dẫn đường cho một sự kiện (nếu chưa có mapDirectionsUrl thì search theo tên + địa chỉ)
 */
export function getEventDirectionsUrl(event: WeddingEvent): string {
  if (event.mapDirectionsUrl && event.mapDirectionsUrl.trim()) {
    return event.mapDirectionsUrl.trim();
  }
  const query = [event.venueName, event.venueAddress].filter(Boolean).join(" ");
  if (!query) return "#";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
