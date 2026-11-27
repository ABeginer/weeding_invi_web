/**
 * Khung kịch bản 15 phút tổ chức minigame tiệc cưới giữa lúc dùng tiệc,
 * kết nối mã QR trên bàn tiệc với màn hình LED sảnh nhà hàng.
 */
import * as React from "react";
import { Clock, Mic, QrCode, Trophy } from "lucide-react";

interface FlowStep {
  phase: string;
  windowLabel: string;
  action: string;
  note: string;
  icon: React.ComponentType<{ className?: string }>;
}

const GAME_FLOW_STEPS: readonly FlowStep[] = [
  {
    phase: "Mở màn gom chú ý",
    windowLabel: "Phút 0–3 (sau món khai vị thứ hai)",
    action: "MC giới thiệu nhanh luật chơi và mời cả sảnh nhìn lên màn hình LED.",
    note: "Không phát game lúc khách mới ngồi xuống vì nhiều người lớn tuổi đang ăn nóng.",
    icon: Mic,
  },
  {
    phase: "Tương tác ngay tại bàn",
    windowLabel: "Phút 3–9",
    action: "Khách kiểm tra mã ghế/bàn hoặc quét QR đặt trên bàn để trả lời quiz và gửi ảnh.",
    note: "Giữ nhịp 20–30 giây mỗi câu hỏi, xen kẽ bình luận dí dỏm của cô dâu chú rể.",
    icon: QrCode,
  },
  {
    phase: "Công bố & trao quà",
    windowLabel: "Phút 9–13",
    action: "Chiếu tên 3–5 khách thắng giải hoặc ảnh chụp thú vị nhất lên màn hình lớn.",
    note: "Chuẩn bị sẵn túi quà nhỏ dễ cầm (nến thơm, voucher, lì xì kỷ niệm) để trao gọn.",
    icon: Trophy,
  },
  {
    phase: "Chuyển tiếp về âm nhạc",
    windowLabel: "Phút 13–15",
    action: "Cảm ơn cả sảnh tiệc và bật lại nhạc nền không lời cho phần đi bàn chúc rượu.",
    note: "Tổng thời lượng dưới 15 phút giúp chương trình không kéo dài lê thê.",
    icon: Clock,
  },
];

export function GameFlowScheduleMatrix() {
  return (
    <figure
      aria-label="Kịch bản 15 phút chạy trò chơi trong tiệc cưới tại nhà hàng"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          NHỊP CHƯƠNG TRÌNH 15 PHÚT
        </span>
        <span className="font-display text-xl font-semibold text-text">
          Kịch bản dẫn trò chơi gọn gàng, không làm nguội món tiệc
        </span>
      </figcaption>

      <div className="grid gap-3.5 sm:grid-cols-2">
        {GAME_FLOW_STEPS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.phase}
              className="flex flex-col justify-between rounded-xl border border-border bg-surface-alt/40 p-4"
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold text-accent-text">
                      {item.windowLabel}
                    </p>
                    <h3 className="font-display text-base font-semibold text-text">
                      {item.phase}
                    </h3>
                  </div>
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-text sm:text-sm">
                  {item.action}
                </p>
              </div>
              <p className="mt-2.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs leading-relaxed text-text-muted">
                {item.note}
              </p>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
