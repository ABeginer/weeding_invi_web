"use client";

import * as React from "react";
import { m } from "motion/react";

export type HkRevealPhase = "idle" | "stage1" | "stage2" | "stage3";

const SPARK_ANGLES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

/* ------------------------------------------------------------
   1. HẠT KIM SA / TIA SÁNG BUNG TỎA (GPU-accelerated)
   ------------------------------------------------------------ */
export function HkGoldenSparks({
  active,
  primaryColor = "#F2D488",
  secondaryColor = "#C81E2B",
}: {
  active: boolean;
  primaryColor?: string;
  secondaryColor?: string;
}) {
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center overflow-hidden" aria-hidden="true">
      {/* Vòng sóng xung kích trung tâm */}
      <m.div
        className="absolute h-28 w-28 rounded-full border-2"
        style={{
          borderColor: primaryColor,
          boxShadow: `0 0 28px ${primaryColor}, inset 0 0 18px ${primaryColor}`,
        }}
        initial={{ scale: 0.4, opacity: 0.95 }}
        animate={{ scale: 3.4, opacity: 0 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
      <m.div
        className="absolute h-20 w-20 rounded-full border"
        style={{ borderColor: secondaryColor }}
        initial={{ scale: 0.3, opacity: 0.85 }}
        animate={{ scale: 2.6, opacity: 0 }}
        transition={{ duration: 0.96, delay: 0.12, ease: "easeOut" }}
      />
      {/* 12 tia bụi vàng bung tỏa đều 360° */}
      {SPARK_ANGLES.map((deg, idx) => {
        const rad = (deg * Math.PI) / 180;
        const dist = idx % 2 === 0 ? 135 : 95;
        const tx = Math.cos(rad) * dist;
        const ty = Math.sin(rad) * dist;
        return (
          <m.span
            key={deg}
            className="absolute h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: idx % 3 === 0 ? secondaryColor : primaryColor,
              boxShadow: `0 0 10px ${primaryColor}`,
            }}
            initial={{ x: 0, y: 0, scale: 1.3, opacity: 1 }}
            animate={{ x: tx, y: ty, scale: 0.2, opacity: 0 }}
            transition={{ duration: 1.04, ease: [0.16, 1, 0.3, 1] }}
          />
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------
   2. CỬU LONG HỶ YẾN: CỬA THANG MÁY PHÒNG VIP + KHE SÁNG VÀNG
   - Stage 2: 2 cánh cửa đồng đen mạ vàng khép kín + tia sáng vàng xẻ dọc giữa
   - Stage 3: 2 cánh cửa trượt tách sang 2 bên để lộ trực tiếp Hero bên dưới
   ------------------------------------------------------------ */
export function HkKowloonVipDoorsOverlay({
  phase,
  coupleLabel,
}: {
  phase: HkRevealPhase;
  coupleLabel: string;
}) {
  if (phase !== "stage2" && phase !== "stage3") return null;
  const isParting = phase === "stage3";

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden" aria-hidden="true">
      {/* Cánh cửa VIP bên trái */}
      <m.div
        className="absolute inset-y-0 left-0 w-1/2 overflow-hidden border-r-2 border-[#D8AE56]/80 bg-gradient-to-r from-[#090B0C] via-[#131817] to-[#1A130C]"
        style={{
          boxShadow: "inset -16px 0 36px rgba(0,0,0,0.9)",
          transform: "translateZ(0)",
        }}
        initial={{ opacity: 0, x: "0%" }}
        animate={{ opacity: 1, x: isParting ? "-102%" : "0%" }}
        transition={
          isParting
            ? { duration: 1.24, ease: [0.22, 1, 0.36, 1] }
            : { duration: 0.44, ease: "easeOut" }
        }
      >
        {/* Hoa văn khung chỉ vàng Art Deco trên cánh trái */}
        <div className="absolute inset-y-6 left-4 right-3 rounded-l-lg border border-[#D8AE56]/35" />
        <div className="absolute inset-y-10 left-7 right-6 border-y border-l border-[#D8AE56]/25" />
        {/* Nửa huy hiệu tròn chính giữa */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-24 w-24 rounded-full border-2 border-[#D8AE56]/75 bg-[#2A090D]" />
      </m.div>

      {/* Cánh cửa VIP bên phải */}
      <m.div
        className="absolute inset-y-0 right-0 w-1/2 overflow-hidden border-l-2 border-[#D8AE56]/80 bg-gradient-to-l from-[#090B0C] via-[#131817] to-[#1A130C]"
        style={{
          boxShadow: "inset 16px 0 36px rgba(0,0,0,0.9)",
          transform: "translateZ(0)",
        }}
        initial={{ opacity: 0, x: "0%" }}
        animate={{ opacity: 1, x: isParting ? "102%" : "0%" }}
        transition={
          isParting
            ? { duration: 1.24, ease: [0.22, 1, 0.36, 1] }
            : { duration: 0.44, ease: "easeOut" }
        }
      >
        {/* Hoa văn khung chỉ vàng Art Deco trên cánh phải */}
        <div className="absolute inset-y-6 left-3 right-4 rounded-r-lg border border-[#D8AE56]/35" />
        <div className="absolute inset-y-10 left-6 right-7 border-y border-r border-[#D8AE56]/25" />
        {/* Nửa huy hiệu tròn chính giữa */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 h-24 w-24 rounded-full border-2 border-[#D8AE56]/75 bg-[#2A090D]" />
      </m.div>

      {/* Khe sáng vàng kim xẻ dọc chính giữa + Nhãn phòng VIP */}
      <m.div
        className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-gradient-to-b from-transparent via-[#FFF4D2] to-transparent"
        style={{
          boxShadow: "0 0 24px 6px rgba(242,212,136,0.95), 0 0 54px 14px rgba(200,30,43,0.55)",
        }}
        initial={{ scaleY: 0, opacity: 0 }}
        animate={
          isParting
            ? { scaleY: 1.1, opacity: 0 }
            : { scaleY: 1, opacity: 1 }
        }
        transition={{ duration: isParting ? 0.7 : 0.76, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Dòng chữ nổi giữa 2 cánh cửa trước khi tách */}
      <m.div
        className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={isParting ? { opacity: 0, scale: 1.08 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.52 }}
      >
        <span className="rounded-full border border-[#D8AE56]/70 bg-[#0B0D0E]/90 px-4 py-1 text-[10px] font-bold tracking-[0.28em] text-[#F2D488] uppercase shadow-[0_0_20px_rgba(216,174,86,0.45)]">
          VIP ROOM · OPEN
        </span>
        <p className="mt-2.5 text-sm font-bold tracking-[0.2em] text-[#F5EFE4] uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
          {coupleLabel}
        </p>
      </m.div>
    </div>
  );
}

/* ------------------------------------------------------------
   3. BẢN SẮC HƯƠNG CẢNG: CLAPPERBOARD 35MM + MÀN TRẬP PHIM TÁCH DỌC
   - Stage 1: Thanh Clapperboard sập xuống + Vòng lá khẩu ống kính chớp sáng hổ phách
   - Stage 2: 2 dải phim 35mm đục lỗ kẹp Widescreen + "THE BIG DAY" + Tia Anamorphic
   - Stage 3: 2 màn trập phim tách lên trên & xuống dưới để lộ Hero thật
   ------------------------------------------------------------ */
export function HkCinemaShutterOverlay({
  phase,
  coupleLabel,
  titleFont,
  monoFont,
}: {
  phase: HkRevealPhase;
  coupleLabel: string;
  titleFont: string;
  monoFont: string;
}) {
  if (phase === "idle") return null;

  const isStage1 = phase === "stage1";
  const isParting = phase === "stage3";

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden" aria-hidden="true">
      {/* PHA 1: Clapperboard sập xuống + Vòng lá khẩu ống kính */}
      {isStage1 && (
        <>
          <m.div
            className="absolute inset-x-0 top-0 h-11 border-b-2 border-[#DFC07C] shadow-[0_8px_24px_rgba(0,0,0,0.85)]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(-45deg, #0D0E12 0px, #0D0E12 18px, #DFC07C 18px, #DFC07C 36px)",
              transformOrigin: "left top",
            }}
            initial={{ rotate: -14, y: -24, opacity: 0.9 }}
            animate={{ rotate: 0, y: 0, opacity: 1 }}
            transition={{ duration: 0.48, ease: [0.34, 1.56, 0.64, 1] }}
          />
          <m.div
            className="absolute inset-0 bg-gradient-to-tr from-[#DFC07C]/35 via-[#FFF8E8]/55 to-[#00D4AA]/25"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.92, 0.15, 0] }}
            transition={{ duration: 0.76, times: [0, 0.28, 0.55, 1] }}
          />
          {/* Vòng lá khẩu ống kính giữa khung */}
          <m.div
            className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#DFC07C]"
            style={{ boxShadow: "0 0 36px rgba(223,192,124,0.75)" }}
            initial={{ scale: 2.2, opacity: 0 }}
            animate={{ scale: 0.55, opacity: [0, 1, 0] }}
            transition={{ duration: 0.76, ease: "easeOut" }}
          />
        </>
      )}

      {/* PHA 2 & 3: Hai màn trập phim 35mm đục lỗ tách trên/dưới */}
      {(phase === "stage2" || phase === "stage3") && (
        <>
          {/* Màn trập nửa trên */}
          <m.div
            className="absolute inset-x-0 top-0 h-1/2 overflow-hidden border-b border-[#DFC07C]/70 bg-[#070709]"
            style={{ transform: "translateZ(0)" }}
            initial={{ opacity: 0, y: "0%" }}
            animate={{ opacity: 1, y: isParting ? "-104%" : "0%" }}
            transition={
              isParting
                ? { duration: 1.12, ease: [0.22, 1, 0.36, 1] }
                : { duration: 0.4, ease: "easeOut" }
            }
          >
            {/* Lỗ đục cuộn phim 35mm mép trên */}
            <div className="flex justify-between gap-2 px-3 pt-3 opacity-60">
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className="h-3 w-4 rounded-[2px] border border-[#DFC07C]/60 bg-[#1B1D24]" />
              ))}
            </div>
          </m.div>

          {/* Màn trập nửa dưới */}
          <m.div
            className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden border-t border-[#DFC07C]/70 bg-[#070709]"
            style={{ transform: "translateZ(0)" }}
            initial={{ opacity: 0, y: "0%" }}
            animate={{ opacity: 1, y: isParting ? "104%" : "0%" }}
            transition={
              isParting
                ? { duration: 1.12, ease: [0.22, 1, 0.36, 1] }
                : { duration: 0.4, ease: "easeOut" }
            }
          >
            {/* Lỗ đục cuộn phim 35mm mép dưới */}
            <div className="absolute inset-x-0 bottom-3 flex justify-between gap-2 px-3 opacity-60">
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className="h-3 w-4 rounded-[2px] border border-[#DFC07C]/60 bg-[#1B1D24]" />
              ))}
            </div>
          </m.div>

          {/* Tia sáng Anamorphic ngang + Tiêu đề THE BIG DAY */}
          <m.div
            className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: isParting ? 0 : 1 }}
            transition={{ duration: 0.44 }}
          >
            <m.div
              className="absolute h-[2px] w-full bg-gradient-to-r from-transparent via-[#00D4AA] to-transparent"
              style={{ boxShadow: "0 0 18px #00D4AA, 0 0 36px #DFC07C" }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 0.95 }}
              transition={{ duration: 0.72, ease: "easeOut" }}
            />
            <p
              className="relative z-10 text-[10px] font-bold tracking-[0.18em] text-[#DFC07C] uppercase"
              style={{ fontFamily: monoFont }}
            >
              Thiệp mời tham dự lễ cưới
            </p>
            <h2
              className="relative z-10 mt-2 text-3xl sm:text-4xl font-black uppercase tracking-[0.2em] text-[#F4F1EA] drop-shadow-[0_0_24px_rgba(223,192,124,0.5)]"
              style={{ fontFamily: titleFont }}
            >
              NGÀY CHUNG ĐÔI
            </h2>
            <p className="relative z-10 mt-2 text-[11px] font-semibold tracking-[0.24em] text-[#A1A6B0] uppercase">
              {coupleLabel}
            </p>
          </m.div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------
   4. DẠ ẢNH HƯƠNG CẢNG: ĐÓNG DẤU SON ĐỎ + MÁY CHIẾU + RÈM NHUNG ĐỎ
   - Stage 1: Con dấu son đỏ đóng sập xuống + sóng mực đỏ "ĐÃ SOÁT VÉ"
   - Stage 2: Rèm nhung đỏ thẫm khép kín + chùm sáng máy chiếu cổ rọi từ đỉnh
   - Stage 3: Hai cánh rèm nhung đỏ viền tua vàng vén mở sang 2 bên lộ Hero Zine
   ------------------------------------------------------------ */
export function HkVelvetCurtainOverlay({
  phase,
  coupleLabel,
  titleFont,
  monoFont,
}: {
  phase: HkRevealPhase;
  coupleLabel: string;
  titleFont: string;
  monoFont: string;
}) {
  if (phase === "idle") return null;

  const isStage1 = phase === "stage1";
  const isParting = phase === "stage3";

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden" aria-hidden="true">
      {/* PHA 1: Con dấu kiểm duyệt son đỏ đóng sập xuống */}
      {isStage1 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <m.div
            className="flex flex-col items-center justify-center rounded-xl border-2 border-[#C81E2B] bg-[#0D0D10]/90 px-6 py-3.5 text-center shadow-[0_0_32px_rgba(200,30,43,0.7)]"
            initial={{ scale: 2.35, rotate: -14, opacity: 0 }}
            animate={{ scale: 1, rotate: -6, opacity: 1 }}
            transition={{ duration: 0.68, ease: [0.34, 1.4, 0.64, 1] }}
          >
            <span
              className="text-[10px] font-bold tracking-[0.28em] text-[#E5A93B] uppercase"
              style={{ fontFamily: monoFont }}
            >
              ADMIT ONE · VIP PASS
            </span>
            <span
              className="mt-0.5 text-xl font-black tracking-[0.18em] text-[#C81E2B] uppercase"
              style={{ fontFamily: titleFont }}
            >
              ĐÃ SOÁT VÉ
            </span>
          </m.div>
        </div>
      )}

      {/* PHA 2 & 3: Rèm nhung đỏ rạp chiếu phim cổ điển vén sang 2 bên */}
      {(phase === "stage2" || phase === "stage3") && (
        <>
          {/* Cánh rèm bên trái */}
          <m.div
            className="absolute inset-y-0 left-0 w-1/2 border-r-2 border-[#E5A93B]/75"
            style={{
              background:
                "repeating-linear-gradient(90deg, #3A070E 0px, #580D17 18px, #2B050A 36px)",
              boxShadow: "inset -18px 0 32px rgba(0,0,0,0.85)",
              transform: "translateZ(0)",
            }}
            initial={{ opacity: 0, x: "0%" }}
            animate={{ opacity: 1, x: isParting ? "-104%" : "0%" }}
            transition={
              isParting
                ? { duration: 1.24, ease: [0.22, 1, 0.36, 1] }
                : { duration: 0.44, ease: "easeOut" }
            }
          />
          {/* Cánh rèm bên phải */}
          <m.div
            className="absolute inset-y-0 right-0 w-1/2 border-l-2 border-[#E5A93B]/75"
            style={{
              background:
                "repeating-linear-gradient(90deg, #2B050A 0px, #580D17 18px, #3A070E 36px)",
              boxShadow: "inset 18px 0 32px rgba(0,0,0,0.85)",
              transform: "translateZ(0)",
            }}
            initial={{ opacity: 0, x: "0%" }}
            animate={{ opacity: 1, x: isParting ? "104%" : "0%" }}
            transition={
              isParting
                ? { duration: 1.24, ease: [0.22, 1, 0.36, 1] }
                : { duration: 0.44, ease: "easeOut" }
            }
          />

          {/* Luồng sáng máy chiếu hình nón từ đỉnh xuống */}
          <m.div
            className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: isParting ? 0 : 1 }}
            transition={{ duration: 0.44 }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 65% 55% at 50% 15%, rgba(229,169,59,0.34), transparent 72%)",
              }}
            />
            <span
              className="relative z-10 text-[10px] font-bold tracking-[0.3em] text-[#E5A93B] uppercase"
              style={{ fontFamily: monoFont }}
            >
              NOW SHOWING · SUẤT CHIẾU ĐẶC BIỆT
            </span>
            <p
              className="relative z-10 mt-2 text-2xl font-extrabold uppercase tracking-[0.16em] text-[#F5F2EB] drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)]"
              style={{ fontFamily: titleFont }}
            >
              {coupleLabel}
            </p>
          </m.div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------
   5. HÀO QUANG HƯƠNG CẢNG: ĐÈN PHA CHỮ X + CỬA ĐẠI SẢNH ART DECO 3D
   - Stage 1: 2 chùm đèn pha vàng quét chéo chữ X + vòng hào quang đồng tâm
   - Stage 2: Cánh cổng Art Deco khép + khe sáng champagne rực rỡ
   - Stage 3: 2 cánh cửa 3D xoay bản lề mở ra ngoài (rotateY ±86deg) lộ Hero
   ------------------------------------------------------------ */
export function HkArtDeco3dDoorsOverlay({
  phase,
  coupleLabel,
  titleFont,
  monoFont,
}: {
  phase: HkRevealPhase;
  coupleLabel: string;
  titleFont: string;
  monoFont: string;
}) {
  if (phase === "idle") return null;

  const isStage1 = phase === "stage1";
  const isParting = phase === "stage3";

  return (
    <div
      className="pointer-events-none absolute inset-0 z-40 overflow-hidden"
      style={{ perspective: "1100px" }}
      aria-hidden="true"
    >
      {/* PHA 1: Chùm đèn pha sân khấu quét chéo chữ X + hào quang */}
      {isStage1 && (
        <>
          <m.div
            className="absolute -bottom-16 -left-16 h-[140%] w-28 bg-gradient-to-t from-[#F1D693]/55 via-[#D8B15B]/25 to-transparent"
            style={{ transformOrigin: "bottom left" }}
            initial={{ rotate: 8, opacity: 0 }}
            animate={{ rotate: 42, opacity: [0, 0.95, 0.4] }}
            transition={{ duration: 0.84, ease: "easeOut" }}
          />
          <m.div
            className="absolute -bottom-16 -right-16 h-[140%] w-28 bg-gradient-to-t from-[#F1D693]/55 via-[#D8B15B]/25 to-transparent"
            style={{ transformOrigin: "bottom right" }}
            initial={{ rotate: -8, opacity: 0 }}
            animate={{ rotate: -42, opacity: [0, 0.95, 0.4] }}
            transition={{ duration: 0.84, ease: "easeOut" }}
          />
          <HkGoldenSparks active primaryColor="#F1D693" secondaryColor="#6E0F1D" />
        </>
      )}

      {/* PHA 2 & 3: 2 cánh cửa Đại Sảnh Art Deco 3D xoay bản lề */}
      {(phase === "stage2" || phase === "stage3") && (
        <>
          {/* Cánh cửa 3D bên trái (bản lề mép trái) */}
          <m.div
            className="absolute inset-y-0 left-0 w-1/2 overflow-hidden border-r-2 border-[#D8B15B] bg-gradient-to-br from-[#171214] via-[#0F0C0E] to-[#260A10]"
            style={{
              transformOrigin: "left center",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
            initial={{ opacity: 0, rotateY: 0 }}
            animate={{ opacity: 1, rotateY: isParting ? -88 : 0 }}
            transition={
              isParting
                ? { duration: 1.36, ease: [0.22, 1, 0.36, 1] }
                : { duration: 0.44, ease: "easeOut" }
            }
          >
            <div className="absolute inset-y-6 left-4 right-3 border border-[#D8B15B]/45" />
            <div className="absolute inset-y-12 left-7 right-6 border-y border-l border-[#D8B15B]/25" />
          </m.div>

          {/* Cánh cửa 3D bên phải (bản lề mép phải) */}
          <m.div
            className="absolute inset-y-0 right-0 w-1/2 overflow-hidden border-l-2 border-[#D8B15B] bg-gradient-to-bl from-[#171214] via-[#0F0C0E] to-[#260A10]"
            style={{
              transformOrigin: "right center",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
            initial={{ opacity: 0, rotateY: 0 }}
            animate={{ opacity: 1, rotateY: isParting ? 88 : 0 }}
            transition={
              isParting
                ? { duration: 1.36, ease: [0.22, 1, 0.36, 1] }
                : { duration: 0.44, ease: "easeOut" }
            }
          >
            <div className="absolute inset-y-6 left-3 right-4 border border-[#D8B15B]/45" />
            <div className="absolute inset-y-12 left-6 right-7 border-y border-r border-[#D8B15B]/25" />
          </m.div>

          {/* Khe sáng vàng Champagne rực rỡ chính giữa */}
          <m.div
            className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-[#FFF6DC]"
            style={{
              boxShadow: "0 0 28px 8px rgba(241,214,147,0.95), 0 0 60px 16px rgba(216,177,91,0.5)",
            }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={isParting ? { scaleY: 1.1, opacity: 0 } : { scaleY: 1, opacity: 1 }}
            transition={{ duration: 0.7 }}
          />

          <m.div
            className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={isParting ? { opacity: 0, scale: 1.06 } : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.48 }}
          >
            <span
              className="rounded-full border border-[#D8B15B]/75 bg-[#0A090B]/90 px-4 py-1 text-[10px] font-bold tracking-[0.28em] text-[#F1D693] uppercase"
              style={{ fontFamily: monoFont }}
            >
              GRAND PREMIERE · 1990S
            </span>
            <p
              className="mt-2.5 text-xl font-extrabold uppercase tracking-[0.18em] text-[#F4ECE0] drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]"
              style={{ fontFamily: titleFont }}
            >
              {coupleLabel}
            </p>
          </m.div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------
   6. HƯƠNG CẢNG ĐÊM NEON: RGB OVERDRIVE + VHS PLAY + TIA SÁNG CRT MỞ DỌC
   - Stage 1: Tách kênh màu RGB Cyan/Magenta + thanh tracking VHS quét dọc
   - Stage 2: Màn đen CRT khóa nét "PLAY ▶ HI-FI STEREO" + tia sáng ngang sáng rực
   - Stage 3: Hai nửa đen trên/dưới tách mạnh theo tia sáng CRT để lộ Hero phố đêm
   ------------------------------------------------------------ */
export function HkNeonCrtUnfoldOverlay({
  phase,
  coupleLabel,
  titleFont,
  monoFont,
}: {
  phase: HkRevealPhase;
  coupleLabel: string;
  titleFont: string;
  monoFont: string;
}) {
  if (phase === "idle") return null;

  const isStage1 = phase === "stage1";
  const isParting = phase === "stage3";

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden" aria-hidden="true">
      {/* PHA 1: RGB Chromatic Overdrive + thanh tracking VHS */}
      {isStage1 && (
        <>
          <m.div
            className="absolute inset-0 bg-gradient-to-r from-[#00F5D4]/30 via-transparent to-[#FF2D78]/35"
            initial={{ x: -8, opacity: 0 }}
            animate={{ x: [-8, 8, -5, 5, 0], opacity: [0, 0.9, 0.35, 0.85, 0] }}
            transition={{ duration: 0.8 }}
          />
          <m.div
            className="absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-[#00F5D4]/60 to-transparent"
            initial={{ top: "-10%" }}
            animate={{ top: "110%" }}
            transition={{ duration: 0.76, ease: "linear" }}
          />
        </>
      )}

      {/* PHA 2 & 3: Hai màn chắn CRT đen tách trên/dưới quanh tia sáng Neon */}
      {(phase === "stage2" || phase === "stage3") && (
        <>
          <m.div
            className="absolute inset-x-0 top-0 h-1/2 border-b border-[#00F5D4]/80 bg-[#07070B]"
            style={{ transform: "translateZ(0)" }}
            initial={{ opacity: 0, y: "0%" }}
            animate={{ opacity: 1, y: isParting ? "-104%" : "0%" }}
            transition={
              isParting
                ? { duration: 1.12, ease: [0.22, 1, 0.36, 1] }
                : { duration: 0.36, ease: "easeOut" }
            }
          />
          <m.div
            className="absolute inset-x-0 bottom-0 h-1/2 border-t border-[#FF2D78]/80 bg-[#07070B]"
            style={{ transform: "translateZ(0)" }}
            initial={{ opacity: 0, y: "0%" }}
            animate={{ opacity: 1, y: isParting ? "104%" : "0%" }}
            transition={
              isParting
                ? { duration: 1.12, ease: [0.22, 1, 0.36, 1] }
                : { duration: 0.36, ease: "easeOut" }
            }
          />

          {/* Tia sáng CRT ngang trung tâm */}
          <m.div
            className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-gradient-to-r from-[#FF2D78] via-[#FFFFFF] to-[#00F5D4]"
            style={{
              boxShadow: "0 0 22px 6px rgba(0,245,212,0.9), 0 0 42px 10px rgba(255,45,120,0.65)",
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={isParting ? { scaleX: 1.1, opacity: 0 } : { scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
          />

          {/* HUD VHS PLAY */}
          <m.div
            className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={isParting ? { opacity: 0, scale: 1.08 } : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.48 }}
          >
            <span
              className="inline-flex items-center gap-2 rounded-md border border-[#00F5D4]/60 bg-[#0B0B0F]/95 px-3.5 py-1 text-[10px] font-bold tracking-[0.26em] text-[#00F5D4] uppercase shadow-[0_0_16px_rgba(0,245,212,0.45)]"
              style={{ fontFamily: monoFont }}
            >
              PLAY ▶ HI-FI STEREO
            </span>
            <p
              className="mt-3 text-2xl font-black uppercase tracking-[0.18em] text-[#F7F4EE]"
              style={{
                fontFamily: titleFont,
                textShadow: "-2px 0 12px rgba(255,45,120,0.85), 2px 0 12px rgba(0,245,212,0.85)",
              }}
            >
              {coupleLabel}
            </p>
          </m.div>
        </>
      )}
    </div>
  );
}
