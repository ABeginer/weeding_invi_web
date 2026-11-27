/**
 * Biểu đồ tỷ lệ khách mời tham dự đám cưới thực tế theo 4 nhóm quan hệ phổ biến tại Việt Nam,
 * kèm hệ số người đi kèm (+1) để quy đổi sát số chỗ ngồi trước khi chốt cỗ.
 */
import * as React from "react";
import { Briefcase, HeartHandshake, Home, Users } from "lucide-react";

interface TierRate {
  id: string;
  groupName: string;
  rateRange: string;
  barPercent: number;
  plusOnePattern: string;
  tip: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ATTENDANCE_TIERS: readonly TierRate[] = [
  {
    id: "close-family",
    groupName: "Ông bà, cô chú ruột & họ hàng gần",
    rateRange: "90% – 95%",
    barPercent: 93,
    plusOnePattern: "Thường đi theo gia đình 2–4 người/thiệp",
    tip: "Ít khi vắng mặt nếu tổ chức cùng tỉnh; cần đếm thẳng theo đầu người thay vì đếm số thiệp.",
    icon: Home,
  },
  {
    id: "close-friends",
    groupName: "Bạn thân, nhóm đại học & hội chơi lâu năm",
    rateRange: "85% – 90%",
    barPercent: 88,
    plusOnePattern: "Khoảng 20%–35% đưa thêm người yêu hoặc vợ/chồng",
    tip: "Dễ hỏi trước trên nhóm riêng hoặc nhờ bấm chọn số người đi cùng trên thiệp online.",
    icon: HeartHandshake,
  },
  {
    id: "coworkers",
    groupName: "Đồng nghiệp cùng công ty & đối tác gần",
    rateRange: "75% – 85%",
    barPercent: 80,
    plusOnePattern: "Đa số đi lẻ 1 người/thiệp (trừ cấp trên thân quen)",
    tip: "Nếu đãi tiệc tối ngày thường hoặc khác quận xa, tỷ lệ có thể giảm về mức 70%.",
    icon: Briefcase,
  },
  {
    id: "distant-social",
    groupName: "Bạn cũ ít liên lạc, khách xã giao & khác tỉnh",
    rateRange: "55% – 70%",
    barPercent: 63,
    plusOnePattern: "Chủ yếu đi 1 mình hoặc gửi mừng từ xa",
    tip: "Nên chốt lại bằng xác nhận RSVP trước 7 ngày vì nhóm này hay có thay đổi lịch công tác phút chót.",
    icon: Users,
  },
];

export function AttendanceRatioTierChart() {
  return (
    <figure
      aria-label="Tỷ lệ tham dự đám cưới thực tế theo 4 nhóm khách mời Việt Nam"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          THAM CHIẾU TỶ LỆ ĐI TIỆC THỰC TẾ
        </span>
        <span className="font-display text-xl font-semibold text-text">
          Tỷ lệ khách đến dự dự kiến theo từng bậc quan hệ
        </span>
      </figcaption>

      <div className="space-y-4">
        {ATTENDANCE_TIERS.map((tier) => {
          const Icon = tier.icon;
          return (
            <div
              key={tier.id}
              className="rounded-xl border border-border bg-surface-alt/45 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-base font-semibold text-text">
                    {tier.groupName}
                  </h3>
                </div>
                <span className="rounded-full bg-accent-soft px-3 py-0.5 text-xs font-semibold text-accent-text">
                  {tier.rateRange}
                </span>
              </div>

              <div
                className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface"
                aria-hidden="true"
              >
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${tier.barPercent}%` }}
                />
              </div>

              <p className="mt-2.5 text-xs font-medium text-text">
                Hệ số đi kèm: {tier.plusOnePattern}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-text-muted">
                {tier.tip}
              </p>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
