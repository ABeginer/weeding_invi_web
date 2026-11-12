import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Be_Vietnam_Pro, Cormorant_Garamond, Lora } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { resolveAppBaseUrl, SITE_NAME } from "@/config/site";
import {
  BRAND_THEME_COOKIE_NAME,
  brandDarkTheme,
  brandLightTheme,
  generateBrandThemeCss,
  parseBrandTheme,
} from "@/lib/brand-theme";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-be-vietnam",
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const lora = Lora({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-lora",
  display: "swap",
});

function resolveMetadataBase(): URL | undefined {
  try {
    return new URL(resolveAppBaseUrl());
  } catch {
    return undefined;
  }
}

const brandThemeCss = generateBrandThemeCss();

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: `Thiệp Cưới Online | ${SITE_NAME}`,
  description:
    "Nền tảng tạo và quản lý thiệp cưới online cá nhân hóa tên từng vị khách.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: brandLightTheme.bg },
    { media: "(prefers-color-scheme: dark)", color: brandDarkTheme.bg },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialTheme = parseBrandTheme(
    cookieStore.get(BRAND_THEME_COOKIE_NAME)?.value,
  );

  return (
    <html
      lang="vi"
      data-theme={initialTheme}
      className={`${beVietnamPro.variable} ${cormorantGaramond.variable} ${lora.variable}`}
      suppressHydrationWarning
    >
      <head>
        <style
          id="brand-theme-css"
          dangerouslySetInnerHTML={{ __html: brandThemeCss }}
        />
      </head>
      <body className="min-h-screen-dvh bg-bg text-text antialiased">
        <ToastProvider>
          <ThemeProvider initialTheme={initialTheme}>{children}</ThemeProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
