"use client";

import * as React from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";

let warnedMissingSiteKey = false;
let scriptLoadPromise: Promise<void> | null = null;

export function isTurnstileEnabled(): boolean {
  return SITE_KEY.length > 0;
}

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${TURNSTILE_SCRIPT_SRC}"]`,
    );
    if (existing) {
      if (window.turnstile) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Turnstile script load failed")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile script load failed"));
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

interface TurnstileWidgetProps {
  onTokenChange: (token: string | null) => void;
  resetSignal?: number;
  theme?: "light" | "dark" | "auto";
  className?: string;
}

export function TurnstileWidget({
  onTokenChange,
  resetSignal = 0,
  theme = "auto",
  className,
}: TurnstileWidgetProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const widgetIdRef = React.useRef<string | null>(null);
  const callbackRef = React.useRef(onTokenChange);
  callbackRef.current = onTokenChange;

  React.useEffect(() => {
    if (!SITE_KEY) {
      if (process.env.NODE_ENV !== "production" && !warnedMissingSiteKey) {
        warnedMissingSiteKey = true;
        console.warn(
          "[turnstile] NEXT_PUBLIC_TURNSTILE_SITE_KEY is not configured; Turnstile widget skipped.",
        );
      }
      return;
    }

    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        if (widgetIdRef.current !== null) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme,
          callback: (token) => callbackRef.current(token),
          "expired-callback": () => callbackRef.current(null),
          "error-callback": () => callbackRef.current(null),
        });
      })
      .catch(() => {
        callbackRef.current(null);
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Bỏ qua nếu widget đã gỡ
        }
        widgetIdRef.current = null;
      }
    };
  }, [theme]);

  React.useEffect(() => {
    if (!SITE_KEY || resetSignal === 0) return;
    callbackRef.current(null);
    if (widgetIdRef.current !== null && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {
        // Bỏ qua lỗi reset
      }
    }
  }, [resetSignal]);

  if (!SITE_KEY) return null;

  return <div ref={containerRef} className={className} />;
}

