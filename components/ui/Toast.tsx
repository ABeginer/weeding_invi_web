"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = React.useCallback(
    (message: string, type: ToastType = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      window.setTimeout(() => {
        removeToast(id);
      }, 3200);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 left-4 z-50 flex flex-col items-end gap-2 sm:left-auto sm:w-full sm:max-w-sm"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full items-center gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lg transition-all",
              toast.type === "success" &&
                "border-success-border bg-success-bg text-success-fg",
              toast.type === "error" &&
                "border-danger-border bg-danger-bg text-danger-fg",
              toast.type === "info" &&
                "border-border bg-surface text-fg"
            )}
          >
            {toast.type === "success" && (
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            {toast.type === "error" && (
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            {toast.type === "info" && (
              <Info className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            )}
            <span className="flex-1 font-medium">{toast.message}</span>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Đóng thông báo"
              className="inline-flex h-6 w-6 items-center justify-center rounded-md opacity-70 hover:opacity-100 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast phải được sử dụng bên trong ToastProvider");
  }
  return ctx;
}

