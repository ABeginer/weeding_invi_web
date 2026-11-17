"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useInvitationContained, useWeddingContent } from "./WeddingContentProvider";

interface RevealSectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  delay?: number;
}

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

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={false}
      animate={
        reducedMotion || visible
          ? { opacity: 1, y: 0 }
          : { opacity: 0, y: 20 }
      }
      transition={
        reducedMotion
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
    </motion.section>
  );
}
