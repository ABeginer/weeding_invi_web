/**
 * Checklist kiểm tra nhanh khu vực bàn gallery và đón khách trong 90 phút
 * trước giờ mở sảnh để tránh thiếu phụ kiện hoặc lệch mã QR.
 */
import * as React from "react";
import { CheckSquare, Clock4, Flower2, QrCode } from "lucide-react";

interface PrepCheckGroup {
  title: string;
  leadTime: string;
  items: readonly string[];
  icon: React.ComponentType<{ className?: string }>;
}

const PREP_GROUPS: readonly PrepCheckGroup[] = [
  {
    title: "Khung ảnh & Vật trang trí",
    leadTime: "Trước tiệc 90 phút",
    items: [
      "Lau sạch mặt kính khung ảnh cưới, bỏ lớp nilon chống xước còn dính viền.",
      "Sắp khung cao phía sau, khung nhỏ phía trước theo hình tam giác cân.",
    ],
    icon: Flower2,
  },
  {
    title: "Bút ký & Thùng mừng",
    leadTime: "Trước tiệc 60 phút",
    items: [
      "Thử mực cả 4 cây bút ký và chuẩn bị thêm 10 phong bì trắng dự phòng cho khách quên mang.",
      "Kiểm tra khóa thùng tiền mừng và chỉ định rõ một người nhà giữ chìa khóa.",
    ],
    icon: CheckSquare,
  },
  {
    title: "Bảng QR & Ánh sáng",
    leadTime: "Trước tiệc 45 phút",
    items: [
      "Dùng điện thoại tự quét thử mã QR tra số bàn và QR Album ảnh dưới ánh đèn sảnh thật.",
      "Chỉnh đèn rọi bàn gallery không chiếu lóa thẳng vào bề mặt giấy bóng của mã QR.",
    ],
    icon: QrCode,
  },
  {
    title: "Đội hình đón khách",
    leadTime: "Trước tiệc 20 phút",
    items: [
      "Phân công 1 người đứng gần lối rẽ vào sảnh hướng dẫn khách lớn tuổi vào đúng khu bàn.",
      "Chừa khoảng trống rộng tối thiểu 1,5m phía trước bàn gallery cho khách dừng chụp hình.",
    ],
    icon: Clock4,
  },
];

export function GalleryPrepChecklist90Min() {
  return (
    <figure
      aria-label="Checklist chuẩn bị bàn gallery đám cưới trước giờ đón khách 90 phút"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          KIỂM TRA TRƯỚC GIỜ MỞ SẢNH
        </span>
        <span className="font-display text-xl font-semibold text-text">
          Checklist 90 phút giúp bàn đón khách chỉn chu trước khi vị khách đầu tiên tới
        </span>
      </figcaption>

      <div className="grid gap-3.5 sm:grid-cols-2">
        {PREP_GROUPS.map((group) => {
          const Icon = group.icon;
          return (
            <div
              key={group.title}
              className="rounded-xl border border-border bg-surface-alt/40 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-base font-semibold text-text">
                    {group.title}
                  </h3>
                </div>
                <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-semibold text-accent-text">
                  {group.leadTime}
                </span>
              </div>
              <ul className="mt-3 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-text-muted">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
