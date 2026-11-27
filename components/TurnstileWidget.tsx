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

/**
 * Cho phép thử lại sau khi tải script thất bại: xoá promise đã reject và thẻ
 * script lỗi, nếu không lần thử sau sẽ dùng lại promise cũ và treo mãi.
 */
function resetTurnstileScript(): void {
  scriptLoadPromise = null;
  if (typeof document === "undefined") return;
  document
    .querySelectorAll<HTMLScriptElement>(`script[src="${TURNSTILE_SCRIPT_SRC}"]`)
    .forEach((element) => element.remove());
}

interface TurnstileWidgetProps {
  onTokenChange: (token: string | null) => void;
  resetSignal?: number;
  theme?: "light" | "dark" | "auto";
  className?: string;
}

type WidgetStatus = "loading" | "ready" | "error";

export function TurnstileWidget({
  onTokenChange,
  resetSignal = 0,
  theme = "auto",
  className,
}: TurnstileWidgetProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const widgetIdRef = React.useRef<string | null>(null);
  const callbackRef = React.useRef(onTokenChange);

  React.useEffect(() => {
    callbackRef.current = onTokenChange;
  }, [onTokenChange]);

  const [status, setStatus] = React.useState<WidgetStatus>(
    SITE_KEY ? "loading" : "ready",
  );
  const [retryKey, setRetryKey] = React.useState(0);

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
    setStatus("loading");

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
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        // Cho phép lần thử sau tải lại script từ đầu.
        scriptLoadPromise = null;
        callbackRef.current(null);
        setStatus("error");
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
  }, [theme, retryKey]);

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

  const handleRetry = () => {
    callbackRef.current(null);
    resetTurnstileScript();
    setStatus("loading");
    setRetryKey((key) => key + 1);
  };

  return (
    <div className={className}>
      {status === "loading" && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-center gap-2 py-2 text-xs text-text-muted"
        >
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          <span>Đang tải xác thực bảo mật...</span>
        </div>
      )}
      <div ref={containerRef} />
      {status === "error" && (
        <div role="alert" className="w-full text-center">
          <p className="text-xs text-danger-fg">
            Không tải được phần xác thực chống spam. Vui lòng kiểm tra kết nối
            mạng rồi thử lại.
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-1.5 inline-flex h-9 cursor-pointer items-center justify-center rounded-full border border-border bg-surface px-4 text-xs font-semibold text-text transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            Thử lại
          </button>
        </div>
      )}
    </div>
  );
}
