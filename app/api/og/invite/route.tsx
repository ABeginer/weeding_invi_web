import { ImageResponse } from "next/og";

export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;

function clean(value: string | null, max: number): string {
  return (value ?? "").trim().slice(0, max);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const couple = clean(url.searchParams.get("couple"), 80) || "Thiệp cưới online";
  const guest = clean(url.searchParams.get("guest"), 60);
  const date = clean(url.searchParams.get("date"), 40);
  const style = clean(url.searchParams.get("style"), 20);

  const palette =
    style === "sage"
      ? { bg: "#F3EFE6", ink: "#2C2523", accent: "#4A5D4E", soft: "#DCE3D8" }
      : style === "blush"
        ? { bg: "#FAF3F0", ink: "#2C2523", accent: "#B87D74", soft: "#F0DBD4" }
        : { bg: "#FAF8F5", ink: "#2C2523", accent: "#C5A059", soft: "#EFE4CE" };

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
          padding: 64,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 28,
            border: `1px solid ${palette.accent}`,
            opacity: 0.45,
          }}
        />
        <div
          style={{
            display: "flex",
            fontSize: 20,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: palette.accent,
          }}
        >
          Thiệp cưới trực tuyến
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 26,
            fontSize: 66,
            fontWeight: 600,
            textAlign: "center",
            lineHeight: 1.15,
          }}
        >
          {couple}
        </div>
        {date ? (
          <div style={{ display: "flex", marginTop: 16, fontSize: 28, opacity: 0.75 }}>
            {date}
          </div>
        ) : null}
        {guest ? (
          <div
            style={{
              display: "flex",
              marginTop: 44,
              padding: "16px 36px",
              borderRadius: 999,
              backgroundColor: palette.soft,
              fontSize: 30,
              fontWeight: 500,
            }}
          >
            Trân trọng kính mời: {guest}
          </div>
        ) : null}
        <div style={{ display: "flex", marginTop: 30, fontSize: 18, opacity: 0.6 }}>
          inviwedd.vn
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
      },
    },
  );
}
