/**
 * Bảng gợi ý 4 bộ màu trang phục đám cưới (dress code) dễ mặc theo thời gian
 * và không gian tiệc, giúp khách không tốn kém mua đồ mới.
 */
import * as React from "react";
import { Shirt, Sparkles, Sun, Sunset } from "lucide-react";

interface PalettePreset {
  id: string;
  timeAndVenue: string;
  paletteTitle: string;
  colors: ReadonlyArray<{ name: string; swatchClass: string }>;
  whyGuestsLikeIt: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DRESS_CODE_PALETTES: readonly PalettePreset[] = [
  {
    id: "daytime-garden",
    timeAndVenue: "Tiệc trưa hoặc sân vườn ngoài trời",
    paletteTitle: "Kem – Be – Nâu nhạt – Trắng ngà",
    colors: [
      { name: "Kem", swatchClass: "bg-[#F5EFE6]" },
      { name: "Be cát", swatchClass: "bg-[#DFD3C3]" },
      { name: "Nâu ấm", swatchClass: "bg-[#A98B73]" },
      { name: "Trắng ngà", swatchClass: "bg-[#FAF8F5]" },
    ],
    whyGuestsLikeIt: "Hầu hết tủ đồ công sở và dạo phố đều có sẵn áo sơ mi hoặc váy sáng màu.",
    icon: Sun,
  },
  {
    id: "pastel-soft",
    timeAndVenue: "Tiệc gia đình nhẹ nhàng trong sảnh sáng",
    paletteTitle: "Xanh bơ – Hồng phấn – Ghi sáng – Kem",
    colors: [
      { name: "Xanh bơ", swatchClass: "bg-[#9CAF88]" },
      { name: "Hồng phấn", swatchClass: "bg-[#E6C7C2]" },
      { name: "Ghi sáng", swatchClass: "bg-[#CBD0D3]" },
      { name: "Kem sữa", swatchClass: "bg-[#F3ECE1]" },
    ],
    whyGuestsLikeIt: "Lên ảnh tự nhiên tôn da, rất dễ phối đồ mà không sợ trùng váy cô dâu.",
    icon: Sparkles,
  },
  {
    id: "evening-formal",
    timeAndVenue: "Tiệc tối khách sạn / Sảnh đèn vàng",
    paletteTitle: "Đen – Xanh than – Xám khói – Champagne",
    colors: [
      { name: "Đen tuyền", swatchClass: "bg-[#222222]" },
      { name: "Xanh than", swatchClass: "bg-[#1F2F46]" },
      { name: "Xám khói", swatchClass: "bg-[#6E737B]" },
      { name: "Champagne", swatchClass: "bg-[#DEC7A4]" },
    ],
    whyGuestsLikeIt: "Nam giới mặc sẵn vest hoặc áo sơ mi tối màu, nữ dễ chọn đầm dự tiệc sẵn có.",
    icon: Sunset,
  },
  {
    id: "classic-warm",
    timeAndVenue: "Tiệc truyền thống & gia tiên trang trọng",
    paletteTitle: "Đỏ rượu – Vàng đồng – Kem – Nâu gỗ",
    colors: [
      { name: "Đỏ rượu", swatchClass: "bg-[#7A1C24]" },
      { name: "Vàng đồng", swatchClass: "bg-[#C5A059]" },
      { name: "Kem ấm", swatchClass: "bg-[#EFE6D8]" },
      { name: "Nâu trầm", swatchClass: "bg-[#6D4C3D]" },
    ],
    whyGuestsLikeIt: "Hợp mắt phụ huynh hai bên vì giữ sắc ấm may mắn ngày hỷ truyền thống.",
    icon: Shirt,
  },
];

export function DressCodePaletteMatrix() {
  return (
    <figure
      aria-label="4 bảng màu dress code đám cưới dễ phối đồ theo khung giờ tổ chức"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          BẢNG MÀU THÂN THIỆN TỦ ĐỒ KHÁCH MỜI
        </span>
        <span className="font-display text-xl font-semibold text-text">
          4 nhóm màu dress code phổ biến giúp khách dễ chọn trang phục sẵn có
        </span>
      </figcaption>

      <div className="grid gap-3.5 sm:grid-cols-2">
        {DRESS_CODE_PALETTES.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-xl border border-border bg-surface-alt/45 p-4"
            >
              <div>
                <div className="flex items-start gap-2.5">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[11px] font-medium text-accent-text">
                      {item.timeAndVenue}
                    </p>
                    <h3 className="font-display text-base font-semibold text-text">
                      {item.paletteTitle}
                    </h3>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {item.colors.map((color) => (
                    <span
                      key={color.name}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-text"
                    >
                      <span
                        className={`h-3 w-3 rounded-full border border-border ${color.swatchClass}`}
                        aria-hidden="true"
                      />
                      <span>{color.name}</span>
                    </span>
                  ))}
                </div>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-text-muted">
                {item.whyGuestsLikeIt}
              </p>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
