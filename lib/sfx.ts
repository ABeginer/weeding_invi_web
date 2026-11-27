/**
 * lib/sfx.ts
 *
 * Tiện ích hiệu ứng âm thanh (SFX) toàn hệ thống Inviwedd.
 * Quản lý SFX Mở Thiệp (Cover) và SFX Mở Quà Mừng (Gift) với phân loại phong cách chuẩn xác.
 * Mặc định volume 0.42, tôn trọng trạng thái tắt âm (muted), xử lý an toàn trên iOS Safari & Android Chrome.
 */

import {
  playInteractionFoley,
  playStandardCoverFoley,
  playStandardGiftFoley,
  type InteractionSfxId,
  type StandardCoverFoleyId,
  type StandardGiftFoleyId,
} from "./sfx-foley";

/**
 * Gói Miễn phí dùng SFX đại trà 1 pha;
 * Gói Standard dùng bản phối Signature Foley đa pha theo chủ đề & ngữ cảnh.
 */
export type CoverSfxType =
  | "envelope"
  | "silk"
  | "royal"
  | "crystal"
  | "vhs-shutter"
  | "mahjong"
  | "ticket-tear"
  | StandardCoverFoleyId;

export type GiftSfxType =
  | "envelope"
  | "box"
  | "briefcase"
  | "pouch"
  | "tin-vhs"
  | StandardGiftFoleyId;

export type { InteractionSfxId };

export const COVER_SFX_MAP: Record<CoverSfxType, string> = {
  envelope: "/sfx/open-envelope.mp3",
  silk: "/sfx/open-silk.mp3",
  royal: "/sfx/open-royal.mp3",
  crystal: "/sfx/open-crystal.mp3",
  "vhs-shutter": "/sfx/open-vhs-shutter.mp3",
  mahjong: "/sfx/open-mahjong.mp3",
  "ticket-tear": "/sfx/open-ticket-tear.mp3",
  "kowloon-vip-doors": "/sfx/open-mahjong.mp3",
  "cinema-clapper-35mm": "/sfx/open-vhs-shutter.mp3",
  "cinema-ticket-curtain": "/sfx/open-ticket-tear.mp3",
  "artdeco-grand-doors": "/sfx/open-royal.mp3",
  "neon-vhs-crt": "/sfx/open-vhs-shutter.mp3",
  "lotus-wax-envelope": "/sfx/open-envelope.mp3",
  "crane-fan-harp": "/sfx/open-royal.mp3",
  "vintage-wax-letter": "/sfx/open-envelope.mp3",
  "amber-secret-letter": "/sfx/open-envelope.mp3",
  "diary-tape-peel-fall": "/sfx/open-envelope.mp3",
};

export const GIFT_SFX_MAP: Record<GiftSfxType, string> = {
  envelope: "/sfx/gift-envelope.mp3",
  box: "/sfx/gift-box.mp3",
  briefcase: "/sfx/gift-briefcase.mp3",
  pouch: "/sfx/gift-pouch.mp3",
  "tin-vhs": "/sfx/gift-tin-vhs.mp3",
  "briefcase-vip": "/sfx/gift-briefcase.mp3",
  "tin-vhs-retro": "/sfx/gift-tin-vhs.mp3",
  "artdeco-box-luxury": "/sfx/gift-box.mp3",
  "lotus-silk-giftbox": "/sfx/gift-box.mp3",
  "enamel-crane-casket": "/sfx/gift-box.mp3",
  "vintage-kraft-gift": "/sfx/gift-box.mp3",
  "amber-parcel-gift": "/sfx/gift-box.mp3",
  "diary-kraft-parcel": "/sfx/gift-box.mp3",
};

const STANDARD_COVER_FOLEY_SET = new Set<string>([
  "kowloon-vip-doors",
  "cinema-clapper-35mm",
  "cinema-ticket-curtain",
  "artdeco-grand-doors",
  "neon-vhs-crt",
  "lotus-wax-envelope",
  "crane-fan-harp",
  "vintage-wax-letter",
  "amber-secret-letter",
  "diary-tape-peel-fall",
]);

const STANDARD_GIFT_FOLEY_SET = new Set<string>([
  "briefcase-vip",
  "tin-vhs-retro",
  "artdeco-box-luxury",
  "lotus-silk-giftbox",
  "enamel-crane-casket",
  "vintage-kraft-gift",
  "amber-parcel-gift",
  "diary-kraft-parcel",
]);

/**
 * Các bản phối thuần thủ công (100% Web Audio ASMR, KHÔNG phát chồng tệp MP3 cũ)
 */
const PURE_FOLEY_COVER_SET = new Set<string>([
  "vintage-wax-letter",
  "amber-secret-letter",
  "diary-tape-peel-fall",
]);
const PURE_FOLEY_GIFT_SET = new Set<string>([
  "vintage-kraft-gift",
  "amber-parcel-gift",
  "diary-kraft-parcel",
]);

let lastPureCoverFoleyTimestamp = 0;

export function wasPureCoverFoleyPlayedRecently(windowMs = 4500): boolean {
  return lastPureCoverFoleyTimestamp > 0 && Date.now() - lastPureCoverFoleyTimestamp < windowMs;
}

export interface SfxOptions {
  volume?: number;
  muted?: boolean;
}

const audioCache = new Map<string, HTMLAudioElement>();
let audioCtx: AudioContext | null = null;

/**
 * Fallback Web Audio API nếu audio element không thể nạp hoặc bị chặn
 */
function playWebAudioFallback(freq = 1046.5, duration = 0.18, volume = 0.25): void {
  try {
    if (typeof window === "undefined") return;
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(Math.min(volume, 0.4), audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {
    // Không ném exception
  }
}

/**
 * Phát tệp SFX bất kỳ với mức âm lượng chuẩn hóa và bảo vệ lỗi Promise
 */
export function playSfx(url: string, options?: SfxOptions): void {
  if (typeof window === "undefined") return;
  if (options?.muted) return;

  const targetVolume = Math.max(0, Math.min(1, options?.volume ?? 0.42));

  try {
    let audio = audioCache.get(url);
    if (!audio) {
      audio = new Audio(url);
      audio.preload = "auto";
      audioCache.set(url, audio);
    }

    audio.volume = targetVolume;
    audio.currentTime = 0;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback sang Web Audio API nếu trình duyệt chặn phát trực tiếp
        playWebAudioFallback(1046.5, 0.18, targetVolume);
      });
    }
  } catch {
    playWebAudioFallback(1046.5, 0.18, targetVolume);
  }
}

/**
 * Phát SFX Mở Thiệp theo phong cách thiết kế.
 * - Các loại đại trà (Free): chỉ phát 1 lớp MP3 nhẹ.
 * - Các loại Standard Signature Foley: phối lớp MP3 nền nhẹ + Foley Web Audio đa pha khớp 3 giai đoạn.
 */
export function playCoverSfx(type: CoverSfxType = "envelope", options?: SfxOptions): void {
  if (options?.muted) return;
  const vol = Math.max(0, Math.min(1, options?.volume ?? 0.56));

  if (PURE_FOLEY_COVER_SET.has(type)) {
    lastPureCoverFoleyTimestamp = Date.now();
    playStandardCoverFoley(type as StandardCoverFoleyId, vol);
    return;
  }

  if (STANDARD_COVER_FOLEY_SET.has(type)) {
    playStandardCoverFoley(type as StandardCoverFoleyId, vol);
    const url = COVER_SFX_MAP[type];
    if (url) {
      playSfx(url, { ...options, volume: vol * 0.52 });
    }
    return;
  }

  const url = COVER_SFX_MAP[type] || COVER_SFX_MAP.envelope;
  playSfx(url, options);
}

/**
 * Phát SFX Mở Hộp Quà Mừng theo loại vật thể.
 * - Các loại Standard VIP (`briefcase-vip`, `tin-vhs-retro`, `artdeco-box-luxury`):
 *   phối lớp Foley cơ khí (bật chốt khóa số vali, mở nắp thiếc, chuông pha lê) cùng MP3.
 */
export function playGiftSfx(type: GiftSfxType = "box", options?: SfxOptions): void {
  if (options?.muted) return;
  const vol = Math.max(0, Math.min(1, options?.volume ?? 0.56));

  if (PURE_FOLEY_GIFT_SET.has(type)) {
    playStandardGiftFoley(type as StandardGiftFoleyId, vol);
    return;
  }

  if (STANDARD_GIFT_FOLEY_SET.has(type)) {
    playStandardGiftFoley(type as StandardGiftFoleyId, vol);
    const url = GIFT_SFX_MAP[type];
    if (url) {
      playSfx(url, { ...options, volume: vol * 0.48 });
    }
    return;
  }

  const url = GIFT_SFX_MAP[type] || GIFT_SFX_MAP.box;
  playSfx(url, options);
}

/**
 * Phát Micro-SFX tương tác độc bản bên trong thiệp Standard
 * (cào nhũ vàng 24K, mở khóa ngày cưới, lật thẻ bài 3D).
 */
export function playInteractionSfx(type: InteractionSfxId, options?: SfxOptions): void {
  if (options?.muted) return;
  const vol = Math.max(0, Math.min(1, options?.volume ?? 0.46));
  playInteractionFoley(type, vol);
}
