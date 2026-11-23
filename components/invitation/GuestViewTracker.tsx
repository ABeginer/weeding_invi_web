"use client";

import * as React from "react";

interface GuestViewTrackerProps {
  slug: string;
}

/**
 * Gửi tín hiệu đếm lượt xem thiệp cá nhân gói Free trong nền (non-blocking).
 * Trình duyệt gửi qua POST /api/invite/[slug]/view với keepalive để không cản trở
 * tốc độ load trang và không bị chặn khi người dùng đóng tab ngay.
 */
export function GuestViewTracker({ slug }: GuestViewTrackerProps) {
  React.useEffect(() => {
    if (!slug) return;

    // Chỉ đếm 1 lần trong phiên xem của client hiện tại
    const sessionKey = `inviwedd_viewed_${slug}`;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(sessionKey)) {
      return;
    }

    try {
      fetch(`/api/invite/${encodeURIComponent(slug)}/view`, {
        method: "POST",
        keepalive: true,
      })
        .then(() => {
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.setItem(sessionKey, "1");
          }
        })
        .catch(() => {
          // Bỏ qua lỗi mạng
        });
    } catch {
      // Bỏ qua lỗi client
    }
  }, [slug]);

  return null;
}
