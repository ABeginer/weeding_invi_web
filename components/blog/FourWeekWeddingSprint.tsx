/**
 * Lộ trình hành động rút gọn theo từng tuần (Tuần 1 đến Tuần 4) dành cho cặp đôi
 * chỉ có 30 ngày chuẩn bị đám cưới nhưng vẫn đầy đủ lễ gia tiên và tiệc nhà hàng.
 */
import * as React from "react";
import { CalendarDays, Camera, CheckCircle2, Send } from "lucide-react";

interface SprintWeek {
  weekBadge: string;
  focusTitle: string;
  tasks: string[];
  milestone: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SPRINT_WEEKS: readonly SprintWeek[] = [
  {
    weekBadge: "Tuần 1 (Ngày 30–22)",
    focusTitle: "Khóa khung cứng: địa điểm, ekip & ngân sách",
    tasks: [
      "Đặt cọc sảnh tiệc nhà hàng hoặc đội nấu cỗ gia tiên tại hai nhà.",
      "Thuê váy áo cưới, áo dài ăn hỏi, đặt lịch trang điểm và thợ chụp phóng sự ngày cưới.",
      "Đo kích cỡ và mua/sửa nhẫn cưới kịp khắc tên, lên bảng ngân sách tổng.",
    ],
    milestone: "Hoàn thành xong mọi giao dịch phụ thuộc lịch trống nhà cung cấp.",
    icon: CalendarDays,
  },
  {
    weekBadge: "Tuần 2 (Ngày 21–15)",
    focusTitle: "Chuẩn bị lễ vật gia tiên & phát hành thiệp mời",
    tasks: [
      "Đặt mâm quả tráp ăn hỏi, hoa cầm tay và cổng hoa tư gia hai họ.",
      "In gấp một lượng thiệp giấy vừa đủ cho ông bà, họ hàng gần và sếp (hoặc chọn in nhanh lấy liền).",
      "Khởi tạo thiệp cưới online và gửi link mang tên riêng qua Zalo cho bạn bè, đồng nghiệp, khách ở xa.",
    ],
    milestone: "Toàn bộ khách mời đều nhận được lời mời trước tiệc tối thiểu 2 tuần.",
    icon: Send,
  },
  {
    weekBadge: "Tuần 3 (Ngày 14–8)",
    focusTitle: "Chốt RSVP, thử đồ lần cuối & kịch bản MC",
    tasks: [
      "Thống nhất thực đơn chính thức, đồ uống và điều khoản bàn dự phòng với quản lý sảnh.",
      "Gửi tin nhắn nhắc nhẹ nhóm khách chưa phản hồi RSVP và gom người quen vào từng mâm 10 chỗ.",
      "Chọn nhạc nền rước dâu, nhạc lễ đường và gửi file ảnh trình chiếu màn hình LED.",
    ],
    milestone: "Xong sơ đồ bàn tiệc và kịch bản giờ đón dâu với hai bên gia đình.",
    icon: Camera,
  },
  {
    weekBadge: "Tuần 4 (Ngày 7–0)",
    focusTitle: "Tổng duyệt giờ giấc, chia phong bì & giữ sức khỏe",
    tasks: [
      "Khóa số lượng mâm cứng với bếp nhà hàng trước ngày tiệc 3–5 hôm.",
      "Rút tiền mặt chia sẵn phong bì lễ đen, tiền bồi dưỡng bưng quả, lái xe và ekip.",
      "Kiểm tra lại xe hoa, người đại diện phát biểu hai họ và phân công người tiếp khách tại sảnh.",
    ],
    milestone: "Thảnh thơi nghỉ ngơi trước ngày cưới 1 tối, không còn việc chạy vặt giờ chót.",
    icon: CheckCircle2,
  },
];

export function FourWeekWeddingSprint() {
  return (
    <figure
      aria-label="Lộ trình 4 tuần chuẩn bị đám cưới gọn nhẹ trong 1 tháng"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          LỘ TRÌNH NƯỚC RÚT 30 NGÀY
        </span>
        <span className="font-display text-xl font-semibold text-text">
          Phân chia đầu việc theo 4 tuần không chồng chéo
        </span>
      </figcaption>

      <div className="space-y-3.5">
        {SPRINT_WEEKS.map((week) => {
          const Icon = week.icon;
          return (
            <div
              key={week.weekBadge}
              className="rounded-xl border border-border bg-surface-alt/45 p-4"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-semibold text-accent-text">
                  {week.weekBadge}
                </span>
                <h3 className="font-display text-lg font-semibold text-text">
                  {week.focusTitle}
                </h3>
              </div>

              <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-text sm:text-sm">
                {week.tasks.map((task) => (
                  <li key={task} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span>{task}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-3 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-accent-text">
                Cột mốc xong tuần: <span className="font-normal text-text">{week.milestone}</span>
              </p>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
