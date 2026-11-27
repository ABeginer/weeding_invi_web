/**
 * Mô hình phân bổ 40% thiệp giấy truyền thống và 60% thiệp cưới online cá nhân hóa
 * theo từng nhóm khách mời Việt Nam để cân bằng giữa phép lịch sự và tốc độ thu RSVP.
 */
import * as React from "react";
import { MailCheck, Send } from "lucide-react";

interface AllocationBucket {
  id: string;
  shareBadge: string;
  heading: string;
  groups: string[];
  executionRule: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ALLOCATION_BUCKETS: readonly AllocationBucket[] = [
  {
    id: "paper-40",
    shareBadge: "Khoảng 30% – 40% tổng danh sách",
    heading: "Nhóm ưu tiên thiệp giấy trao tận tay",
    groups: [
      "Ông bà nội ngoại, cô dì chú bác ruột thịt hai bên gia đình",
      "Bố mẹ thông gia và các bậc trưởng bối làm chủ hôn",
      "Khách lớn tuổi, hàng xóm cùng khu phố ít dùng smartphone",
      "Sếp trực tiếp, ban giám đốc làm việc chung văn phòng",
    ],
    executionRule:
      "Trao phong bì viết tay đầy đủ dấu tiếng Việt trước tiệc 10–14 ngày, có thể kèm mã QR hoặc nhắn thêm link bản đồ riêng.",
    icon: MailCheck,
  },
  {
    id: "online-60",
    shareBadge: "Khoảng 60% – 70% tổng danh sách",
    heading: "Nhóm gửi thiệp cưới online cá nhân hóa",
    groups: [
      "Bạn học cấp 3, đại học, nhóm bạn thân ở khác quận hoặc khác tỉnh",
      "Đồng nghiệp trẻ cùng công ty và đồng nghiệp cũ đã chuyển chỗ làm",
      "Khách mời của cô dâu chú rể cần tự chọn số ghế đi cùng (+1)",
      "Người quen ở xa cần mở nhanh Google Maps và lưu lịch ngày cưới",
    ],
    executionRule:
      "Nhập danh sách từ Excel vào Inviwedd để mỗi khách nhận một đường link riêng (/m/ten-khach) kèm lời chào Zalo đúng vai vế.",
    icon: Send,
  },
];

export function HybridInviteAllocationCard() {
  return (
    <figure
      aria-label="Phân bổ tỷ lệ 40% thiệp giấy và 60% thiệp online cho từng nhóm khách"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          CÔNG THỨC KẾT HỢP 40 / 60
        </span>
        <span className="font-display text-xl font-semibold text-text">
          Cách chia danh sách khách để vừa trọn lễ nghĩa vừa gọn nhẹ
        </span>
      </figcaption>

      <div className="grid gap-4 md:grid-cols-2">
        {ALLOCATION_BUCKETS.map((bucket) => {
          const Icon = bucket.icon;
          return (
            <div
              key={bucket.id}
              className="flex flex-col justify-between rounded-xl border border-border bg-surface-alt/45 p-4"
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-semibold text-accent-text">
                    {bucket.shareBadge}
                  </span>
                </div>

                <h3 className="mt-3 font-display text-lg font-semibold text-text">
                  {bucket.heading}
                </h3>

                <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-text">
                  {bucket.groups.map((line) => (
                    <li key={line} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-3 rounded-lg border border-border bg-surface px-3 py-2 text-xs leading-relaxed text-text-muted">
                {bucket.executionRule}
              </p>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
