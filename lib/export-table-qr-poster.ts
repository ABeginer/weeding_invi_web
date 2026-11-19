import QRCode from "qrcode";

export type TableStandeeSize = "a6" | "a5";
export type TableStandeeTheme = "ivory" | "burgundy";

/**
 * Kiểm tra xem người dùng có đang duyệt trên in-app browser (Zalo, Messenger) hoặc iOS Safari
 */
export function isInAppBrowserOrIos(customUa?: string): boolean {
  const ua = (
    customUa ??
    (typeof navigator !== "undefined" ? (navigator.userAgent || navigator.vendor || "") : "")
  ).toLowerCase();
  if (!ua) return false;
  const isZalo = ua.includes("zalo");
  const isMessenger = ua.includes("fbav") || ua.includes("fb_iab") || ua.includes("messenger");
  const isIos = /iphone|ipad|ipod/.test(ua);
  return isZalo || isMessenger || isIos;
}

export interface TableQrPosterOptions {
  slug: string;
  coupleTitle: string;
  weddingDate?: string;
  size?: TableStandeeSize;
  theme?: TableStandeeTheme;
  customUrl?: string;
}

export const STANDEE_DIMENSIONS: Record<
  TableStandeeSize,
  { width: number; height: number; label: string; sublabel: string }
> = {
  a6: {
    width: 1240,
    height: 1748,
    label: "Khổ A6 (Để bàn gọn)",
    sublabel: "10.5 × 14.8 cm · 300 DPI",
  },
  a5: {
    width: 1748,
    height: 2480,
    label: "Khổ A5 (Nổi bật)",
    sublabel: "14.8 × 21.0 cm · 300 DPI",
  },
};

/**
 * Định dạng ngày cưới hiển thị trên bảng Standee (vd: "20 · 03 · 2027")
 */
function formatStandeeDate(rawDate?: string): string {
  if (!rawDate) return "";
  const match = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[3]} · ${match[2]} · ${match[1]}`;
  }
  return rawDate;
}

/**
 * Render Bảng QR Để Bàn (Table QR Standee) chất lượng in 300 DPI bằng HTML5 Canvas 2D
 */
export async function renderTableQrPosterToCanvas(
  options: TableQrPosterOptions,
): Promise<HTMLCanvasElement> {
  if (typeof window === "undefined") {
    throw new Error("renderTableQrPosterToCanvas chỉ hỗ trợ chạy trên trình duyệt (client-side)");
  }

  // Đảm bảo font chữ (Playfair Display / Plus Jakarta Sans) đã sẵn sàng
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const size = options.size || "a6";
  const theme = options.theme || "ivory";
  const { width, height } = STANDEE_DIMENSIONS[size];

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Không thể khởi tạo Canvas 2D context");

  const isBurgundy = theme === "burgundy";
  const bgColor = isBurgundy ? "#7A1C24" : "#FAF8F5";
  const goldColor = "#B89B72";
  const textColor = isBurgundy ? "#FAF8F5" : "#1F1D1A";
  const mutedTextColor = isBurgundy ? "rgba(250, 248, 245, 0.78)" : "#6B655E";
  const scaleRatio = width / 1240; // Tỉ lệ tỉ đối so với khổ A6 chuẩn

  // 1. Tô màu nền toàn bộ bảng
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // 2. Vẽ khung viền kép hoàng gia (Double Hairline Frame)
  const outerMargin = 56 * scaleRatio;
  const innerMargin = 72 * scaleRatio;
  const cornerRadius = 32 * scaleRatio;

  // Viền ngoài (đường thanh)
  ctx.strokeStyle = goldColor;
  ctx.lineWidth = 2.5 * scaleRatio;
  ctx.beginPath();
  ctx.roundRect(
    outerMargin,
    outerMargin,
    width - outerMargin * 2,
    height - outerMargin * 2,
    cornerRadius,
  );
  ctx.stroke();

  // Viền trong (đường mảnh)
  ctx.lineWidth = 1.2 * scaleRatio;
  ctx.beginPath();
  ctx.roundRect(
    innerMargin,
    innerMargin,
    width - innerMargin * 2,
    height - innerMargin * 2,
    cornerRadius - 12 * scaleRatio,
  );
  ctx.stroke();

  // Họa tiết 4 góc tinh tế
  const cornerMarkSize = 16 * scaleRatio;
  const cornerOffsets = [
    [innerMargin + 8 * scaleRatio, innerMargin + 8 * scaleRatio],
    [width - innerMargin - 8 * scaleRatio, innerMargin + 8 * scaleRatio],
    [innerMargin + 8 * scaleRatio, height - innerMargin - 8 * scaleRatio],
    [width - innerMargin - 8 * scaleRatio, height - innerMargin - 8 * scaleRatio],
  ];
  ctx.fillStyle = goldColor;
  for (const [cx, cy] of cornerOffsets) {
    ctx.beginPath();
    ctx.arc(cx, cy, 3 * scaleRatio, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Top Eyebrow: CHIA SẺ KHOẢNH KHẮC NGÀY VUI
  const topTextY = 170 * scaleRatio;
  ctx.fillStyle = goldColor;
  ctx.font = `bold ${Math.round(22 * scaleRatio)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("CHIA SẺ KHOẢNH KHẮC NGÀY VUI", width / 2, topTextY);

  // Đường gạch mảnh trang trí hai bên eyebrow
  const eyebrowLineWidth = 100 * scaleRatio;
  const eyebrowLineY = topTextY;
  ctx.strokeStyle = goldColor;
  ctx.lineWidth = 1 * scaleRatio;

  ctx.beginPath();
  ctx.moveTo(width / 2 - 270 * scaleRatio, eyebrowLineY);
  ctx.lineTo(width / 2 - 270 * scaleRatio - eyebrowLineWidth, eyebrowLineY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(width / 2 + 270 * scaleRatio, eyebrowLineY);
  ctx.lineTo(width / 2 + 270 * scaleRatio + eyebrowLineWidth, eyebrowLineY);
  ctx.stroke();

  // 4. Tên cô dâu chú rể (Editorial Serif Heading)
  const coupleY = 270 * scaleRatio;
  ctx.fillStyle = textColor;
  ctx.font = `bold ${Math.round(62 * scaleRatio)}px 'Playfair Display', Georgia, serif`;
  ctx.fillText(options.coupleTitle || "Minh Khôi & Thảo Nguyên", width / 2, coupleY);

  // 5. Ngày cưới (Date)
  const formattedDate = formatStandeeDate(options.weddingDate);
  if (formattedDate) {
    const dateY = 340 * scaleRatio;
    ctx.fillStyle = mutedTextColor;
    ctx.font = `500 ${Math.round(24 * scaleRatio)}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillText(formattedDate, width / 2, dateY);
  }

  // 6. Centerpiece: Hộp chứa mã QR (High-contrast QR Box with Quiet Zone)
  const targetUrl =
    options.customUrl ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/a/${options.slug}`
      : `https://inviwedd.com/a/${options.slug}`);

  const qrBoxSize = 580 * scaleRatio;
  const qrBoxX = (width - qrBoxSize) / 2;
  const qrBoxY = 400 * scaleRatio;
  const qrInnerMargin = 30 * scaleRatio;
  const qrCodeSize = qrBoxSize - qrInnerMargin * 2;

  // Hộp nền trắng cho mã QR để camera điện thoại luôn bắt nét tức thì
  ctx.save();
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 28 * scaleRatio);
  ctx.fill();
  ctx.lineWidth = 3 * scaleRatio;
  ctx.strokeStyle = isBurgundy ? goldColor : "#E8E2D9";
  ctx.stroke();

  // Đổ bóng nhẹ cho hộp QR
  ctx.shadowColor = "rgba(0, 0, 0, 0.08)";
  ctx.shadowBlur = 24 * scaleRatio;
  ctx.shadowOffsetY = 8 * scaleRatio;
  ctx.restore();

  // Sinh mã QR với độ tương phản cao và quiet zone bảo vệ
  const qrDataUrl = await QRCode.toDataURL(targetUrl, {
    width: Math.round(qrCodeSize),
    margin: 1,
    color: {
      dark: "#1F1D1A",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "H",
  });

  const qrImg = new Image();
  await new Promise<void>((resolve, reject) => {
    qrImg.onload = () => resolve();
    qrImg.onerror = reject;
    qrImg.src = qrDataUrl;
  });

  ctx.drawImage(
    qrImg,
    qrBoxX + qrInnerMargin,
    qrBoxY + qrInnerMargin,
    qrCodeSize,
    qrCodeSize,
  );

  // Nhãn phụ dưới QR
  const scanHintY = qrBoxY + qrBoxSize + 48 * scaleRatio;
  ctx.fillStyle = isBurgundy ? goldColor : "#7A1C24";
  ctx.font = `bold ${Math.round(26 * scaleRatio)}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("QUÉT QR ĐỂ GỬI ẢNH LÊN MÀN HÌNH TIỆC", width / 2, scanHintY);

  // 7. Khung 3 bước hướng dẫn ngắn gọn cho khách mời (3-Step Micro-Guide)
  const guideCardW = width - (innerMargin + 48 * scaleRatio) * 2;
  const guideCardH = 340 * scaleRatio;
  const guideCardX = (width - guideCardW) / 2;
  const guideCardY = height - innerMargin - guideCardH - 50 * scaleRatio;

  // Nền card hướng dẫn
  ctx.fillStyle = isBurgundy ? "rgba(0, 0, 0, 0.22)" : "#F4EFEA";
  ctx.beginPath();
  ctx.roundRect(guideCardX, guideCardY, guideCardW, guideCardH, 20 * scaleRatio);
  ctx.fill();
  ctx.lineWidth = 1.5 * scaleRatio;
  ctx.strokeStyle = isBurgundy ? "rgba(184, 155, 114, 0.4)" : "#E8E2D9";
  ctx.stroke();

  // Tiêu đề card hướng dẫn
  const guideTitleY = guideCardY + 45 * scaleRatio;
  ctx.fillStyle = goldColor;
  ctx.font = `bold ${Math.round(18 * scaleRatio)}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.fillText("3 BƯỚC THAM GIA ĐƠN GIẢN", width / 2, guideTitleY);

  // 3 dòng hướng dẫn
  const steps = [
    "1. Mở máy ảnh điện thoại hoặc ứng dụng Zalo",
    "2. Hướng vào mã QR & bấm đường link hiện ra",
    "3. Chọn ảnh đẹp tại tiệc để chiếu lên màn hình",
  ];

  const stepStartY = guideTitleY + 55 * scaleRatio;
  const stepGap = 70 * scaleRatio;

  ctx.font = `500 ${Math.round(21 * scaleRatio)}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";

  steps.forEach((step, idx) => {
    ctx.fillText(step, width / 2, stepStartY + idx * stepGap);
  });

  // 8. Chân trang (Footer Watermark)
  const footerY = height - innerMargin - 20 * scaleRatio;
  ctx.fillStyle = isBurgundy ? "rgba(250, 248, 245, 0.55)" : "#8E8880";
  ctx.font = `400 ${Math.round(15 * scaleRatio)}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.fillText("inviwedd.com · Nền tảng thiệp cưới điện tử tinh tế", width / 2, footerY);

  return canvas;
}

/**
 * Xuất Standee dạng PNG Data URL
 */
export async function exportTableQrPosterToPngDataUrl(
  options: TableQrPosterOptions,
): Promise<string> {
  const canvas = await renderTableQrPosterToCanvas(options);
  return canvas.toDataURL("image/png");
}

/**
 * Tải file Standee về máy với định dạng chuẩn in ấn (300 DPI PNG)
 */
export async function downloadTableQrPoster(
  options: TableQrPosterOptions,
): Promise<{ success: boolean; dataUrl: string; needsFallbackModal: boolean; fileName: string }> {
  const dataUrl = await exportTableQrPosterToPngDataUrl(options);
  const size = options.size || "a6";
  const fileName = `inviwedd-bang-qr-de-ban-${options.slug}-${size}.png`;

  const needsFallbackModal = isInAppBrowserOrIos();

  if (!needsFallbackModal) {
    try {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return { success: true, dataUrl, needsFallbackModal: false, fileName };
    } catch {
      return { success: true, dataUrl, needsFallbackModal: true, fileName };
    }
  }

  return { success: true, dataUrl, needsFallbackModal: true, fileName };
}
