"use client";

import * as React from "react";
import { m, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { useInvitationContained, useWeddingContent } from "./WeddingContentProvider";

interface RevealSectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  delay?: number;
}

/** Nhịp trễ giữa hai phần tử liên tiếp trong một section của Vườn Ô Liu. */
const OLIVE_STAGGER_MS = 95;
/** Chặn trên để section nhiều phần tử không phải chờ quá lâu. */
const OLIVE_STAGGER_CAP = 7;

export function RevealSection({
  children,
  className,
  id,
  delay = 0,
}: RevealSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const contained = useInvitationContained();
  const data = useWeddingContent();
  const isOlive = data.templateId === "basic-1";
  const animateInContained = contained && isOlive;
  const [mounted, setMounted] = React.useState(false);
  const ref = React.useRef<HTMLElement | null>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);

    if (prefersReducedMotion || contained) {
      setVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const checkPosition = () => {
      const rect = node.getBoundingClientRect();
      // Chỉ reveal khi ít nhất 1/2 chiều cao viewport của section đã vào màn hình.
      const visiblePx =
        Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
      if (visiblePx >= window.innerHeight / 2) {
        setVisible(true);
        return true;
      }
      return false;
    };

    if (checkPosition()) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(node);
    const onScroll = () => {
      if (checkPosition()) {
        observer.disconnect();
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [prefersReducedMotion, contained, animateInContained]);

  const reducedMotion = mounted && Boolean(prefersReducedMotion);

  // Vườn Ô Liu: khối không tự animate nữa. Mỗi phần tử con (chữ/ảnh) nhận một
  // nhịp trễ tăng dần theo thứ tự DOM, nên section hiện ra từng cái một thay
  // vì cả khối trượt cùng lúc. Chạy sau mount, trước khi `.is-revealed` bật.
  React.useEffect(() => {
    if (!isOlive) return;
    const node = ref.current;
    if (!node) return;
    const items = node.querySelectorAll<HTMLElement>(
      "h1, h2, h3, h4, p, label, img",
    );
    items.forEach((item, index) => {
      item.style.setProperty(
        "--olive-delay",
        `${Math.min(index, OLIVE_STAGGER_CAP) * OLIVE_STAGGER_MS}ms`,
      );
    });
  }, [isOlive]);

  return (
    <m.section
      ref={ref}
      id={id}
      initial={false}
      animate={
        isOlive
          ? undefined
          : reducedMotion || visible
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y: 20 }
      }
      transition={
        isOlive
          ? undefined
          : reducedMotion
            ? { duration: 0.01 }
            : { duration: 1.5, delay, ease: [0.22, 1, 0.36, 1] }
      }
      className={cn(
        "w-full",
        isOlive && "olive-reveal",
        isOlive && visible && "is-revealed",
        className,
      )}
    >
      {children}
    </m.section>
  );
}
