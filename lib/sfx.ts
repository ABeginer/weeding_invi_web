/**
 * lib/sfx.ts
 *
 * Tiện ích hiệu ứng âm thanh (SFX) toàn hệ thống Inviwedd.
 * Quản lý SFX Mở Thiệp (Cover) và SFX Mở Quà Mừng (Gift) với phân loại phong cách chuẩn xác.
 * Mặc định volume 0.42, tôn trọng trạng thái tắt âm (muted), xử lý an toàn trên iOS Safari & Android Chrome.
 */

export type CoverSfxType =
  | "envelope"
  | "silk"
  | "royal"
  | "crystal"
  | "vhs-shutter"
  | "mahjong"
  | "ticket-tear";

export type GiftSfxType =
  | "envelope"
  | "box"
  | "briefcase"
  | "pouch"
  | "tin-vhs";

export const COVER_SFX_MAP: Record<CoverSfxType, string> = {
  envelope: "/sfx/open-envelope.mp3",
  silk: "/sfx/open-silk.mp3",
  royal: "/sfx/open-royal.mp3",
  crystal: "/sfx/open-crystal.mp3",
  "vhs-shutter": "/sfx/open-vhs-shutter.mp3",
  mahjong: "/sfx/open-mahjong.mp3",
  "ticket-tear": "/sfx/open-ticket-tear.mp3",
};

export const GIFT_SFX_MAP: Record<GiftSfxType, string> = {
  envelope: "/sfx/gift-envelope.mp3",
  box: "/sfx/gift-box.mp3",
  briefcase: "/sfx/gift-briefcase.mp3",
  pouch: "/sfx/gift-pouch.mp3",
  "tin-vhs": "/sfx/gift-tin-vhs.mp3",
};

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
 * Phát SFX Mở Thiệp theo phong cách thiết kế
 */
export function playCoverSfx(type: CoverSfxType = "envelope", options?: SfxOptions): void {
  const url = COVER_SFX_MAP[type] || COVER_SFX_MAP.envelope;
  playSfx(url, options);
}

/**
 * Phát SFX Mở Hộp Quà Mừng theo loại vật thể
 */
export function playGiftSfx(type: GiftSfxType = "box", options?: SfxOptions): void {
  const url = GIFT_SFX_MAP[type] || GIFT_SFX_MAP.box;
  playSfx(url, options);
}
