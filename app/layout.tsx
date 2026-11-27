import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Be_Vietnam_Pro, Cormorant_Garamond } from "next/font/google";
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
  weight: ["400", "500", "600"],
  variable: "--font-be-vietnam",
  display: "swap",
  preload: false,
  adjustFontFallback: true,
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
  preload: false,
  adjustFontFallback: true,
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
  title: {
    default: `Thiệp Cưới Online & Thiệp Cưới Điện Tử | ${SITE_NAME}`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Tạo thiệp cưới online hiện đại, cá nhân hóa tên từng khách gửi qua Zalo. Tích hợp xác nhận tham dự RSVP, mừng cưới QR và check-in chuyên nghiệp cùng Inviwedd.",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "/",
    siteName: SITE_NAME,
    title: `Thiệp Cưới Online & Thiệp Cưới Điện Tử | ${SITE_NAME}`,
    description:
      "Tạo thiệp cưới online hiện đại, cá nhân hóa tên từng khách gửi qua Zalo. Tích hợp xác nhận tham dự RSVP, mừng cưới QR và check-in chuyên nghiệp cùng Inviwedd.",
    images: [
      {
        url: "/images/og-cover.png",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - Nền tảng thiệp cưới online cao cấp`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Thiệp Cưới Online & Thiệp Cưới Điện Tử | ${SITE_NAME}`,
    description:
      "Tạo thiệp cưới online hiện đại, cá nhân hóa tên từng khách gửi qua Zalo. Tích hợp xác nhận tham dự RSVP, mừng cưới QR và check-in chuyên nghiệp cùng Inviwedd.",
    images: ["/images/og-cover.png"],
  },
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
      data-scroll-behavior="smooth"
      className={`${beVietnamPro.variable} ${cormorantGaramond.variable}`}
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
            strategy="lazyOnload"
          />
        ) : null}
      </body>
    </html>
  );
}
