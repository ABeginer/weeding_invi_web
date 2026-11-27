import { json } from "@/lib/server/http";
import { opsRoute } from "@/lib/server/ops";
import { db } from "@/lib/server/supabase";
import type { DesignerCanvasContent, DesignerPage } from "@/components/ops/designer-types";

interface StyleSeed {
  name: string;
  ritual: string;
  background: string;
  ink: string;
  accent: string;
  serif: string;
  script: string;
}

const STYLES: StyleSeed[] = [
  { name: "Đào Phấn", ritual: "Vu Quy", background: "#FAF3F0", ink: "#6B3A3A", accent: "#B87D74", serif: "var(--font-playfair)", script: "var(--font-nautigal)" },
  { name: "Lục Xuân", ritual: "Thành Hôn", background: "#F3EFE6", ink: "#2C3A2C", accent: "#4A5D4E", serif: "var(--font-eb-garamond)", script: "var(--font-pinyon)" },
  { name: "Kim Hỏa", ritual: "Báo Hỷ", background: "#FBF4E4", ink: "#4A3416", accent: "#C5A059", serif: "var(--font-playfair)", script: "var(--font-viaoda)" },
  { name: "Ren Trắng", ritual: "Vu Quy", background: "#FBFAF7", ink: "#2C2523", accent: "#A99A86", serif: "var(--font-cormorant)", script: "var(--font-pinyon)" },
  { name: "Mộc Nâu", ritual: "Thành Hôn", background: "#F6F0E7", ink: "#3B2A20", accent: "#8D6F32", serif: "var(--font-playfair)", script: "var(--font-nautigal)" },
  { name: "Chibi Hồng", ritual: "Báo Hỷ", background: "#FFF1F3", ink: "#5A2B3A", accent: "#E08A9B", serif: "var(--font-playfair)", script: "var(--font-carattere)" },
  { name: "Tử Đằng", ritual: "Vu Quy", background: "#F5F1F7", ink: "#3E2A4A", accent: "#9B7FB5", serif: "var(--font-cormorant)", script: "var(--font-pinyon)" },
  { name: "Mai Lanh", ritual: "Thành Hôn", background: "#FBF8EC", ink: "#4A3A12", accent: "#D4AF37", serif: "var(--font-playfair)", script: "var(--font-nautigal)" },
  { name: "Bạch Sứ", ritual: "Vu Quy", background: "#FCFBF8", ink: "#2F3A3C", accent: "#8FA6A9", serif: "var(--font-eb-garamond)", script: "var(--font-pinyon)" },
  { name: "Riviera", ritual: "Báo Hỷ", background: "#F1F6F7", ink: "#1F3A40", accent: "#3F7C86", serif: "var(--font-eb-garamond)", script: "var(--font-viaoda)" },
  { name: "Rượu Vang", ritual: "Thành Hôn", background: "#F7EFEA", ink: "#3A1A1F", accent: "#7C2D3A", serif: "var(--font-playfair)", script: "var(--font-nautigal)" },
  { name: "Lan Ngọc", ritual: "Vu Quy", background: "#F0F5F1", ink: "#22362B", accent: "#5E8C6A", serif: "var(--font-cormorant)", script: "var(--font-carattere)" },
];

function text(page: DesignerPage, style: StyleSeed, id: string, yPct: number, text: string, fontSize: number, placeholder: string | null, font: string): void {
  page.elements.push({
    id,
    type: "text",
    xPct: 10,
    yPct,
    wPct: 80,
    text,
    fontSize,
    color: style.ink,
    fontFamily: font,
    placeholder,
  });
}

export const POST = opsRoute(async (_req, admin) => {
  const client = db();
  const { data: existing, error: existingError } = await client
    .from("designer_templates")
    .select("name");
  if (existingError) throw existingError;
  const taken = new Set((existing ?? []).map((row) => String(row.name)));

  let imported = 0;
  for (const style of STYLES) {
    if (taken.has(style.name)) continue;

    const cover: DesignerPage = {
      id: `cover-${style.name}`,
      name: "Bìa",
      background: style.background,
      elements: [],
    };
    text(cover, style, `${style.name}-salutation`, 10, "Trân trọng kính mời", 12, "salutation", style.serif);
    text(cover, style, `${style.name}-guest`, 14, "Bạn Thanh Mai", 24, "guestName", style.serif);
    text(cover, style, `${style.name}-title`, 30, style.name, 40, null, style.serif);
    text(cover, style, `${style.name}-tag`, 38, "THIỆP CƯỚI TRỰC TUYẾN", 12, null, style.serif);
    text(cover, style, `${style.name}-groom`, 48, "Minh Khôi", 34, "groom", style.script);
    text(cover, style, `${style.name}-bride`, 56, "Thảo Nguyên", 34, "bride", style.script);
    text(cover, style, `${style.name}-date`, 68, "20.03.2027", 14, "date", style.serif);
    text(cover, style, `${style.name}-venue`, 74, "White Palace, TP.HCM", 12, "venue", style.serif);

    const content: DesignerPage = {
      id: `content-${style.name}`,
      name: "Nội dung",
      background: style.background,
      elements: [],
    };
    text(content, style, `${style.name}-c-heading`, 12, "Lời mời", 32, null, style.serif);
    text(content, style, `${style.name}-c-couple`, 24, "Minh Khôi & Thảo Nguyên", 26, null, style.script);
    text(content, style, `${style.name}-c-date`, 34, "Chủ nhật · 14.03.2027", 16, null, style.serif);
    text(content, style, `${style.name}-c-venue`, 42, "White Palace, TP.HCM", 14, null, style.serif);
    text(content, style, `${style.name}-c-note`, 56, "Sự hiện diện của bạn là món quà trân quý nhất.", 14, null, style.serif);

    const canvas: DesignerCanvasContent = {
      width: 390,
      height: 844,
      background: style.background,
      elements: cover.elements,
      pages: [cover, content],
    };

    const { error } = await client.from("designer_templates").insert({
      name: style.name,
      plan: "free",
      ritual: style.ritual,
      status: "draft",
      created_by: admin.email ?? "ops",
      canvas_json: canvas,
    });
    if (error) throw error;
    imported += 1;
  }

  return json({ imported });
});
