export type CardAspectId = "story-9-16" | "feed-4-5";

export type CardThemeId = "cream-gold" | "crimson-classic" | "olive-garden";

export interface CardAspectSpec {
  id: CardAspectId;
  label: string;
  hint: string;
  width: number;
  height: number;
  previewAspectClass: string;
}

export interface CardThemeSpec {
  id: CardThemeId;
  label: string;
  bgStart: string;
  bgEnd: string;
  accent: string;
  textPrimary: string;
  textMuted: string;
  pillBg: string;
  pillText: string;
}

export interface CountdownStatus {
  kind: "upcoming" | "today" | "past" | "invalid";
  daysDiff: number;
  badgeText: string;
  subLabel: string;
}

export interface SaveTheDateConfig {
  groomName: string;
  brideName: string;
  weddingDate: string; // YYYY-MM-DD
  venueCity: string;
  eyebrowText: string;
  aspect: CardAspectId;
  theme: CardThemeId;
}

export const CARD_ASPECTS: Readonly<Record<CardAspectId, CardAspectSpec>> = {
  "story-9-16": {
    id: "story-9-16",
    label: "Story 9:16",
    hint: "Instagram, Facebook Story, TikTok (1080×1920)",
    width: 1080,
    height: 1920,
    previewAspectClass: "aspect-[9/16]",
  },
  "feed-4-5": {
    id: "feed-4-5",
    label: "Bài đăng 4:5",
    hint: "Facebook, Threads Feed sắc nét (1080×1350)",
    width: 1080,
    height: 1350,
    previewAspectClass: "aspect-[4/5]",
  },
};

export const CARD_THEMES: Readonly<Record<CardThemeId, CardThemeSpec>> = {
  "cream-gold": {
    id: "cream-gold",
    label: "Kem & Vàng champagne",
    bgStart: "#FBF8F3",
    bgEnd: "#EDE3D2",
    accent: "#B89B72",
    textPrimary: "#1F1D1A",
    textMuted: "#6B655E",
    pillBg: "#1F1D1A",
    pillText: "#FAF8F5",
  },
  "crimson-classic": {
    id: "crimson-classic",
    label: "Đỏ son truyền thống",
    bgStart: "#7A1C24",
    bgEnd: "#4A0E14",
    accent: "#E3C37A",
    textPrimary: "#FFFDF9",
    textMuted: "#EADDD7",
    pillBg: "#E3C37A",
    pillText: "#2C1810",
  },
  "olive-garden": {
    id: "olive-garden",
    label: "Xanh ô liu sân vườn",
    bgStart: "#2C3B32",
    bgEnd: "#1B251F",
    accent: "#D8C7A8",
    textPrimary: "#FAF8F3",
    textMuted: "#D5DCD6",
    pillBg: "#FAF8F3",
    pillText: "#1B251F",
  },
};

const VN_WEEKDAYS = [
  "Chủ Nhật",
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
] as const;

export function getTodayVietnamIso(now: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now);
}

export function getDefaultUpcomingWeddingIso(daysAhead = 45, now: Date = new Date()): string {
  const todayIso = getTodayVietnamIso(now);
  const parts = parseIsoDateParts(todayIso);
  if (!parts) return "2026-12-20";
  const utc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + daysAhead));
  const y = utc.getUTCFullYear();
  const m = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const d = String(utc.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseIsoDateParts(
  iso: string,
): { year: number; month: number; day: number } | null {
  const match = iso.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

export function computeWeddingCountdown(
  weddingDateIso: string,
  referenceDateIso: string = getTodayVietnamIso(),
): CountdownStatus {
  const target = parseIsoDateParts(weddingDateIso);
  const ref = parseIsoDateParts(referenceDateIso);
  if (!target || !ref) {
    return {
      kind: "invalid",
      daysDiff: 0,
      badgeText: "Save the Date",
      subLabel: "Chọn ngày cưới để đếm ngược",
    };
  }

  const targetMs = Date.UTC(target.year, target.month - 1, target.day);
  const refMs = Date.UTC(ref.year, ref.month - 1, ref.day);
  const daysDiff = Math.round((targetMs - refMs) / 86_400_000);

  if (daysDiff > 0) {
    return {
      kind: "upcoming",
      daysDiff,
      badgeText: `CÒN ${daysDiff} NGÀY NỮA`,
      subLabel: "Đếm ngược tới ngày chung đôi",
    };
  }
  if (daysDiff === 0) {
    return {
      kind: "today",
      daysDiff: 0,
      badgeText: "HÔM NAY LÀ NGÀY CƯỚI",
      subLabel: "Chính thức về chung một nhà",
    };
  }
  const pastDays = Math.abs(daysDiff);
  return {
    kind: "past",
    daysDiff: pastDays,
    badgeText: `KỶ NIỆM ${pastDays} NGÀY BÊN NHAU`,
    subLabel: "Ngày chung đôi đáng nhớ",
  };
}

export function formatWeddingDateLine(weddingDateIso: string): string {
  const parts = parseIsoDateParts(weddingDateIso);
  if (!parts) return "Chưa chọn ngày cưới";
  const utc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  const weekday = VN_WEEKDAYS[utc.getUTCDay()];
  const dd = String(parts.day).padStart(2, "0");
  const mm = String(parts.month).padStart(2, "0");
  return `${weekday} · ${dd}.${mm}.${parts.year}`;
}

export function buildSaveTheDateCaption(
  config: SaveTheDateConfig,
  countdown: CountdownStatus,
): string {
  const groom = config.groomName.trim() || "Chú rể";
  const bride = config.brideName.trim() || "Cô dâu";
  const dateLine = formatWeddingDateLine(config.weddingDate);
  const city = config.venueCity.trim();
  const whereClause = city ? ` tại ${city}` : "";

  if (countdown.kind === "upcoming") {
    return [
      `Save the Date · Còn ${countdown.daysDiff} ngày nữa tới ngày vui của ${groom} & ${bride}!`,
      `${dateLine}${whereClause}.`,
      `Bạn bè giữ lịch trống cuối tuần để tụi mình gửi thiệp mời chính thức nha.`,
    ].join("\n");
  }

  if (countdown.kind === "today") {
    return [
      `Hôm nay là ngày chung đôi của ${groom} & ${bride} (${dateLine}${whereClause}).`,
      `Cảm ơn gia đình và bạn bè đã tới chung vui cùng hai tụi mình!`,
    ].join("\n");
  }

  return [
    `${groom} & ${bride} · ${dateLine}${whereClause}.`,
    `Lưu giữ một cột mốc thật đẹp cùng gia đình và những người bạn thương quý.`,
  ].join("\n");
}

export function drawSaveTheDateCard(
  ctx: CanvasRenderingContext2D,
  config: SaveTheDateConfig,
  countdown: CountdownStatus,
  photo: HTMLImageElement | null,
): void {
  const aspect = CARD_ASPECTS[config.aspect];
  const theme = CARD_THEMES[config.theme];
  const w = aspect.width;
  const h = aspect.height;

  ctx.clearRect(0, 0, w, h);

  // Base gradient background
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, theme.bgStart);
  grad.addColorStop(1, theme.bgEnd);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const hasPhoto = Boolean(photo && photo.naturalWidth > 0 && photo.naturalHeight > 0);

  if (hasPhoto && photo) {
    const padX = Math.round(w * 0.065);
    const topY = Math.round(h * 0.14);
    const frameW = w - padX * 2;
    const frameH =
      config.aspect === "story-9-16" ? Math.round(h * 0.52) : Math.round(h * 0.5);
    const radius = 36;

    ctx.save();
    roundedRectPath(ctx, padX, topY, frameW, frameH, radius);
    ctx.clip();

    const imgRatio = photo.naturalWidth / photo.naturalHeight;
    const boxRatio = frameW / frameH;
    let drawW = frameW;
    let drawH = frameH;
    let drawX = padX;
    let drawY = topY;

    if (imgRatio > boxRatio) {
      drawH = frameH;
      drawW = frameH * imgRatio;
      drawX = padX - (drawW - frameW) / 2;
    } else {
      drawW = frameW;
      drawH = frameW / imgRatio;
      drawY = topY - (drawH - frameH) / 2;
    }

    ctx.drawImage(photo, drawX, drawY, drawW, drawH);

    // Soft bottom vignette for contrast
    const photoOverlay = ctx.createLinearGradient(0, topY + frameH * 0.58, 0, topY + frameH);
    photoOverlay.addColorStop(0, "rgba(0,0,0,0)");
    photoOverlay.addColorStop(1, "rgba(0,0,0,0.42)");
    ctx.fillStyle = photoOverlay;
    ctx.fillRect(padX, topY, frameW, frameH);
    ctx.restore();

    // Inner subtle border around photo
    ctx.save();
    roundedRectPath(ctx, padX, topY, frameW, frameH, radius);
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  } else {
    // Decorative editorial frame when user generates without uploading photo
    const inset = 44;
    ctx.save();
    roundedRectPath(ctx, inset, inset, w - inset * 2, h - inset * 2, 28);
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 3;
    ctx.stroke();

    const innerInset = 60;
    roundedRectPath(
      ctx,
      innerInset,
      innerInset,
      w - innerInset * 2,
      h - innerInset * 2,
      20,
    );
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  // Top eyebrow
  ctx.textAlign = "center";
  ctx.fillStyle = theme.accent;
  ctx.font = '600 26px "Be Vietnam Pro", ui-sans-serif, system-ui, sans-serif';
  const eyebrow = (config.eyebrowText.trim() || "SAVE THE DATE").toUpperCase();
  ctx.fillText(eyebrow, w / 2, hasPhoto ? Math.round(h * 0.088) : Math.round(h * 0.22));

  // Content vertical anchor
  const infoStartY = hasPhoto
    ? config.aspect === "story-9-16"
      ? Math.round(h * 0.72)
      : Math.round(h * 0.695)
    : Math.round(h * 0.35);

  // Countdown badge pill
  const pillW = Math.min(w - 140, Math.max(360, countdown.badgeText.length * 22 + 90));
  const pillH = 62;
  const pillX = (w - pillW) / 2;
  const pillY = infoStartY;

  ctx.save();
  roundedRectPath(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fillStyle = theme.pillBg;
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = theme.pillText;
  ctx.font = '700 25px "Be Vietnam Pro", ui-sans-serif, system-ui, sans-serif';
  ctx.fillText(countdown.badgeText, w / 2, pillY + 40);

  // Couple names
  const groom = config.groomName.trim() || "Minh Hoàng";
  const bride = config.brideName.trim() || "Thu Hà";
  const coupleLine = `${groom}  &  ${bride}`;

  ctx.fillStyle = theme.textPrimary;
  ctx.font = '500 68px "Cormorant Garamond", "Lora", Georgia, serif';
  ctx.fillText(coupleLine, w / 2, pillY + 150, w - 140);

  // Decorative hairline
  ctx.save();
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 90, pillY + 188);
  ctx.lineTo(w / 2 + 90, pillY + 188);
  ctx.stroke();
  ctx.restore();

  // Wedding date line
  const dateText = formatWeddingDateLine(config.weddingDate);
  ctx.fillStyle = theme.textPrimary;
  ctx.font = '600 34px "Be Vietnam Pro", ui-sans-serif, system-ui, sans-serif';
  ctx.fillText(dateText, w / 2, pillY + 244);

  // Venue / city
  if (config.venueCity.trim()) {
    ctx.fillStyle = theme.textMuted;
    ctx.font = '400 28px "Be Vietnam Pro", ui-sans-serif, system-ui, sans-serif';
    ctx.fillText(config.venueCity.trim(), w / 2, pillY + 294, w - 160);
  }

  // Subtle watermark at bottom
  ctx.fillStyle = theme.textMuted;
  ctx.globalAlpha = 0.72;
  ctx.font = '500 22px "Be Vietnam Pro", ui-sans-serif, system-ui, sans-serif';
  ctx.fillText("inviwedd.date", w / 2, h - 54);
  ctx.globalAlpha = 1;
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}
