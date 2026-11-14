"use client";

import * as React from "react";
import { useToast } from "@/components/ui/Toast";
import { updateMyTheme } from "@/lib/api";
import {
  BRAND_THEME_COOKIE_MAX_AGE,
  BRAND_THEME_COOKIE_NAME,
  type BrandThemeMode,
} from "@/lib/brand-theme";

interface ThemeContextValue {
  theme: BrandThemeMode;
  isAuthenticated: boolean;
  userEmail: string | null;
  setTheme: (next: BrandThemeMode, options?: { silent?: boolean }) => Promise<void>;
  toggleTheme: () => Promise<void>;
  adoptAccountTheme: (accountTheme: BrandThemeMode) => void;
  setSessionInfo: (info: { isAuthenticated: boolean; email?: string | null }) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function writeThemeCookie(mode: BrandThemeMode): void {
  if (typeof document === "undefined") return;
  document.cookie = `${BRAND_THEME_COOKIE_NAME}=${mode}; path=/; max-age=${BRAND_THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
}

function applyThemeToDocument(mode: BrandThemeMode): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const previous = root.dataset.theme;
  root.dataset.theme = mode;

  // Hiệu ứng tràn màu mượt khi người dùng chủ động đổi sáng/tối.
  if (previous && previous !== mode) {
    root.classList.add("theme-switching");
    window.setTimeout(() => root.classList.remove("theme-switching"), 420);
  }
}

/** Script inline trong <head> đã áp theme từ cookie trước khi React hydrate. */
function readThemeFromDom(): BrandThemeMode | null {
  if (typeof document === "undefined") return null;
  const value = document.documentElement.dataset.theme;
  return value === "dark" || value === "light" ? value : null;
}

export function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: BrandThemeMode;
  children: React.ReactNode;
}) {
  const { showToast } = useToast();
  const [theme, setThemeState] = React.useState<BrandThemeMode>(initialTheme);

  // Giữ hydration khớp với server (initialTheme), sau đó đồng bộ theo theme mà
  // script inline đã đọc từ cookie.
  React.useEffect(() => {
    const domTheme = readThemeFromDom();
    if (domTheme) setThemeState(domTheme);
  }, []);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [announcement, setAnnouncement] = React.useState("");

  React.useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  const setSessionInfo = React.useCallback(
    (info: { isAuthenticated: boolean; email?: string | null }) => {
      setIsAuthenticated(info.isAuthenticated);
      if (info.email !== undefined) {
        setUserEmail(info.email);
      }
    },
    [],
  );

  const adoptAccountTheme = React.useCallback((accountTheme: BrandThemeMode) => {
    setThemeState((prev) => {
      if (prev === accountTheme) {
        writeThemeCookie(accountTheme);
        return prev;
      }
      applyThemeToDocument(accountTheme);
      writeThemeCookie(accountTheme);
      return accountTheme;
    });
  }, []);

  const setTheme = React.useCallback(
    async (next: BrandThemeMode, options?: { silent?: boolean }) => {
      setThemeState(next);
      applyThemeToDocument(next);
      writeThemeCookie(next);

      if (!options?.silent) {
        setAnnouncement(
          next === "dark"
            ? "Đã chuyển sang giao diện tối."
            : "Đã chuyển sang giao diện sáng.",
        );
      }

      if (!isAuthenticated) {
        return;
      }

      try {
        await updateMyTheme(next);
      } catch {
        showToast("Chưa lưu được vào tài khoản", "info");
      }
    },
    [isAuthenticated, showToast],
  );

  const toggleTheme = React.useCallback(async () => {
    const next: BrandThemeMode = theme === "dark" ? "light" : "dark";
    await setTheme(next);
  }, [setTheme, theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isAuthenticated,
        userEmail,
        setTheme,
        toggleTheme,
        adoptAccountTheme,
        setSessionInfo,
      }}
    >
      {children}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </ThemeContext.Provider>
  );
}

export function useBrandTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useBrandTheme phải được dùng bên trong ThemeProvider.");
  }
  return ctx;
}

