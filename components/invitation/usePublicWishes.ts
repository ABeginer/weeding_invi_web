"use client";

import * as React from "react";
import { getWishes, type PublicWish } from "@/lib/api";
import { useInvitationReadOnly, useWeddingContent } from "./WeddingContentProvider";

export type WishDisplayStyle = "box" | "overlay";

export type PublicWishesState = {
  wishes: PublicWish[];
  enabled: boolean;
  style: WishDisplayStyle;
};

/**
 * Tải lời chúc đã được chủ thiệp duyệt.
 * Dùng chung cho ô "sổ lưu bút" và chế độ overlay.
 */
export function usePublicWishes(): PublicWishesState {
  const data = useWeddingContent();
  const isReadOnly = useInvitationReadOnly();
  const [wishes, setWishes] = React.useState<PublicWish[]>([]);

  const enabled =
    data.showWishesOnCard === true &&
    !(data.hiddenSections ?? []).includes("rsvp");

  React.useEffect(() => {
    if (!enabled || isReadOnly) return;
    let alive = true;
    getWishes({ weddingSlug: data.weddingSlug })
      .then((res) => {
        if (alive && res.enabled && Array.isArray(res.wishes)) setWishes(res.wishes);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [enabled, isReadOnly, data.weddingSlug]);

  return {
    wishes,
    enabled,
    style: data.wishDisplayStyle === "overlay" ? "overlay" : "box",
  };
}
