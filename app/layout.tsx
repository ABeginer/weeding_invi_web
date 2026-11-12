import type { Metadata, Viewport } from "next";
import {
  Be_Vietnam_Pro,
  Cormorant_Garamond,
  Great_Vibes,
  Lora,
  Pinyon_Script,
} from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import { invitationTheme } from "@/lib/theme";
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

const greatVibes = Great_Vibes({
  subsets: ["vietnamese", "latin"],
  weight: "400",
  variable: "--font-great-vibes",
  display: "swap",
});

const pinyonScript = Pinyon_Script({
  subsets: ["vietnamese", "latin"],
  weight: "400",
  variable: "--font-pinyon",
  display: "swap",
});

function resolveMetadataBase(): URL | undefined {
  const raw = process.env.APP_BASE_URL;
  if (!raw) return undefined;
  try {
    return new URL(raw);
  } catch {
    return undefined;
  }
}

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: "Thiệp Cưới Online",
  description: "Nền tảng tạo và quản lý thiệp cưới cá nhân hóa trực tuyến.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: invitationTheme.bg,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${cormorantGaramond.variable} ${lora.variable} ${greatVibes.variable} ${pinyonScript.variable}`}
    >
      <body className="min-h-screen bg-bg text-fg antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
