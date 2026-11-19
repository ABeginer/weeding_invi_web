import QRCode from "qrcode";

export interface BoardingPassData {
  guestName: string;
  slug: string;
  tableNumber?: string | null;
  plusOnes?: number;
  diet?: string | null;
  coupleTitle?: string;
  weddingDate?: string;
  venueName?: string;
  venueTime?: string;
}

/**
 * Kiểm tra xem người dùng có đang duyệt trên in-app browser (Zalo, Messenger, Facebook)
 * hoặc iOS Safari nơi thẻ <a download> thường bị chặn tự động tải file hay không.
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

/**
 * Sinh chuỗi định dạng ngày cho góc trên của Boarding Pass (ví dụ: "20 · 03 · 2027")
 */
function formatBoardingPassDate(rawDate?: string): string {
  if (!rawDate) return "";
  const match = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[3]} · ${match[2]} · ${match[1]}`;
  }
  return rawDate;
}

/**
 * Vẽ vé Boarding Pass phong cách Modern Editorial Luxury bằng HTML5 Canvas 2D
 * Render ở độ phân giải 2x Retina (750 x 1120 px).
 */
export async function renderBoardingPassToCanvas(
  data: BoardingPassData,
): Promise<HTMLCanvasElement> {
  if (typeof window === "undefined") {
    throw new Error("renderBoardingPassToCanvas chỉ chạy trên client-side");
  }

  // Chờ font chữ tải xong để không bị vỡ font tiếng Việt có dấu
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const canvas = document.createElement("canvas");
  const width = 750;
  const height = 1120;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Không thể tạo Canvas 2D context");

  const cornerRadius = 36;
  const cardX = 20;
  const cardY = 20;
  const cardW = width - 40;
  const cardH = height - 40;

  // 1. Vẽ nền bo góc toàn vé (Card container #FAF8F5)
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, cornerRadius);
  ctx.fillStyle = "#FAF8F5";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#E8E2D9";
  ctx.stroke();
  ctx.clip(); // Giới hạn các lớp vẽ nằm trong khung thẻ

  // 2. Top Header Strip (#7A1C24 - Deep Burgundy)
  const headerHeight = 96;
  ctx.fillStyle = "#7A1C24";
  ctx.fillRect(cardX, cardY, cardW, headerHeight);

  // Text header bên trái: "THIỆP MỜI · BOARDING PASS"
  ctx.fillStyle = "#B89B72";
  ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.letterSpacing = "2px";
  ctx.textBaseline = "middle";
  ctx.fillText("THIỆP MỜI · BOARDING PASS", cardX + 36, cardY + headerHeight / 2);

  // Text header bên phải: Date hoặc Couple
  const dateFormatted = formatBoardingPassDate(data.weddingDate);
  const rightHeaderText = dateFormatted || data.coupleTitle || "";
  if (rightHeaderText) {
    ctx.fillStyle = "#FAF8F5";
    ctx.font = "500 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(rightHeaderText, cardX + cardW - 36, cardY + headerHeight / 2);
  }

  // 3. Main Guest Details Section
  ctx.textAlign = "left";
  const mainStartY = cardY + headerHeight + 50;

  // Nhãn phụ
  ctx.fillStyle = "#6B655E";
  ctx.font = "600 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.letterSpacing = "1.5px";
  ctx.fillText("KÍNH MỜI", cardX + 44, mainStartY);

  // Tên khách mời (Serif sang trọng, ngắt dòng nếu quá dài)
  ctx.fillStyle = "#1F1D1A";
  ctx.font = "bold 44px 'Playfair Display', Georgia, 'Times New Roman', serif";
  ctx.letterSpacing = "0px";

  const guestName = data.guestName || "Quý khách";
  // Đo và vẽ tên
  const maxNameWidth = cardW - 88;
  if (ctx.measureText(guestName).width > maxNameWidth) {
    ctx.font = "bold 34px 'Playfair Display', Georgia, 'Times New Roman', serif";
  }
  ctx.fillText(guestName, cardX + 44, mainStartY + 46);

  // Cặp đôi / Tiệc cưới
  if (data.coupleTitle) {
    ctx.fillStyle = "#6B655E";
    ctx.font = "400 20px 'Playfair Display', Georgia, serif";
    ctx.fillText(`Tham dự lễ cưới cùng ${data.coupleTitle}`, cardX + 44, mainStartY + 88);
  }

  // Khung 2 cột Metadata (SỐ BÀN | THAM DỰ & THỰC ĐƠN)
  const metaBoxY = mainStartY + 140;
  const metaBoxW = cardW - 88;
  const metaBoxH = 160;

  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.roundRect(cardX + 44, metaBoxY, metaBoxW, metaBoxH, 20);
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#E8E2D9";
  ctx.stroke();

  // Đường chia đôi 2 cột
  const colDividerX = cardX + 44 + metaBoxW / 2;
  ctx.beginPath();
  ctx.moveTo(colDividerX, metaBoxY + 20);
  ctx.lineTo(colDividerX, metaBoxY + metaBoxH - 20);
  ctx.strokeStyle = "#E8E2D9";
  ctx.stroke();

  // Cột 1: SỐ BÀN
  ctx.fillStyle = "#6B655E";
  ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.letterSpacing = "1.5px";
  ctx.fillText("SỐ BÀN", cardX + 68, metaBoxY + 44);

  const rawTable = (data.tableNumber || "").trim();
  if (rawTable) {
    const tableDisplay = /^bàn\s*/i.test(rawTable)
      ? rawTable.toUpperCase()
      : `BÀN ${rawTable.toUpperCase()}`;
    ctx.fillStyle = "#7A1C24";
    ctx.font = "bold 38px 'Playfair Display', Georgia, serif";
    ctx.letterSpacing = "0px";
    ctx.fillText(tableDisplay, cardX + 68, metaBoxY + 98);
  } else {
    ctx.fillStyle = "#8A847C";
    ctx.font = "italic 22px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.letterSpacing = "0px";
    ctx.fillText("Đang sắp xếp", cardX + 68, metaBoxY + 95);
  }

  // Cột 2: THAM DỰ & THỰC ĐƠN
  ctx.fillStyle = "#6B655E";
  ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.letterSpacing = "1.5px";
  ctx.fillText("THAM DỰ & THỰC ĐƠN", colDividerX + 24, metaBoxY + 44);

  const headcount = 1 + Math.max(0, data.plusOnes || 0);
  const dietText = data.diet === "veg" ? "Ăn chay" : "Ăn mặn";
  ctx.fillStyle = "#1F1D1A";
  ctx.font = "600 24px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.letterSpacing = "0px";
  ctx.fillText(`${headcount} người · ${dietText}`, colDividerX + 24, metaBoxY + 95);

  // Thông tin địa điểm & Thời gian
  const venueY = metaBoxY + metaBoxH + 46;
  const timeInfo = data.venueTime || "Hân hạnh đón tiếp";
  const venueInfo = data.venueName ? `${timeInfo} · ${data.venueName}` : timeInfo;
  ctx.fillStyle = "#6B655E";
  ctx.font = "500 20px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(`📍 ${venueInfo}`, cardX + 44, venueY);

  // 4. Perforated Ticket Divider (Vết răng cưa xé vé)
  const dividerY = height - 310;

  // Đường nét đứt ngang
  ctx.beginPath();
  ctx.setLineDash([12, 10]);
  ctx.moveTo(cardX + 32, dividerY);
  ctx.lineTo(cardX + cardW - 32, dividerY);
  ctx.strokeStyle = "#D8D0C5";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.setLineDash([]); // Reset line dash

  // 5. Bottom Check-in Stub (#F4EFEA / Soft Linen)
  ctx.fillStyle = "#F4EFEA";
  ctx.fillRect(cardX, dividerY + 1.5, cardW, height - cardY - dividerY - 1.5);

  // Lời dặn check-in bên trái
  const stubContentY = dividerY + 65;
  ctx.fillStyle = "#1F1D1A";
  ctx.font = "bold 20px 'Playfair Display', Georgia, serif";
  ctx.fillText("Mã Check-in Bàn Tiệc", cardX + 44, stubContentY);

  ctx.fillStyle = "#6B655E";
  ctx.font = "400 16px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("Xuất trình mã này tại bàn lễ tân", cardX + 44, stubContentY + 36);
  ctx.fillText("để check-in & hướng dẫn vào bàn.", cardX + 44, stubContentY + 64);

  // Guest Code
  const guestCode = data.slug.slice(0, 8).toUpperCase();
  ctx.fillStyle = "#7A1C24";
  ctx.font = "bold 18px 'Courier New', monospace";
  ctx.letterSpacing = "1.5px";
  ctx.fillText(`MÃ VÉ: #${guestCode}`, cardX + 44, stubContentY + 112);

  // Sinh và vẽ Check-in QR Code (góc phải cuống vé)
  const qrSize = 170;
  const qrX = cardX + cardW - qrSize - 44;
  const qrY = dividerY + 45;

  const checkinUrl = `${window.location.origin}/m/${data.slug}/tra-cuu-ban`;
  const qrDataUrl = await QRCode.toDataURL(checkinUrl, {
    width: qrSize,
    margin: 1,
    color: { dark: "#1F1D1A", light: "#FFFFFF" },
  });

  const qrImage = new Image();
  await new Promise<void>((resolve, reject) => {
    qrImage.onload = () => resolve();
    qrImage.onerror = reject;
    qrImage.src = qrDataUrl;
  });

  // Nền trắng viền bo góc cho QR
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.roundRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 16);
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#E8E2D9";
  ctx.stroke();

  ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

  // Kết thúc vẽ nội dung
  ctx.restore();

  // 6. Vẽ hai khía bán nguyệt xé vé bên mép trái & phải (Perforated Notches)
  const notchRadius = 24;
  ctx.fillStyle = "#FAF8F5"; // Trùng màu nền trang
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#E8E2D9";

  // Khía mép trái
  ctx.beginPath();
  ctx.arc(cardX, dividerY, notchRadius, -Math.PI / 2, Math.PI / 2, false);
  ctx.fill();
  ctx.stroke();

  // Khía mép phải
  ctx.beginPath();
  ctx.arc(cardX + cardW, dividerY, notchRadius, Math.PI / 2, (3 * Math.PI) / 2, false);
  ctx.fill();
  ctx.stroke();

  return canvas;
}

/**
 * Xuất ảnh vé Boarding Pass dạng PNG dataURL
 */
export async function exportBoardingPassToPngDataUrl(
  data: BoardingPassData,
): Promise<string> {
  const canvas = await renderBoardingPassToCanvas(data);
  return canvas.toDataURL("image/png");
}

/**
 * Xử lý tải vé về máy với fallback thông minh cho Zalo, Messenger, iOS Safari
 */
export async function downloadBoardingPass(
  data: BoardingPassData,
): Promise<{ success: boolean; dataUrl: string; needsFallbackModal: boolean }> {
  const dataUrl = await exportBoardingPassToPngDataUrl(data);
  const fileName = `ve-moi-cuoi-${data.slug.slice(0, 8)}.png`;

  const needsFallbackModal = isInAppBrowserOrIos();

  if (!needsFallbackModal) {
    try {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return { success: true, dataUrl, needsFallbackModal: false };
    } catch {
      return { success: true, dataUrl, needsFallbackModal: true };
    }
  }

  // Trên Zalo / iOS Safari: Trả về needsFallbackModal = true để UI hiển thị modal hướng dẫn nhấn giữ lưu ảnh
  return { success: true, dataUrl, needsFallbackModal: true };
}
