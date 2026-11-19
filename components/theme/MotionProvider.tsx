"use client";

import type { ReactNode } from "react";
import { LazyMotion, domAnimation } from "motion/react";

/**
 * Một LazyMotion duy nhất bọc mọi màn hình render thiệp.
 *
 * Vì sao dùng `m` + LazyMotion thay cho `motion`: `motion` luôn kéo toàn bộ
 * engine (~45KB gzip) dù thiệp chỉ cần fade/slide, còn `m` chỉ tải lõi ~5KB và
 * `domAnimation` ~15KB (animate, variants, exit, tap/hover/focus — đủ cho mọi
 * preset đang dùng; không có layout/drag nên không cần `domMax`).
 *
 * `strict` biến việc lỡ quên provider thành lỗi rõ ràng thay vì animation
 * chạy im lặng sai — đổi lại, mọi component dùng `m` phải nằm dưới provider
 * này (xem `TemplatePreviewRenderer` và `LiveTemplateRenderer`).
 *
 * Lưu ý: không animate cùng một phần tử bằng cả `m` lẫn CSS keyframes của
 * designer — hai transform sẽ đè nhau.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
