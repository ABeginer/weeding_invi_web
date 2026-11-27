/**
 * Tổng hợp các mẫu lời gửi thiệp cưới online chia theo 4 nhóm khách mời thực tế
 * (họ hàng bề trên, cấp trên/đồng nghiệp, bạn thân, bạn cũ ở xa) kèm sắc thái câu chữ.
 */
import * as React from "react";
import { Briefcase, HeartHandshake, Sparkles, Users } from "lucide-react";

interface InviteTemplateRole {
  id: string;
  roleLabel: string;
  toneBadge: string;
  timingNote: string;
  copyText: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ROLE_TEMPLATES: readonly InviteTemplateRole[] = [
  {
    id: "elder-relative",
    roleLabel: "Họ hàng lớn tuổi, cô chú ở xa",
    toneBadge: "Trang trọng",
    timingNote: "Gọi điện thăm hỏi ngắn trước 1–2 phút, sau đó mới gửi link thiệp qua Zalo.",
    copyText:
      "Kính gửi Chú Tư cùng Gia đình, ngày 24/05 tới gia đình cháu tổ chức Lễ Thành Hôn cho hai đứa tại Nhà hàng Kim Đô. Vì đường xa chưa kịp qua thưa chuyện tận nhà, cháu xin phép gửi Chú thiệp mời điện tử có sẵn giờ lễ và bản đồ chỉ đường bên dưới. Gia đình cháu rất mong được đón Chú và Thím đến chung vui ạ.",
    icon: Users,
  },
  {
    id: "colleague-boss",
    roleLabel: "Sếp và anh chị đồng nghiệp",
    toneBadge: "Lịch thiệp · Ấm áp",
    timingNote: "Nhắn riêng từng người (1-1), tránh thả link hàng loạt vào nhóm chat công việc.",
    copyText:
      "Em chào Chị Lan ạ. Cuối tháng này vợ chồng em tổ chức tiệc cưới vào lúc 18:00 ngày 24/05 tại Sảnh Ruby. Em xin phép gửi Chị tấm thiệp cưới online để Chị tiện lưu lịch và xem chỉ đường. Nếu hôm đó Chị thu xếp thời gian qua chung vui cùng tụi em được thì quý hóa quá ạ. Em cảm ơn Chị nhiều!",
    icon: Briefcase,
  },
  {
    id: "close-friend",
    roleLabel: "Bạn thân, hội bạn đại học",
    toneBadge: "Ngắn gọn · Gần gũi",
    timingNote: "Gửi kèm nhắc xác nhận số người đi cùng để giữ bàn sát sân khấu.",
    copyText:
      "Hùng ơi, tụi mình chính thức lên xe hoa vào tối 24/05 tại sảnh Riverside rồi đây! Gửi bạn chiếc thiệp mời mang tên riêng ở link dưới nhé, nhớ mở xem bản đồ và bấm xác nhận tham dự giúp tụi mình chốt bàn thật xịn cho hội bạn mình nha.",
    icon: HeartHandshake,
  },
  {
    id: "distant-acquaintance",
    roleLabel: "Bạn cũ lâu ngày ít liên lạc",
    toneBadge: "Tinh tế · Không gượng",
    timingNote: "Mở đầu bằng câu hỏi thăm tự nhiên, tuyệt đối không tạo áp lực phải có mặt.",
    copyText:
      "Chào Thảo, dạo này công việc và cuộc sống của bạn ổn chứ? Cuối tháng 5 này mình lập gia đình nên rất muốn chia sẻ tin vui cùng bạn. Mình gửi tấm thiệp online bên dưới để mời bạn, nếu hôm đó thuận tiện thời gian thì qua uống ly rượu mừng với tụi mình cho vui nhé!",
    icon: Sparkles,
  },
];

export function OnlineInviteTemplatesByRole() {
  return (
    <figure
      aria-label="4 mẫu lời gửi thiệp cưới online lịch sự phân theo từng nhóm khách mời"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          MẪU CÂU THEO TỪNG ĐỐI TƯỢNG
        </span>
        <span className="font-display text-xl font-semibold text-text">
          4 kịch bản lời gửi thiệp cưới qua Zalo chỉnh sẵn giọng điệu
        </span>
      </figcaption>

      <div className="space-y-3.5">
        {ROLE_TEMPLATES.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-surface-alt/45 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-lg font-semibold text-text">
                    {item.roleLabel}
                  </h3>
                </div>
                <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-semibold text-accent-text">
                  {item.toneBadge}
                </span>
              </div>

              <blockquote className="mt-3 rounded-lg border border-border bg-surface p-3.5 text-xs leading-relaxed text-text sm:text-sm">
                &ldquo;{item.copyText}&rdquo;
              </blockquote>

              <p className="mt-2 text-xs text-text-muted">
                <strong className="font-semibold text-accent-text">Cách gửi:</strong>{" "}
                {item.timingNote}
              </p>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
