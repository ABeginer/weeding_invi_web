import QRCode from "qrcode";

export type VenueQrThemeId = "cream" | "burgundy" | "olive";

export interface VenueQrThemeConfig {
  id: VenueQrThemeId;
  label: string;
  description: string;
  cardBg: string;
  innerBorder: string;
  accentColor: string;
  titleColor: string;
  mutedColor: string;
  qrDark: string;
  qrLight: string;
}

export const VENUE_QR_THEMES: Record<VenueQrThemeId, VenueQrThemeConfig> = {
  cream: {
    id: "cream",
    label: "Kem tối giản",
    description: "Nền kem ấm hợp mọi mẫu thiệp giấy hiện đại và phong bì trắng ngà.",
    cardBg: "#FAF8F5",
    innerBorder: "#D9CBB5",
    accentColor: "#B89B72",
    titleColor: "#1F1D1A",
    mutedColor: "#6B655E",
    qrDark: "#1F1D1A",
    qrLight: "#FFFFFF",
  },
  burgundy: {
    id: "burgundy",
    label: "Đỏ nhung cổ điển",
    description: "Tông đỏ rượu trang trọng hợp Lễ Vu Quy, Thành Hôn truyền thống.",
    cardBg: "#7A1C24",
    innerBorder: "#D8B98B",
    accentColor: "#E6CDA1",
    titleColor: "#FAF8F5",
    mutedColor: "#EFE5D8",
    qrDark: "#1F1D1A",
    qrLight: "#FFFFFF",
  },
  olive: {
    id: "olive",
    label: "Lá ô liu",
    description: "Sắc xanh ô liu dịu mắt hợp tiệc sân vườn và thiệp cưới thiên nhiên.",
    cardBg: "#F3F5F0",
    innerBorder: "#9CAA94",
    accentColor: "#4E6148",
    titleColor: "#232B21",
    mutedColor: "#546050",
    qrDark: "#232B21",
    qrLight: "#FFFFFF",
  },
};

export interface VenueMapsResolution {
  ok: boolean;
  url: string;
  kind: "url" | "coordinates" | "address" | "empty" | "invalid";
  error?: string;
}

/**
 * Chuẩn hóa link Google Maps, tọa độ (lat, lng) hoặc tên/địa chỉ nhà hàng thành URL chỉ đường an toàn.
 */
export function resolveVenueMapsUrl(rawInput: string): VenueMapsResolution {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      ok: false,
      url: "",
      kind: "empty",
      error: "Nhập tên nhà hàng, địa chỉ hoặc dán link Google Maps để tạo mã QR.",
    };
  }

  // Chặn các scheme nguy hiểm (javascript:, data:, vbscript:...)
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    return {
      ok: false,
      url: "",
      kind: "invalid",
      error: "Chỉ hỗ trợ đường dẫn web bắt đầu bằng https:// hoặc tên địa điểm, tọa độ.",
    };
  }

  // Nếu người dùng dán sẵn URL Google Maps hoặc URL https hợp lệ
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        return {
          ok: false,
          url: "",
          kind: "invalid",
          error: "Đường dẫn không hợp lệ.",
        };
      }
      return {
        ok: true,
        url: parsed.toString(),
        kind: "url",
      };
    } catch {
      return {
        ok: false,
        url: "",
        kind: "invalid",
        error: "Link bản đồ chưa đúng định dạng URL. Hãy kiểm tra lại đường dẫn.",
      };
    }
  }

  // Nếu nhập tọa độ dạng "10.7769, 106.7009"
  const coordMatch = trimmed.match(
    /^(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/,
  );
  if (coordMatch) {
    const lat = Number(coordMatch[1]);
    const lng = Number(coordMatch[2]);
    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      const query = `${lat},${lng}`;
      return {
        ok: true,
        url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
        kind: "coordinates",
      };
    }
  }

  // Địa chỉ hoặc tên nhà hàng văn bản tự do
  return {
    ok: true,
    url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`,
    kind: "address",
  };
}

export interface VenueQrCardOptions {
  mapsUrl: string;
  coupleTitle: string;
  venueName: string;
  eventTime: string;
  themeId: VenueQrThemeId;
}

/**
 * Vẽ thẻ mã QR chỉ đường địa điểm đám cưới khổ đứng 1080×1350px sắc nét trên Canvas 2D
 * để xuất PNG chèn thiệp giấy hoặc gửi qua Zalo.
 */
export async function renderVenueQrCardToCanvas(
  options: VenueQrCardOptions,
): Promise<HTMLCanvasElement> {
  if (typeof window === "undefined") {
    throw new Error("renderVenueQrCardToCanvas chỉ chạy được trên trình duyệt.");
  }

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const theme = VENUE_QR_THEMES[options.themeId] ?? VENUE_QR_THEMES.cream;
  const width = 1080;
  const height = 1350;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Không thể khởi tạo Canvas 2D.");
  }

  // Nền khung thiệp
  ctx.fillStyle = theme.cardBg;
  ctx.fillRect(0, 0, width, height);

  // Viền đôi trang trí
  ctx.strokeStyle = theme.innerBorder;
  ctx.lineWidth = 4;
  ctx.strokeRect(48, 48, width - 96, height - 96);

  ctx.lineWidth = 1.5;
  ctx.strokeRect(66, 66, width - 132, height - 132);

  // Nhãn đầu thẻ
  ctx.textAlign = "center";
  ctx.fillStyle = theme.accentColor;
  ctx.font = "600 26px sans-serif";
  ctx.fillText("BẢN ĐỒ CHỈ ĐƯỜNG ĐỊA ĐIỂM", width / 2, 148);

  // Tên cặp đôi
  const safeCouple = options.coupleTitle.trim() || "Lễ Cưới Của Chúng Tôi";
  ctx.fillStyle = theme.titleColor;
  ctx.font = "600 54px Georgia, serif";
  ctx.fillText(safeCouple.slice(0, 44), width / 2, 224);

  // Đường kẻ mảnh
  ctx.strokeStyle = theme.accentColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 90, 260);
  ctx.lineTo(width / 2 + 90, 260);
  ctx.stroke();

  // Khung trắng lót mã QR (đảm bảo quiet zone chuẩn máy quét)
  const qrBoxSize = 560;
  const qrBoxX = (width - qrBoxSize) / 2;
  const qrBoxY = 310;

  ctx.fillStyle = theme.qrLight;
  ctx.beginPath();
  ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 28);
  ctx.fill();

  ctx.strokeStyle = theme.innerBorder;
  ctx.lineWidth = 2;
  ctx.stroke();

  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, options.mapsUrl, {
    width: 490,
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: theme.qrDark,
      light: theme.qrLight,
    },
  });

  ctx.drawImage(qrCanvas, qrBoxX + 35, qrBoxY + 35, 490, 490);

  // Thông tin địa điểm & giờ đón khách bên dưới QR
  const safeVenue = options.venueName.trim() || "Nhà hàng Tiệc cưới";
  ctx.fillStyle = theme.titleColor;
  ctx.font = "600 34px sans-serif";
  ctx.fillText(safeVenue.slice(0, 46), width / 2, 956);

  if (options.eventTime.trim()) {
    ctx.fillStyle = theme.mutedColor;
    ctx.font = "500 28px sans-serif";
    ctx.fillText(options.eventTime.trim().slice(0, 54), width / 2, 1012);
  }

  // Chỉ dẫn quét QR cuối khung
  ctx.fillStyle = theme.accentColor;
  ctx.font = "600 24px sans-serif";
  ctx.fillText("Quét mã bằng Camera hoặc Zalo để mở Google Maps", width / 2, 1180);

  return canvas;
}
