import { ImageResponse } from "next/og";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";

const WIDTH = 1200;
const HEIGHT = 630;

function clean(value: string | null, max: number): string {
  return (value ?? "").trim().slice(0, max);
}

export async function GET(request: Request) {
  const limited = rateLimit(request, "og-invite", 60, 60_000);
  if (!limited.ok) return tooManyRequests(limited);

  const url = new URL(request.url);
  const couple = clean(url.searchParams.get("couple"), 80) || "Thiệp cưới online";
  const guest = clean(url.searchParams.get("guest"), 60);
  const date = clean(url.searchParams.get("date"), 40);
  const style = clean(url.searchParams.get("style"), 20);

  // Modern Editorial Luxury Palettes
  const palette =
    style === "sage"
      ? {
          bg: "#F4F7F4",
          ink: "#1F1D1A",
          muted: "#5A655C",
          accent: "#2F6F4E",
          gold: "#A89472",
          soft: "#E2ECE5",
          border: "#D2DFD6",
        }
      : style === "blush"
        ? {
            bg: "#FAF5F5",
            ink: "#1F1D1A",
            muted: "#6B5E60",
            accent: "#8B3A44",
            gold: "#B89B72",
            soft: "#F5E6E8",
            border: "#EAD5D8",
          }
        : {
            bg: "#FAF8F5",
            ink: "#1F1D1A",
            muted: "#6B655E",
            accent: "#7A1C24",
            gold: "#B89B72",
            soft: "#F4EFEA",
            border: "#E8E2D9",
          };

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: palette.bg,
          color: palette.ink,
          padding: "60px 80px", // Minimum 80px horizontal, 60px vertical safe-zone
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        {/* Subtle decorative luxury border */}
        <div
          style={{
            position: "absolute",
            inset: 32,
            border: `1px solid ${palette.gold}`,
            opacity: 0.4,
            pointerEvents: "none",
          }}
        />

        {/* Eyebrow */}
        <div
          style={{
            display: "flex",
            fontSize: 18,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: palette.accent,
            fontWeight: 600,
          }}
        >
          Thiệp cưới trực tuyến
        </div>

        {/* Couple names */}
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 62,
            fontWeight: 700,
            textAlign: "center",
            lineHeight: 1.18,
            color: palette.ink,
            maxWidth: 1000,
            justifyContent: "center",
          }}
        >
          {couple}
        </div>

        {/* Ceremony date */}
        {date ? (
          <div
            style={{
              display: "flex",
              marginTop: 14,
              fontSize: 26,
              color: palette.muted,
              fontWeight: 500,
              letterSpacing: 1,
            }}
          >
            {date}
          </div>
        ) : null}

        {/* Personalized guest invitation pill */}
        {guest ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: 36,
              padding: "14px 38px",
              borderRadius: 999,
              backgroundColor: palette.soft,
              border: `1px solid ${palette.border}`,
              fontSize: 28,
              fontWeight: 600,
              color: palette.accent,
              boxShadow: "0 2px 8px rgba(31,29,26,0.04)",
            }}
          >
            Trân trọng kính mời: {guest}
          </div>
        ) : null}

        {/* Brand signature */}
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 16,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: palette.muted,
            opacity: 0.7,
          }}
        >
          inviwedd.vn
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        "Cache-Control":
          "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    },
  );
}
