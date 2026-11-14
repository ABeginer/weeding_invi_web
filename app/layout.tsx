import type { Metadata, Viewport } from "next";
import Script from "next/script";
import {
  Be_Vietnam_Pro,
  Carattere,
  Cormorant_Garamond,
  EB_Garamond,
  Lora,
  Pinyon_Script,
  Playfair_Display,
  The_Nautigal,
  Viaoda_Libre,
} from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { resolveAppBaseUrl, SITE_NAME } from "@/config/site";
import {
  BRAND_THEME_COOKIE_NAME,
  brandDarkTheme,
  brandLightTheme,
  generateBrandThemeCss,
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

// Các font trang trí trước đây tải qua @import (render-blocking); nay tự host
// bằng next/font và expose CSS variable cho templates/themed/theme-configs.ts.
const playfairDisplay = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-eb-garamond",
  display: "swap",
});

const viaodaLibre = Viaoda_Libre({
  subsets: ["latin", "vietnamese"],
  weight: ["400"],
  variable: "--font-viaoda",
  display: "swap",
});

const pinyonScript = Pinyon_Script({
  subsets: ["latin", "vietnamese"],
  weight: ["400"],
  variable: "--font-pinyon",
  display: "swap",
});

const theNautigal = The_Nautigal({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "700"],
  variable: "--font-nautigal",
  display: "swap",
});

const carattere = Carattere({
  subsets: ["latin", "vietnamese"],
  weight: ["400"],
  variable: "--font-carattere",
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

// Áp theme từ cookie trước khi paint để trang có thể static mà không nháy sáng/tối.
const brandThemeInitScript = `(function(){try{var m=document.cookie.match(new RegExp("(?:^|; )${BRAND_THEME_COOKIE_NAME}=(dark|light)"));if(m){document.documentElement.setAttribute("data-theme",m[1]);}}catch(e){}})();`;

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cfAnalyticsToken = process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN?.trim();

  return (
    <html
      lang="vi"
      data-theme="light"
      className={`${beVietnamPro.variable} ${cormorantGaramond.variable} ${lora.variable} ${playfairDisplay.variable} ${ebGaramond.variable} ${viaodaLibre.variable} ${pinyonScript.variable} ${theNautigal.variable} ${carattere.variable}`}
      suppressHydrationWarning
    >
      <head>
        <style
          id="brand-theme-css"
          dangerouslySetInnerHTML={{ __html: brandThemeCss }}
          suppressHydrationWarning
        />
        <script
          id="brand-theme-init"
          dangerouslySetInnerHTML={{ __html: brandThemeInitScript }}
        />
      </head>
      <body className="min-h-screen-dvh bg-bg text-text antialiased" suppressHydrationWarning>
        <ToastProvider>
          <ThemeProvider initialTheme="light">{children}</ThemeProvider>
        </ToastProvider>
        {cfAnalyticsToken ? (
          <Script
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: cfAnalyticsToken })}
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
