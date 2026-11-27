/**
 * lib/sound-effects.ts
 *
 * Tiện ích hiệu ứng âm thanh (Sound Effects / SFX) toàn hệ thống Inviwedd.
 * Tương thích ngược và tích hợp liền mạch với lib/sfx.ts.
 */

import { playCoverSfx, CoverSfxType, wasPureCoverFoleyPlayedRecently } from "./sfx";

export { playCoverSfx, playGiftSfx } from "./sfx";
export type { CoverSfxType, GiftSfxType } from "./sfx";

export const SFX_OPEN_CARD_URL = "/sfx/open-envelope.mp3";

let lastSfxPlayTimestamp = 0;

/**
 * Phát âm thanh hiệu ứng mở thiệp cưới.
 * Mặc định volume 0.42, tự động ánh xạ theo phong cách thiệp (CoverSfxType).
 */
export function playOpenCardSound(volume = 0.42, coverType: CoverSfxType = "envelope"): void {
  if (typeof window === "undefined") return;
  if (coverType === "envelope" && wasPureCoverFoleyPlayedRecently()) {
    return;
  }

  const now = Date.now();
  if (now - lastSfxPlayTimestamp < 250) {
    return;
  }
  lastSfxPlayTimestamp = now;

  playCoverSfx(coverType, { volume });
}

/**
 * Phát sự kiện mở thiệp toàn hệ thống, tự động kích hoạt âm thanh SFX mở thiệp
 * và thông báo đến các component liên quan.
 */
export function dispatchOpenCardEvent(coverType: CoverSfxType = "envelope"): void {
  if (typeof window === "undefined") return;
  playOpenCardSound(0.42, coverType);
  try {
    window.dispatchEvent(new CustomEvent("inviwedd:open-envelope"));
  } catch { }
}
