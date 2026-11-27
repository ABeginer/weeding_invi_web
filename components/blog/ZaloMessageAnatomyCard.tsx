/**
 * Minh họa cấu trúc 4 thành phần chuẩn của một tin nhắn gửi thiệp cưới online qua Zalo/Messenger
 * và quy tắc hiển thị thẻ xem trước (link preview) gọn gàng theo chuẩn Inviwedd.
 */
import * as React from "react";
import { CalendarClock, Link2, MessageSquareText, UserCheck } from "lucide-react";

interface MessagePart {
  step: string;
  label: string;
  example: string;
  note: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MESSAGE_PARTS: readonly MessagePart[] = [
  {
    step: "Phần 01",
    label: "Lời chào kèm danh xưng đúng vai vế",
    example: "Em chào Anh Minh ạ / Kính gửi Chú Bảy cùng Gia đình",
    note: "Gọi đúng tên riêng và bậc vai vế ngay câu đầu để khách nhận ra tin nhắn viết riêng cho mình.",
    icon: UserCheck,
  },
  {
    step: "Phần 02",
    label: "Lý do mời, ngày giờ và địa điểm cốt lõi",
    example: "Ngày 18/05 tới vợ chồng em tổ chức lễ thành hôn tại Sảnh B, Nhà hàng Riverside.",
    note: "Tóm gọn 1 đến 2 câu để khách nắm ngay lịch trình dù chưa kịp bấm mở link thiệp.",
    icon: CalendarClock,
  },
  {
    step: "Phần 03",
    label: "Liên kết thiệp cưới cá nhân hóa ở dòng cuối",
    example: "https://inviwedd.date/m/chu-bay-a1b2",
    note: "Đặt URL riêng ở cuối tin nhắn giúp Zalo tự bung thẻ ảnh bìa thiệp cưới và nút mở nhanh rõ đẹp.",
    icon: Link2,
  },
  {
    step: "Phần 04",
    label: "Lời hẹn lịch sự và gợi ý xác nhận tham dự",
    example: "Nhờ bạn bấm xác nhận tham dự ngay trong thiệp giúp tụi mình sắp bàn chu đáo nhé.",
    note: "Nhắc nhẹ phản hồi RSVP mà không tạo cảm giác ép buộc hay đòi hỏi quà mừng.",
    icon: MessageSquareText,
  },
];

export function ZaloMessageAnatomyCard() {
  return (
    <figure
      aria-label="Cấu trúc 4 phần của một tin nhắn gửi thiệp cưới online lịch sự qua Zalo"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          CẤU TRÚC TIN NHẮN CHUẨN MỰC
        </span>
        <span className="font-display text-xl font-semibold text-text">
          4 phần cần có trong mỗi lời gửi thiệp cưới online
        </span>
      </figcaption>

      <div className="grid gap-3 sm:grid-cols-2">
        {MESSAGE_PARTS.map((part) => {
          const Icon = part.icon;
          return (
            <div
              key={part.step}
              className="flex flex-col justify-between rounded-xl border border-border bg-surface-alt/45 p-4"
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-text">
                    {part.step}
                  </span>
                </div>
                <h3 className="mt-2.5 font-display text-base font-semibold text-text">
                  {part.label}
                </h3>
                <p className="mt-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium leading-relaxed text-text">
                  {part.example}
                </p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-text-muted">
                {part.note}
              </p>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
