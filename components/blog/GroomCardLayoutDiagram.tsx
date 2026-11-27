/**
 * Sơ đồ bố cục chuẩn của một mẫu thiệp cưới nhà trai (Lễ Thành Hôn / Tân Hôn)
 * minh họa thứ tự sắp xếp hai họ, tên chú rể - cô dâu, giờ rước dâu và giờ khai tiệc.
 */
import * as React from "react";
import { CalendarDays, Clock, Home, MapPin } from "lucide-react";

interface CardBlock {
  order: string;
  label: string;
  sample: string;
  rule: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CARD_BLOCKS: readonly CardBlock[] = [
  {
    order: "Phần 01",
    label: "Thông tin song thân hai họ (Nhà trai đứng trước / bên trái)",
    sample: "NHÀ TRAI: Ông Nguyễn Văn An & Bà Trần Thị Bình  |  NHÀ GÁI: Ông Lê Minh Đức & Bà Phạm Thu Hà",
    rule: "Trên thiệp nhà trai, họ tên cha mẹ chú rể luôn đặt ở cột bên trái (hoặc phía trên) để thể hiện vai trò chủ hôn phát thiệp.",
    icon: Home,
  },
  {
    order: "Phần 02",
    label: "Tiêu đề nghi lễ & thứ bậc chú rể - cô dâu",
    sample: "Trân trọng báo tin Lễ Thành Hôn của con chúng tôi: Nguyễn Minh Khang (Trưởng Nam) & Lê Thảo Vy (Ái Nữ)",
    rule: "Miền Bắc thường dùng \"Lễ Thành Hôn\", miền Nam hay dùng \"Lễ Tân Hôn\" cho tiệc chính tại nhà trai.",
    icon: CalendarDays,
  },
  {
    order: "Phần 03",
    label: "Giờ đón dâu (tư gia) & giờ khai tiệc (nhà hàng)",
    sample: "Lễ Thành Hôn: 09:30 (tức 13 tháng 02 Âm lịch) tại Tư gia Nhà trai · Khai tiệc: 18:00 cùng ngày",
    rule: "Ghi tách bạch hai mốc giờ nếu lễ gia tiên buổi sáng tổ chức tại nhà riêng và tiệc mặn đãi vào buổi trưa hoặc tối.",
    icon: Clock,
  },
  {
    order: "Phần 04",
    label: "Địa điểm tổ chức & hướng dẫn bản đồ",
    sample: "Trung tâm Tiệc cưới — Sảnh A, kèm liên kết chỉ đường Google Maps và nút xác nhận tham dự",
    rule: "Ghi rõ tên sảnh, tầng và địa chỉ đầy đủ; nếu dùng thiệp online có thể gắn thẳng đường link chỉ đường.",
    icon: MapPin,
  },
];

export function GroomCardLayoutDiagram() {
  return (
    <figure
      aria-label="Sơ đồ 4 phần thông tin chuẩn trên mẫu thiệp cưới nhà trai"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          CẤU TRÚC THIỆP NHÀ TRAI CHUẨN MỰC
        </span>
        <span className="font-display text-xl font-semibold text-text">
          Thứ tự 4 khối thông tin trên mặt trong thiệp Lễ Thành Hôn
        </span>
      </figcaption>

      <div className="space-y-3">
        {CARD_BLOCKS.map((block) => {
          const Icon = block.icon;
          return (
            <div
              key={block.order}
              className="rounded-xl border border-border bg-surface-alt/45 p-4"
            >
              <div className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-text">
                      {block.order}
                    </span>
                    <h3 className="font-display text-base font-semibold text-text">
                      {block.label}
                    </h3>
                  </div>

                  <p className="mt-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium leading-relaxed text-text">
                    {block.sample}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-text-muted">
                    {block.rule}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
