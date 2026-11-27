"use client";

import * as React from "react";
import {
  getEntranceCssVars,
  getExitCssVars,
  getLoopCssVars,
  isEntrancePreset,
  isExitPreset,
  isLoopPreset,
  isTextPreset,
} from "./animation-catalog";
import "@/styles/designer-animations.css";
import type {
  DesignerElementAnimation,
  DesignerEntranceAnimation,
  DesignerLoopAnimation,
} from "@/components/ops/designer-types";

interface ElementAnimatorProps {
  animation?: DesignerElementAnimation;
  /** Thứ tự trong trang, dùng cho stagger của màn hình đầu. */
  order?: number;
  children: React.ReactNode;
  className?: string;
  /** Editor "Phát thử": chạy ngay, không chờ IntersectionObserver. */
  autoPlay?: boolean;
  /** Wrapper con cần cao 100% (box/photo); text/image để auto để observer đo đúng. */
  fill?: boolean;
  /** Văn bản đã resolve cho typewriter/wordsIn (giữ nguyên dấu tiếng Việt). */
  text?: string;
  /** Ảnh dùng làm alpha mask cho hiệu ứng shimmer (PNG/WebP). */
  shimmerMaskUrl?: string;
}

type VisibleCallback = (visible: boolean, ratio: number) => void;

interface ObserverRecord {
  callback: VisibleCallback;
  threshold: number;
}

let sharedObserver: IntersectionObserver | null = null;
let observerHasFired = false;
const observerRecords = new Map<Element, ObserverRecord>();

function getSharedObserver(): IntersectionObserver | null {
  if (typeof window === "undefined") return null;
  if (sharedObserver) return sharedObserver;

  const thresholds = Array.from({ length: 19 }, (_, index) =>
    Number((index * 0.05).toFixed(2)),
  );

  sharedObserver = new IntersectionObserver(
    (entries) => {
      observerHasFired = true;
      for (const entry of entries) {
        const record = observerRecords.get(entry.target);
        if (!record) continue;
        const visible =
          entry.isIntersecting && entry.intersectionRatio >= record.threshold;
        record.callback(visible, entry.intersectionRatio);
      }
    },
    {
      root: null,
      rootMargin: "0px 0px -8% 0px",
      threshold: thresholds,
    },
  );

  return sharedObserver;
}

function observeElement(
  element: Element,
  callback: VisibleCallback,
  threshold: number,
): () => void {
  const observer = getSharedObserver();
  if (!observer) return () => undefined;

  observerRecords.set(element, { callback, threshold });
  observer.observe(element);

  return () => {
    observerRecords.delete(element);
    observer.unobserve(element);
  };
}

function isInViewport(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

// ----- Loop manager: tối đa 12 loop gần tâm màn hình -----
interface LoopEntry {
  element: Element;
  setRunning: (running: boolean) => void;
}

const loopEntries = new Map<Element, LoopEntry>();
let loopListenersAttached = false;
let loopRefreshFrame = 0;

function refreshLoops() {
  loopRefreshFrame = 0;
  if (typeof window === "undefined") return;
  const hidden = document.visibilityState === "hidden";
  const viewportCenter = window.innerHeight / 2;
  const candidates: { entry: LoopEntry; distance: number }[] = [];

  for (const entry of loopEntries.values()) {
    if (hidden || entry.element.getAttribute("data-loop-ready") !== "true") {
      entry.setRunning(false);
      continue;
    }
    const rect = entry.element.getBoundingClientRect();
    const visible = rect.bottom > 0 && rect.top < window.innerHeight;
    if (!visible) {
      entry.setRunning(false);
      continue;
    }
    candidates.push({
      entry,
      distance: Math.abs(rect.top + rect.height / 2 - viewportCenter),
    });
  }

  candidates.sort((a, b) => a.distance - b.distance);
  candidates.forEach((item, index) => {
    item.entry.setRunning(index < 12);
  });
}

function scheduleLoopRefresh() {
  if (typeof window === "undefined") return;
  if (loopRefreshFrame) return;
  loopRefreshFrame = window.requestAnimationFrame(refreshLoops);
}

function attachLoopListeners() {
  if (loopListenersAttached || typeof window === "undefined") return;
  loopListenersAttached = true;
  window.addEventListener("scroll", scheduleLoopRefresh, { passive: true });
  window.addEventListener("resize", scheduleLoopRefresh);
  document.addEventListener("visibilitychange", scheduleLoopRefresh);
}

function registerLoop(element: Element, setRunning: (value: boolean) => void) {
  loopEntries.set(element, { element, setRunning });
  attachLoopListeners();
  scheduleLoopRefresh();
  return () => {
    loopEntries.delete(element);
    scheduleLoopRefresh();
  };
}

// ----- Parallax manager: một scroll listener dùng chung -----
interface ParallaxEntry {
  element: HTMLElement;
  factor: number;
}

const parallaxEntries = new Map<HTMLElement, ParallaxEntry>();
let parallaxListenersAttached = false;
let parallaxFrame = 0;

function updateParallax() {
  parallaxFrame = 0;
  if (typeof window === "undefined") return;
  if (prefersReducedMotion()) {
    for (const entry of parallaxEntries.values()) {
      entry.element.style.setProperty("--parallax-y", "0px");
    }
    return;
  }
  const vh = window.innerHeight;
  for (const entry of parallaxEntries.values()) {
    const rect = entry.element.getBoundingClientRect();
    if (rect.bottom < -160 || rect.top > vh + 160) continue;
    const progress = Math.min(
      1,
      Math.max(0, (vh - rect.top) / (vh + rect.height)),
    );
    const offset = (progress - 0.5) * entry.factor;
    entry.element.style.setProperty("--parallax-y", `${offset.toFixed(2)}px`);
  }
}

function scheduleParallax() {
  if (typeof window === "undefined") return;
  if (parallaxFrame) return;
  parallaxFrame = window.requestAnimationFrame(updateParallax);
}

function attachParallaxListeners() {
  if (parallaxListenersAttached || typeof window === "undefined") return;
  parallaxListenersAttached = true;
  window.addEventListener("scroll", scheduleParallax, { passive: true });
  window.addEventListener("resize", scheduleParallax);
}

function registerParallax(element: HTMLElement, factor: number) {
  parallaxEntries.set(element, { element, factor });
  attachParallaxListeners();
  scheduleParallax();
  return () => {
    parallaxEntries.delete(element);
    element.style.removeProperty("--parallax-y");
  };
}

function graphemes(text: string): string[] {
  const normalized = text.normalize("NFC");
  const Segmenter = (
    Intl as unknown as {
      Segmenter?: new (
        locale: string,
        options: { granularity: "grapheme" },
      ) => { segment: (input: string) => Iterable<{ segment: string }> };
    }
  ).Segmenter;
  if (Segmenter) {
    return Array.from(new Segmenter("vi", { granularity: "grapheme" }).segment(normalized)).map(
      (part) => part.segment,
    );
  }
  return Array.from(normalized);
}

function entranceTextDuration(
  text: string,
  animation: DesignerEntranceAnimation,
  stagger: number,
): number {
  if (animation.preset === "typewriter") {
    const speed = Math.min(100, Math.max(5, animation.speed ?? 30));
    return animation.delay + (graphemes(text).length / speed) * 1000;
  }
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return animation.delay + words * stagger + 650;
}

/**
 * Chỉ animate nội dung bên trong wrapper vị trí/rotation của element.
 * Thứ tự wrapper: parallax → vào/ra → lặp → nội dung.
 */
export function ElementAnimator({
  animation,
  order = 0,
  children,
  className,
  autoPlay = false,
  fill = false,
  text,
  shimmerMaskUrl,
}: ElementAnimatorProps) {
  const entrance = animation?.in;
  const validEntrance =
    entrance && isEntrancePreset(entrance.preset) ? entrance : undefined;
  const loop =
    animation?.loop && isLoopPreset(animation.loop.preset)
      ? animation.loop
      : undefined;
  const exit =
    animation?.out && isExitPreset(animation.out.preset)
      ? animation.out
      : undefined;
  const parallaxFactor =
    typeof animation?.parallax?.factor === "number"
      ? Math.min(80, Math.max(-80, animation.parallax.factor))
      : 0;
  const stagger = Math.min(400, Math.max(20, animation?.stagger ?? 80));
  const textPreset = validEntrance ? isTextPreset(validEntrance.preset) : false;
  const reduced = React.useRef(false);

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const entranceRef = React.useRef<HTMLDivElement | null>(null);
  const loopRef = React.useRef<HTMLDivElement | null>(null);

  const [play, setPlay] = React.useState(autoPlay);
  const [willChange, setWillChange] = React.useState(autoPlay);
  const [entranceDone, setEntranceDone] = React.useState(!validEntrance);
  const [loopRunning, setLoopRunning] = React.useState(false);
  const [outPlay, setOutPlay] = React.useState(false);
  const startedRef = React.useRef(autoPlay);
  const initiallyVisibleRef = React.useRef(false);
  const visibleRef = React.useRef(true);
  const leftRef = React.useRef(false);
  const outResetTimerRef = React.useRef(0);
  const timersRef = React.useRef<number[]>([]);

  const clearTimers = React.useCallback(() => {
    for (const timer of timersRef.current) window.clearTimeout(timer);
    timersRef.current = [];
    if (outResetTimerRef.current) {
      window.clearTimeout(outResetTimerRef.current);
      outResetTimerRef.current = 0;
    }
  }, []);

  // Vào/Ra: observer dùng chung, stagger màn hình đầu, 3s fallback.
  React.useEffect(() => {
    if ((!validEntrance && !exit) || autoPlay) return;
    const element = entranceRef.current;
    if (!element) return;

    reduced.current = prefersReducedMotion();
    if (reduced.current) {
      startedRef.current = true;
      setPlay(true);
      setWillChange(false);
      setOutPlay(false);
      return;
    }

    initiallyVisibleRef.current = isInViewport(element);
    const once = validEntrance?.once !== false;
    const threshold = validEntrance
      ? Math.min(0.9, Math.max(0.05, validEntrance.threshold ?? 0.25))
      : 0.1;

    const start = () => {
      if (!validEntrance) return;
      if (startedRef.current && once) return;
      startedRef.current = true;
      setPlay(true);
      setWillChange(true);
    };

    if (element.getBoundingClientRect().bottom <= 0) {
      start();
      return () => clearTimers();
    }

    if (typeof IntersectionObserver === "undefined") {
      start();
      return () => clearTimers();
    }

    const safety = window.setTimeout(() => {
      if (!observerHasFired) start();
    }, 3000);
    timersRef.current.push(safety);

    const stopObserving = observeElement(
      element,
      (visible) => {
        visibleRef.current = visible;
        if (visible) {
          if (outResetTimerRef.current) {
            window.clearTimeout(outResetTimerRef.current);
            outResetTimerRef.current = 0;
          }
          setOutPlay(false);
          if (!validEntrance) {
            leftRef.current = false;
            return;
          }
          if (startedRef.current) {
            if (once) {
              setPlay(true);
              leftRef.current = false;
              return;
            }
            if (!leftRef.current) return;
            leftRef.current = false;
            startedRef.current = false;
            setPlay(false);
            setWillChange(false);
            setEntranceDone(false);
            const autoDelay =
              initiallyVisibleRef.current && validEntrance.delay === 0
                ? 150 + order * 120
                : validEntrance.delay;
            timersRef.current.push(
              window.setTimeout(start, autoDelay > 0 ? autoDelay : 16),
            );
            return;
          }
          leftRef.current = false;
          const autoDelay =
            initiallyVisibleRef.current && validEntrance.delay === 0
              ? 150 + order * 120
              : validEntrance.delay;
          timersRef.current.push(
            window.setTimeout(start, autoDelay > 0 ? autoDelay : 0),
          );
          return;
        }

        leftRef.current = true;
        if (exit && (startedRef.current || !validEntrance)) {
          setOutPlay(true);
          if (validEntrance && !once) {
            outResetTimerRef.current = window.setTimeout(() => {
              if (!visibleRef.current) {
                startedRef.current = false;
                setPlay(false);
                setWillChange(false);
                setEntranceDone(false);
              }
            }, exit.delay + exit.duration + 40);
          }
          return;
        }

        if (!once) {
          startedRef.current = false;
          setPlay(false);
          setWillChange(false);
          setEntranceDone(false);
        }
      },
      threshold,
    );

    return () => {
      clearTimers();
      stopObserving();
    };
  }, [autoPlay, clearTimers, exit, validEntrance, order]);

  // Khi "Vào" kết thúc mới bật "Lặp". Text preset không có animationend.
  React.useEffect(() => {
    if (!play || !validEntrance || entranceDone) return;
    if (reduced.current) {
      setEntranceDone(true);
      setWillChange(false);
      return;
    }
    const duration = textPreset && text
      ? entranceTextDuration(text, validEntrance, stagger)
      : validEntrance.delay + validEntrance.duration + 80;
    const timer = window.setTimeout(() => {
      setEntranceDone(true);
      setWillChange(false);
    }, Math.max(80, duration));
    timersRef.current.push(timer);
    return () => window.clearTimeout(timer);
  }, [play, validEntrance, entranceDone, text, textPreset, stagger]);

  // Loop manager cần biết khi "Vào" vừa xong để bật animation.
  React.useEffect(() => {
    if (entranceDone) scheduleLoopRefresh();
  }, [entranceDone]);

  // Loop: chỉ chạy khi đã vào xong, còn trong màn hình; manager chọn 12 gần tâm.
  React.useEffect(() => {
    if (!loop || !loopRef.current) return;
    const element = loopRef.current;
    const stop = registerLoop(element, (running) => {
      setLoopRunning(running && !prefersReducedMotion());
    });
    return () => {
      stop();
      setLoopRunning(false);
    };
  }, [loop]);

  // Parallax: một listener dùng chung; chỉ đổi CSS var, không đụng wrapper vị trí.
  React.useEffect(() => {
    if (!rootRef.current || parallaxFactor === 0) return;
    return registerParallax(rootRef.current, parallaxFactor);
  }, [parallaxFactor]);

  const innerClass = fill ? "h-full w-full" : "w-full";
  const hasAny = Boolean(validEntrance || exit || loop || parallaxFactor !== 0);
  if (!hasAny) {
    return <div className={className}>{children}</div>;
  }

  const entranceVars = validEntrance
    ? (getEntranceCssVars(validEntrance) as React.CSSProperties)
    : {};
  const exitVars = exit
    ? (getExitCssVars(exit) as React.CSSProperties)
    : {};
  const loopVars: React.CSSProperties = loop
    ? ({
        ...getLoopCssVars(loop),
        ...(loop.preset === "twinkle"
          ? { "--loop-delay": `-${(order * 173) % 2000}ms` }
          : {}),
      } as React.CSSProperties)
    : {};

  let content: React.ReactNode = children;
  if (textPreset && text && validEntrance) {
    const normalized = text.normalize("NFC");
    if (validEntrance.preset === "typewriter") {
      const chars = graphemes(normalized);
      const speed = Math.min(100, Math.max(5, validEntrance.speed ?? 30));
      content = chars.map((char, index) => (
        <span
          key={`${index}-${char}`}
          className="anim-char"
          style={
            {
              "--char-delay": `${((index / speed) * 1000).toFixed(0)}ms`,
            } as React.CSSProperties
          }
        >
          {char}
        </span>
      ));
    } else {
      const parts = normalized.split(/(\s+)/);
      let wordIndex = 0;
      content = parts.map((part, index) => {
        if (!part) return null;
        if (/^\s+$/.test(part)) return <React.Fragment key={`s-${index}`}>{part}</React.Fragment>;
        const delay = validEntrance.delay + wordIndex * stagger;
        wordIndex += 1;
        return (
          <span
            key={`w-${index}`}
            className="anim-word"
            style={
              {
                "--word-delay": `${delay}ms`,
              } as React.CSSProperties
            }
          >
            {part}
          </span>
        );
      });
    }
  }

  return (
    <div
      ref={rootRef}
      className={className}
      style={
        parallaxFactor !== 0
          ? { transform: "translateY(var(--parallax-y, 0px))" }
          : undefined
      }
    >
      <div
        className={innerClass}
        data-anim-out={exit?.preset}
        data-anim-out-play={outPlay ? "true" : undefined}
        style={exitVars}
      >
        <div
          ref={entranceRef}
          className={innerClass}
          data-anim-in={validEntrance && !textPreset ? validEntrance.preset : undefined}
          data-anim-dir={validEntrance && !textPreset ? validEntrance.direction : undefined}
          data-anim-play={
            validEntrance && !textPreset && play ? "true" : undefined
          }
          data-text-play={textPreset ? (play ? "true" : "false") : undefined}
          style={{
            ...entranceVars,
            ...(textPreset ? { whiteSpace: "pre-wrap" as const } : {}),
            ...(validEntrance && !textPreset
              ? {
                  willChange: willChange
                    ? "transform, opacity, clip-path, filter"
                    : undefined,
                }
              : {}),
          }}
          onAnimationEnd={(event) => {
            if (event.target !== entranceRef.current) return;
            if (!event.animationName.startsWith("anim-")) return;
            setWillChange(false);
            setEntranceDone(true);
          }}
        >
          <div
            ref={loopRef}
            className={innerClass}
            data-loop={loop?.preset}
            data-loop-play={loopRunning ? "true" : undefined}
            data-loop-ready={entranceDone ? "true" : "false"}
            data-shimmer-mask={
              shimmerMaskUrl && loop?.preset === "shimmer" ? "true" : undefined
            }
            style={{
              ...loopVars,
              ...(shimmerMaskUrl && loop?.preset === "shimmer"
                ? { "--shimmer-mask": `url("${shimmerMaskUrl}")` }
                : {}),
              willChange: loopRunning ? "transform, opacity" : undefined,
            }}
          >
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}
