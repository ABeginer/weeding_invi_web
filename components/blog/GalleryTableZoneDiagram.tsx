/**
 * Sơ đồ phân chia 3 cụm công năng trên bàn gallery và khu đón khách đầu giờ
 * nhằm giữ bàn trưng bày đẹp mắt mà không tạo nút thắt cổ chai ở cửa sảnh.
 */
import * as React from "react";
import { Archive, Image, QrCode } from "lucide-react";

interface GalleryZone {
  zone: string;
  items: string;
  placementRule: string;
  icon: React.ComponentType<{ className?: string }>;
}

const GALLERY_ZONES: readonly GalleryZone[] = [
  {
    zone: "Khu 1: Trung tâm ảnh kỷ niệm (45% mặt bàn)",
    items: "3–5 khung ảnh cưới lồng nhau (2 cỡ ngang/dọc), nến điện tử, bình hoa thấp.",
    placementRule: "Đặt ở lớp trong cùng hơi nâng cao bằng kệ gỗ nhỏ để không che tầm mắt.",
    icon: Image,
  },
  {
    zone: "Khu 2: Thùng mừng & Góc ký tên (35% mặt bàn)",
    items: "Thùng tiền mừng có khe khóa kín, khay 3–4 cây bút ký và quyển sổ mỏng.",
    placementRule: "Đặt về phía tay thuận bên rìa bàn, có phù dâu hỗ trợ nhận thiệp tay.",
    icon: Archive,
  },
  {
    zone: "Khu 3: Điểm quét QR tra cứu bàn & Album (Tách 1,5m)",
    items: "Standee khổ A4 hoặc thẻ để bàn in mã QR tra số bàn và gửi ảnh tiệc.",
    placementRule: "Đặt lệch ra phía trước cửa vào sảnh để khách xem bàn xong rẽ thẳng vào chỗ ngồi.",
    icon: QrCode,
  },
];

export function GalleryTableZoneDiagram() {
  return (
    <figure
      aria-label="Phân chia 3 vùng công năng cho bàn gallery đám cưới không ùn tắc"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          BỐ CỤC 3 VÙNG THÔNG THOÁNG
        </span>
        <span className="font-display text-xl font-semibold text-text">
          Chia mặt bàn gallery gọn gàng và tách luồng quét mã tìm bàn
        </span>
      </figcaption>

      <div className="grid gap-3.5 md:grid-cols-3">
        {GALLERY_ZONES.map((zone) => {
          const Icon = zone.icon;
          return (
            <div
              key={zone.zone}
              className="flex flex-col justify-between rounded-xl border border-border bg-surface-alt/45 p-4"
            >
              <div>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <h3 className="mt-2.5 font-display text-base font-semibold text-text">
                  {zone.zone}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-text-muted">
                  {zone.items}
                </p>
              </div>
              <p className="mt-3 rounded-lg border border-border bg-surface px-3 py-2 text-[11px] leading-relaxed text-text">
                {zone.placementRule}
              </p>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
