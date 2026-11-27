/**
 * Bộ phân loại 4 sắc thái STT mời cưới trên Facebook và Threads
 * kèm khung mở đầu gợi ý và bối cảnh đối tượng bạn bè phù hợp.
 */
import * as React from "react";
import { Briefcase, Heart, Laugh, Zap } from "lucide-react";

interface CaptionToneCard {
  id: string;
  toneName: string;
  audience: string;
  sampleLead: string;
  interactionTip: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CAPTION_TONES: readonly CaptionToneCard[] = [
  {
    id: "witty",
    toneName: "Hài hước, bắt trend nhẹ nhàng",
    audience: "Hội bạn thân đại học, bạn cấp 3, Threads",
    sampleLead: "\"Chính thức hết hạn bảo hành độc thân từ [Ngày]. Mời hội anh em lên đồ đi ăn cỗ giúp hai đứa chốt đơn!\"",
    interactionTip: "Khuyến khích bạn bè tag nhau lập kèo đi chung bàn ngay dưới phần bình luận.",
    icon: Laugh,
  },
  {
    id: "heartfelt",
    toneName: "Sâu lắng, tình cảm chân thành",
    audience: "Người thân quen, đồng nghiệp cũ, bạn bè ở xa",
    sampleLead: "\"Sau [Số] năm đồng hành qua nhiều mùa nắng mưa, tụi mình chính thức về chung một nhà vào ngày [Ngày].\"",
    interactionTip: "Đi kèm 2–3 tấm ảnh cưới tự nhiên cận mặt để giữ trọn cảm xúc và tăng lượt thả tim.",
    icon: Heart,
  },
  {
    id: "polite-office",
    toneName: "Lịch sự, nhã nhặn đa đối tượng",
    audience: "Danh sách Facebook kết bạn chung sếp, đối tác, hàng xóm",
    sampleLead: "\"Trân trọng báo tin vui của hai gia đình. Rất mong được đón tiếp anh chị và bạn bè tới chung vui cùng tụi mình.\"",
    interactionTip: "Không dùng tiếng lóng hay đùa cợt quá trớn nếu trên trang cá nhân có nhiều người lớn.",
    icon: Briefcase,
  },
  {
    id: "short-notice",
    toneName: "Nhắn gọn & Báo hỷ cận ngày",
    audience: "Thông báo thay lời nhắc lại 5–7 ngày trước lễ cưới",
    sampleLead: "\"Còn đúng 7 ngày nữa! Đường tới sảnh [Tên nhà hàng] và nút xác nhận tham dự mình ghim ngay dưới bình luận nhé.\"",
    interactionTip: "Giúp khách bận rộn mở lại bản đồ Google Maps trong 1 chạm không phải tìm lại tin nhắn cũ.",
    icon: Zap,
  },
];

export function FacebookInviteCaptionBuckets() {
  return (
    <figure
      aria-label="4 phong cách viết STT mời cưới trên Facebook và Threads dễ tạo tương tác"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          CHỌN ĐÚNG TONE GIỌNG TỆP BẠN BÈ
        </span>
        <span className="font-display text-xl font-semibold text-text">
          4 sắc thái STT mời cưới giúp bài đăng tự nhiên mà không bị gượng
        </span>
      </figcaption>

      <div className="grid gap-3.5 sm:grid-cols-2">
        {CAPTION_TONES.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-xl border border-border bg-surface-alt/45 p-4"
            >
              <div>
                <div className="flex items-start gap-2.5">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-semibold text-text">
                      {item.toneName}
                    </h3>
                    <p className="text-[11px] font-medium text-accent-text">
                      {item.audience}
                    </p>
                  </div>
                </div>
                <p className="mt-2.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs italic leading-relaxed text-text">
                  {item.sampleLead}
                </p>
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-text-muted">
                {item.interactionTip}
              </p>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
