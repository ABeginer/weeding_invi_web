/**
 * Bảng đối chiếu quy tắc xưng hô theo 4 nhóm vai vế trong tiếng Việt và cách hệ thống
 * Inviwedd tự động sinh câu mời tương ứng từng nhóm (đã kiểm chứng trên lib/salutation-engine.ts).
 */
import * as React from "react";
import { BookCheck, MessageSquareText, Sparkles, UserCheck } from "lucide-react";

interface KinshipRuleRow {
  groupKey: string;
  label: string;
  triggerTokens: string;
  invitePrefix: string;
  guestFormat: string;
  hostPronoun: string;
  overrideHint: string;
  icon: React.ComponentType<{ className?: string }>;
}

const KINSHIP_RULES: readonly KinshipRuleRow[] = [
  {
    groupKey: "elder",
    label: "Bề trên / Họ hàng",
    triggerTokens: "Ông, Bà, Bác, Chú, Cô, Dì, Dượng, Cậu, Mợ, Thím",
    invitePrefix: "Trân trọng kính mời",
    guestFormat: "[Danh xưng + Tên] cùng Gia đình",
    hostPronoun: "Gia đình chúng tôi",
    overrideHint: "Ghi riêng danh xưng bằng tay nếu khách gọi theo vai đặc biệt (ví dụ Chú Bảy nhưng là Cậu bên ngoại).",
    icon: BookCheck,
  },
  {
    groupKey: "family",
    label: "Gia đình nội ngoại gần",
    triggerTokens: "Gia đình, Nhà trai, Nhà gái, Ruột thịt",
    invitePrefix: "Trân trọng kính mời",
    guestFormat: "[Tên gia đình / Ông bà sui gia]",
    hostPronoun: "Gia đình chúng tôi",
    overrideHint: "Lễ Vu Quy và Thành Hôn ưu tiên đọc kỹ tên hai bên gia trưởng trước khi phát hành.",
    icon: UserCheck,
  },
  {
    groupKey: "peer_formal",
    label: "Đồng nghiệp / Cấp trên / Đối tác",
    triggerTokens: "Anh, Chị, Sếp, Công ty, Cơ quan, Đối tác",
    invitePrefix: "Trân trọng mời",
    guestFormat: "Anh / Chị [Tên] (hoặc kèm Gia đình nếu đã kết hôn)",
    hostPronoun: "Vợ chồng chúng tôi",
    overrideHint: "Với sếp lớn tuổi hơn nhiều, có thể nâng tiền tố lên \"Trân trọng kính mời\" để tăng độ trang trọng.",
    icon: MessageSquareText,
  },
  {
    groupKey: "close_friend",
    label: "Bạn bè cùng lứa / Bạn thân",
    triggerTokens: "Bạn, Bạn thân, Tri kỷ, Hội lớp",
    invitePrefix: "Thân mời",
    guestFormat: "[Tên bạn] (linh hoạt kèm +1 / người thương)",
    hostPronoun: "Tụi mình",
    overrideHint: "Giữ giọng tự nhiên trong lời nhắn Zalo, vẫn giữ rõ ngày giờ và địa điểm sảnh tiệc.",
    icon: Sparkles,
  },
];

export function KinshipPrefixMatrix() {
  return (
    <figure
      aria-label="Ma trận chuẩn hóa xưng hô theo 4 nhóm khách mời Việt Nam"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          CHUẨN HÓA THEO 4 NHÓM VAI VẾ
        </span>
        <span className="font-display text-xl font-semibold text-text">
          Quy tắc suy luận danh xưng và lời mời cho từng nhóm khách
        </span>
      </figcaption>

      <div className="grid gap-3.5 sm:grid-cols-2">
        {KINSHIP_RULES.map((row) => {
          const Icon = row.icon;
          return (
            <div
              key={row.groupKey}
              className="flex flex-col justify-between rounded-xl border border-border bg-surface-alt/45 p-4"
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-lg font-semibold text-text">
                    {row.label}
                  </h3>
                </div>

                <dl className="mt-3 space-y-2 text-xs">
                  <div>
                    <dt className="font-semibold text-text">Từ khóa nhận diện:</dt>
                    <dd className="mt-0.5 text-text-muted">{row.triggerTokens}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-text">Tiền tố + Tự xưng:</dt>
                    <dd className="mt-0.5 text-text-muted">
                      <span className="font-medium text-accent-text">{row.invitePrefix}</span> ·{" "}
                      {row.hostPronoun}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-text">Định dạng tên trên thiệp:</dt>
                    <dd className="mt-0.5 font-medium text-text">{row.guestFormat}</dd>
                  </div>
                </dl>
              </div>

              <p className="mt-3 border-t border-border pt-2.5 text-[11px] leading-relaxed text-text-muted">
                Lưu ý ngoại lệ: {row.overrideHint}
              </p>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
