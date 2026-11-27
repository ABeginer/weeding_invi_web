/**
 * Quy trình 3 bước đăng STT báo hỷ trên Facebook / Threads và ghim link thiệp online
 * để không bị thuật toán giảm hiển thị nhưng vẫn gom đủ xác nhận tham dự.
 */
import * as React from "react";
import { CalendarClock, Link2, Send } from "lucide-react";

interface SocialStep {
  step: string;
  title: string;
  detail: string;
  metricHint: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SOCIAL_FLOW: readonly SocialStep[] = [
  {
    step: "BƯỚC 01",
    title: "Đăng ảnh cưới + STT trước lễ 2–3 tuần",
    detail:
      "Chọn 3–5 tấm ảnh cưới sáng mặt, viết đoạn STT ngắn dưới 120 chữ nói rõ ngày dương, thành phố tổ chức để bạn bè kịp sắp xếp lịch.",
    metricHint: "Khung giờ tương tác tốt: 20h00–21h30 tối hoặc trưa 12h00–13h00.",
    icon: CalendarClock,
  },
  {
    step: "BƯỚC 02",
    title: "Ghim đường link thiệp cưới ngay dưới bình luận đầu",
    detail:
      "Thay vì dán URL dài thẳng trong phần chữ bài viết, hãy đặt link thiệp online hoặc bản đồ nhà hàng ở bình luận ghim kèm lời mời thân thiện.",
    metricHint: "Giữ trọn độ hiển thị tự nhiên của bài viết mà ai cần vẫn bấm ngay được.",
    icon: Link2,
  },
  {
    step: "BƯỚC 03",
    title: "Nhắn riêng link cá nhân cho người bình luận chúc mừng",
    detail:
      "Khi bạn bè vào bình luận hỏi ngày giờ hay xin đi cùng nhóm, trả lời giữ tương tác rồi gửi link thiệp mang tên riêng qua Zalo để chốt RSVP.",
    metricHint: "Biến bình luận xã giao thành danh sách khách xác nhận chắc chắn.",
    icon: Send,
  },
];

export function SocialPostTimingAndLinkFlow() {
  return (
    <figure
      aria-label="3 bước đăng STT mời cưới và ghim link thiệp không bị trôi thông tin"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          GIỮ TƯƠNG TÁC MÀ KHÔNG RƠI KHÁCH
        </span>
        <span className="font-display text-xl font-semibold text-text">
          Cách đăng STT báo hỷ kèm link thiệp đạt nhiều tương tác nhất
        </span>
      </figcaption>

      <div className="grid gap-3.5 md:grid-cols-3">
        {SOCIAL_FLOW.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              className="flex flex-col justify-between rounded-xl border border-border bg-surface-alt/40 p-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold tracking-[0.14em] text-accent-text uppercase">
                    {item.step}
                  </span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
                <h3 className="mt-2 font-display text-base font-semibold leading-snug text-text">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-text-muted">
                  {item.detail}
                </p>
              </div>
              <p className="mt-3 rounded-lg border border-border bg-surface px-3 py-2 text-[11px] leading-relaxed text-text">
                {item.metricHint}
              </p>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
