"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { GiftSfxType, playGiftSfx } from "@/lib/sfx";

export type GiftBoxStage = "normal" | "glow" | "open" | "hover" | "active";

export interface UseGiftBoxInteractionOptions {
  /**
   * Loại vật thể quà mừng để phát đúng SFX
   * @default "box"
   */
  sfxType?: GiftSfxType;
  /**
   * Tắt âm thanh nếu người dùng đang mute nhạc thiệp
   * @default false
   */
  muted?: boolean;
  /**
   * Thời gian delay trước khi mở modal QR (chuẩn: 700ms)
   * @default 700
   */
  delayMs?: number;
  /**
   * Thời gian delay rút ngắn khi bật prefers-reduced-motion
   * @default 150
   */
  reducedMotionDelayMs?: number;
}

export interface UseGiftBoxInteractionReturn {
  stage: GiftBoxStage;
  setStage: React.Dispatch<React.SetStateAction<GiftBoxStage>>;
  isOpening: boolean;
  isGiftOpening: boolean;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  setGiftModalOpen: (open: boolean) => void;
  handleGiftClick: () => void;
  handleCloseModal: () => void;
}

export function useGiftBoxInteraction(
  options: UseGiftBoxInteractionOptions = {}
): UseGiftBoxInteractionReturn {
  const {
    sfxType = "box",
    muted = false,
    delayMs = 700,
    reducedMotionDelayMs = 150,
  } = options;

  const [stage, setStage] = useState<GiftBoxStage>("normal");
  const [isOpening, setIsOpening] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dọn dẹp timer khi component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const handleGiftClick = useCallback(() => {
    // Khóa chống double-click khi đang chạy hiệu ứng mở hoặc modal đã mở
    if (isOpening || isModalOpen) return;

    setIsOpening(true);
    setStage("open");

    // Phát âm thanh SFX mở quà ngay tại 0ms
    playGiftSfx(sfxType, { muted });

    // Kiểm tra cấu hình giảm chuyển động prefers-reduced-motion
    let effectiveDelay = delayMs;
    if (typeof window !== "undefined" && window.matchMedia) {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        effectiveDelay = reducedMotionDelayMs;
      }
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setIsModalOpen(true);
      setIsOpening(false);
      timerRef.current = null;
    }, effectiveDelay);
  }, [isOpening, isModalOpen, sfxType, muted, delayMs, reducedMotionDelayMs]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    // Trở về trạng thái normal để khách có thể xem lại hiệu ứng
    setStage("normal");
  }, []);

  return {
    stage,
    setStage,
    isOpening,
    isGiftOpening: isOpening,
    isModalOpen,
    setIsModalOpen,
    setGiftModalOpen: setIsModalOpen,
    handleGiftClick,
    handleCloseModal,
  };
}
