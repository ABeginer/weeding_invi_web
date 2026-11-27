/**
 * 3 mẫu tin nhắn Zalo gửi thiệp cưới riêng cho sếp (sếp trực tiếp vừa nhận thiệp giấy,
 * sếp ở xa/chi nhánh khác, và sếp cũ) bám sát giọng điệu trang trọng của Inviwedd.
 */
import * as React from "react";
import { MessageSquareQuote, Send, ShieldCheck } from "lucide-react";

interface BossTemplateItem {
  id: string;
  label: string;
  context: string;
  messageText: string;
  tip: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TEMPLATES: readonly BossTemplateItem[] = [
  {
    id: "in-person-followup",
    label: "Mẫu 1: Gửi kèm link bản đồ sau khi trao thiệp giấy",
    context: "Phù hợp cho sếp làm việc cùng văn phòng, đã nhận thiệp trực tiếp.",
    messageText:
      "Em chào Anh/Chị [Tên sếp]. Hôm nay em xin phép gửi sếp thiệp giấy, em gửi thêm thiệp cưới online kèm đường link bản đồ nhà hàng và lịch giờ đón khách để Anh/Chị tiện lưu lại hôm tới di chuyển ạ. Nếu hôm đó Anh/Chị sắp xếp tham dự được cùng gia đình thì vui cho vợ chồng em quá. Em cảm ơn Anh/Chị nhiều!",
    tip: "Gửi nhắn riêng 1-1 cuối giờ chiều hoặc ngay sau khi trao thiệp.",
    icon: Send,
  },
  {
    id: "remote-boss",
    label: "Mẫu 2: Mời sếp ở chi nhánh khác / đang đi công tác",
    context: "Khi khoảng cách địa lý không cho phép gặp trực tiếp để đưa thiệp.",
    messageText:
      "Kính gửi Anh/Chị [Họ Tên], cuối tháng này vợ chồng em tổ chức lễ thành hôn tại [Địa điểm]. Vì Anh/Chị đang công tác xa nên em chưa có dịp gửi thiệp giấy tận tay, xin phép gửi Anh/Chị tấm thiệp điện tử riêng qua tin nhắn này. Vợ chồng em rất mong có dịp được đón tiếp Anh/Chị đến chung vui ạ.",
    tip: "Nên gọi điện ngắn khoảng 1 phút xin phép trước khi nhấn gửi tin nhắn.",
    icon: MessageSquareQuote,
  },
  {
    id: "former-boss",
    label: "Mẫu 3: Mời sếp cũ hoặc người hướng dẫn nghề nghiệp",
    context: "Giữ sự tôn trọng nhưng vẫn tự nhiên sau khi đã chuyển chỗ làm.",
    messageText:
      "Em chào Anh/Chị [Tên sếp], lâu rồi chưa có dịp gặp lại Anh/Chị. Tháng này em lập gia đình và rất muốn mời Anh/Chị tới dự bữa tiệc chung vui cùng hai bên gia đình tụi em vào ngày [Ngày] tại [Nhà hàng]. Em gửi Anh/Chị thiệp mời riêng ở bên dưới, nếu Anh/Chị thu xếp được thời gian qua uống với em ly rượu mừng thì quý hóa quá ạ.",
    tip: "Không dùng lời mời quá ngắn cụt hay giọng hài hước như nhắn bạn thân.",
    icon: ShieldCheck,
  },
];

export function BossZaloTemplatesCard() {
  return (
    <figure
      aria-label="3 mẫu tin nhắn Zalo gửi thiệp cưới lịch sự cho cấp trên"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          MẪU TIN NHẮN GỬI RIÊNG 1-1
        </span>
        <span className="font-display text-xl font-semibold text-text">
          3 kịch bản nhắn tin Zalo kèm thiệp cưới gửi sếp lịch sự
        </span>
      </figcaption>

      <div className="space-y-3.5">
        {TEMPLATES.map((tpl) => {
          const Icon = tpl.icon;
          return (
            <div
              key={tpl.id}
              className="rounded-xl border border-border bg-surface-alt/45 p-4"
            >
              <div className="flex items-start gap-2.5">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-text">
                    {tpl.label}
                  </h3>
                  <p className="text-xs text-text-muted">{tpl.context}</p>
                </div>
              </div>

              <blockquote className="mt-3 rounded-lg border border-border bg-surface p-3.5 text-xs leading-relaxed text-text sm:text-sm">
                &ldquo;{tpl.messageText}&rdquo;
              </blockquote>

              <p className="mt-2 text-xs text-text-muted">
                <strong className="font-semibold text-accent-text">Lưu ý:</strong> {tpl.tip}
              </p>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
