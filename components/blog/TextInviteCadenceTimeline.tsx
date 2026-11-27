/**
 * Lộ trình thời gian 3 mốc khi nhắn tin gửi thiệp cưới qua Zalo/Messenger:
 * từ báo tin giữ lịch cho khách ở xa, gửi tin nhắn chính thức đến nhắc RSVP tinh tế.
 */
import * as React from "react";
import { BellRing, CalendarCheck2, Clock3 } from "lucide-react";

interface CadenceStage {
  windowLabel: string;
  title: string;
  audience: string;
  sampleLine: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CADENCE_STAGES: readonly CadenceStage[] = [
  {
    windowLabel: "Trước 3–4 tuần",
    title: "Báo tin giữ lịch sớm cho khách ở xa",
    audience: "Khách khác tỉnh thành, bạn bè làm việc theo ca hoặc người hay đi công tác.",
    sampleLine:
      "Tháng tới ngày 24/05 tụi mình làm tiệc ở TP.HCM, nhắn trước để bạn giữ lịch giúp tụi mình nha, gần ngày mình gửi thiệp chính thức qua nhé!",
    icon: Clock3,
  },
  {
    windowLabel: "Trước 10–14 ngày",
    title: "Gửi tin nhắn mời cưới kèm link thiệp cá nhân hóa",
    audience: "Toàn bộ khách nhận thiệp online và đồng nghiệp đã nhận thiệp giấy cần lưu bản đồ.",
    sampleLine:
      "Hùng ơi, tụi mình gửi bạn chiếc thiệp cưới online có sẵn giờ đón khách và chỉ đường nhà hàng ở dưới, bạn xem trước nhé.",
    icon: CalendarCheck2,
  },
  {
    windowLabel: "Trước 5–7 ngày",
    title: "Nhắc xác nhận tham dự nhẹ nhàng để chốt bàn",
    audience: "Chỉ nhắn lại những người chưa phản hồi RSVP trước ngày khóa số mâm với nhà hàng.",
    sampleLine:
      "Tuần sau là ngày vui của tụi mình rồi, thứ Năm này nhà hàng chốt danh sách bàn tiệc nên bạn bấm xác nhận giúp mình xem hôm đó thu xếp qua được không nhé.",
    icon: BellRing,
  },
];

export function TextInviteCadenceTimeline() {
  return (
    <figure
      aria-label="Lộ trình 3 mốc thời gian nhắn tin mời cưới và nhắc xác nhận tham dự"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          NHỊP THỜI GIAN CHUẨN MỰC
        </span>
        <span className="font-display text-xl font-semibold text-text">
          Khi nào nên nhắn tin mời cưới và nhắc RSVP để không bị gấp?
        </span>
      </figcaption>

      <div className="space-y-3.5">
        {CADENCE_STAGES.map((stage) => {
          const Icon = stage.icon;
          return (
            <div
              key={stage.windowLabel}
              className="rounded-xl border border-border bg-surface-alt/45 p-4"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-semibold text-accent-text">
                  {stage.windowLabel}
                </span>
                <h3 className="font-display text-lg font-semibold text-text">
                  {stage.title}
                </h3>
              </div>

              <p className="mt-2 text-xs text-text-muted">{stage.audience}</p>

              <blockquote className="mt-2.5 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-xs leading-relaxed text-text sm:text-sm">
                &ldquo;{stage.sampleLine}&rdquo;
              </blockquote>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
