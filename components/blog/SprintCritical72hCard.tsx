/**
 * Ba đầu việc ưu tiên cao nhất cần khóa trong 72 giờ đầu tiên khi thời gian chuẩn bị đám cưới
 * chỉ còn đúng 1 tháng, tránh tình trạng hết sảnh đẹp hoặc không kịp chỉnh sửa váy cưới.
 */
import * as React from "react";
import { Building2, ListChecks, Shirt } from "lucide-react";

interface CriticalLockItem {
  order: string;
  title: string;
  deadline: string;
  whyFirst: string;
  actionNote: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CRITICAL_LOCKS: readonly CriticalLockItem[] = [
  {
    order: "Ưu tiên 01",
    title: "Chốt sảnh tiệc, thực đơn & ngày giờ gia tiên",
    deadline: "Trong 24–48 giờ đầu",
    whyFirst: "Nhà hàng và đơn vị nấu cỗ chỉ giữ lịch khi có tiền cọc; mọi bước khác đều xoay quanh địa điểm.",
    actionNote: "Kiểm tra khớp ngày dương lịch và âm lịch trước khi ký hợp đồng đặt cọc sảnh.",
    icon: Building2,
  },
  {
    order: "Ưu tiên 02",
    title: "Đo thử áo dài, vest, váy cưới & đặt ekip trang điểm",
    deadline: "Ngày thứ 2 – thứ 3",
    whyFirst: "Tiệm may và studio cần ít nhất 2–3 tuần để sửa số đo váy áo và xếp thợ trang điểm sáng sớm.",
    actionNote: "Chọn mẫu có sẵn để chỉnh sửa thay vì đặt may mới hoàn toàn từ đầu.",
    icon: Shirt,
  },
  {
    order: "Ưu tiên 03",
    title: "Chốt danh sách khách mời hai họ & khung ngân sách",
    deadline: "Trước hết Ngày thứ 3",
    whyFirst: "Số khách quyết định trực tiếp quy mô sảnh, số mâm dự phòng và số lượng thiệp cần chuẩn bị.",
    actionNote: "Tách sẵn khách cần trao thiệp tay và nhóm gửi thiệp cưới online để không trễ lịch phát thiệp.",
    icon: ListChecks,
  },
];

export function SprintCritical72hCard() {
  return (
    <figure
      aria-label="3 đầu việc bắt buộc phải chốt trong 72 giờ đầu khi chuẩn bị đám cưới trong 1 tháng"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          72 GIỜ ĐẦU TIÊN QUYẾT ĐỊNH
        </span>
        <span className="font-display text-xl font-semibold text-text">
          3 hạng mục cần đặt cọc ngay trong 3 ngày đầu của kế hoạch 1 tháng
        </span>
      </figcaption>

      <div className="grid gap-3.5 md:grid-cols-3">
        {CRITICAL_LOCKS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.order}
              className="flex flex-col justify-between rounded-xl border border-border bg-surface-alt/45 p-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-semibold text-accent-text">
                    {item.deadline}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-base font-semibold text-text">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-text-muted">
                  {item.whyFirst}
                </p>
              </div>
              <p className="mt-3 rounded-lg border border-border bg-surface px-3 py-2 text-xs leading-relaxed text-text">
                {item.actionNote}
              </p>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
