/**
 * Sơ đồ chọn kênh mời cưới đúng phép lịch sự theo từng nhóm khách mời:
 * trao thiệp giấy kết hợp tin nhắn, gọi điện trước khi nhắn Zalo, hoặc nhắn trực tiếp 1-1.
 */
import * as React from "react";
import { HandHeart, MessageCircleHeart, PhoneCall } from "lucide-react";

interface ChannelOption {
  id: string;
  channelTitle: string;
  targetGroup: string;
  whyRule: string;
  actionTip: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CHANNEL_OPTIONS: readonly ChannelOption[] = [
  {
    id: "paper-then-text",
    channelTitle: "Thiệp giấy tận tay + Nhắn kèm bản đồ",
    targetGroup: "Ông bà, họ hàng gần, sếp và đồng nghiệp chung văn phòng",
    whyRule: "Người lớn tuổi và đồng nghiệp gặp mặt hằng ngày coi trọng sự trân trọng trực tiếp.",
    actionTip: "Trao thiệp giấy trước, tối cùng ngày gửi thêm tin nhắn Zalo chứa link bản đồ nhà hàng.",
    icon: HandHeart,
  },
  {
    id: "call-then-text",
    channelTitle: "Gọi điện 1 phút + Nhắn Zalo gửi thiệp",
    targetGroup: "Cô chú ở tỉnh xa, bạn thân của bố mẹ, quản lý cũ ít gặp",
    whyRule: "Nghe giọng nói trực tiếp giúp người nhận thấy được sự chu đáo dù ở xa không trao tay được.",
    actionTip: "Gọi báo tin ngắn gọn và xin phép gửi thiệp điện tử, ngay sau khi cúp máy mới nhắn link.",
    icon: PhoneCall,
  },
  {
    id: "direct-1on1-text",
    channelTitle: "Nhắn tin riêng 1-1 kèm tên khách",
    targetGroup: "Bạn bè cùng lứa, đồng nghiệp cũ, bạn đại học ở khác thành phố",
    whyRule: "Gọn nhẹ, dễ mở trên điện thoại và cho phép khách bấm xác nhận chỗ ngồi tức thì.",
    actionTip: "Mở đầu bằng câu hỏi thăm tự nhiên, đặt liên kết thiệp riêng ở cuối tin nhắn.",
    icon: MessageCircleHeart,
  },
];

export function InviteChannelDecisionCard() {
  return (
    <figure
      aria-label="Sơ đồ chọn kênh gửi lời mời cưới phù hợp theo từng nhóm khách"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          CHỌN ĐÚNG KÊNH TRƯỚC KHI NHẮN
        </span>
        <span className="font-display text-xl font-semibold text-text">
          3 cách kết hợp giữa gọi điện, thiệp giấy và tin nhắn Zalo
        </span>
      </figcaption>

      <div className="grid gap-3.5 md:grid-cols-3">
        {CHANNEL_OPTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-xl border border-border bg-surface-alt/45 p-4"
            >
              <div>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <h3 className="mt-3 font-display text-base font-semibold text-text">
                  {item.channelTitle}
                </h3>
                <p className="mt-1.5 text-xs font-medium text-accent-text">
                  {item.targetGroup}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-text-muted">
                  {item.whyRule}
                </p>
              </div>
              <p className="mt-3 rounded-lg border border-border bg-surface px-3 py-2 text-xs leading-relaxed text-text">
                {item.actionTip}
              </p>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
