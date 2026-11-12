"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

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
  const [mounted, setMounted] = React.useState(false);
  const ref = React.useRef<HTMLElement | null>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);

    if (prefersReducedMotion) {
      setVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const checkPosition = () => {
      const rect = node.getBoundingClientRect();
      // Reveal when section enters viewport OR is already above the viewport (e.g. fast fling / deep jump)
      if (rect.top <= window.innerHeight * 0.96) {
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
      { threshold: 0.02 }
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
  }, [prefersReducedMotion]);

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
          : { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }
      }
      className={cn("w-full", className)}
    >
      {children}
    </motion.section>
  );
}
