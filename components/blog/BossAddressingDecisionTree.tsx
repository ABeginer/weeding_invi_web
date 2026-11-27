/**
 * Bảng cây quyết định cách ghi danh xưng, ngoài phong bì và trong ruột thiệp cưới mời sếp
 * phân loại theo 4 tình huống công sở phổ biến tại Việt Nam.
 */
import * as React from "react";
import { Award, Briefcase, Building2, UserCheck } from "lucide-react";

interface BossProfileCase {
  id: string;
  profile: string;
  prefix: string;
  envelopeText: string;
  innerCardText: string;
  note: string;
  icon: React.ComponentType<{ className?: string }>;
}

const BOSS_CASES: readonly BossProfileCase[] = [
  {
    id: "senior-boss",
    profile: "Sếp lớn tuổi (tương đương bậc chú, bác)",
    prefix: "Trân trọng kính mời",
    envelopeText: "Kính gửi: Chú / Cô [Họ Tên] (hoặc Giám đốc [Họ Tên])",
    innerCardText: "Chú [Tên] cùng Gia đình (hoặc Chú và Cô [Tên vợ/chồng])",
    note: "Ghi tên đầy đủ kèm kính ngữ, tránh viết tắt danh xưng.",
    icon: Award,
  },
  {
    id: "married-manager",
    profile: "Trưởng phòng / Quản lý hơn vài tuổi, đã có gia đình",
    prefix: "Trân trọng kính mời",
    envelopeText: "Trân trọng kính mời: Anh/Chị [Họ Tên] cùng Gia đình",
    innerCardText: "Anh/Chị [Họ Tên] cùng Gia đình",
    note: "Nếu biết tên vợ hoặc chồng sếp và từng trò chuyện, có thể ghi đích danh cả hai.",
    icon: Briefcase,
  },
  {
    id: "single-boss",
    profile: "Sếp trẻ, ngang tuổi hoặc còn độc thân",
    prefix: "Trân trọng kính mời",
    envelopeText: "Trân trọng kính mời: Anh/Chị [Họ Tên]",
    innerCardText: "Anh/Chị [Họ Tên]",
    note: "Không thêm \"cùng Gia đình\" hoặc \"Phu nhân\" nếu cấp trên chưa lập gia đình.",
    icon: UserCheck,
  },
  {
    id: "former-boss",
    profile: "Sếp cũ hoặc Ban giám đốc công ty đối tác",
    prefix: "Trân trọng kính mời",
    envelopeText: "Kính gửi: Anh/Chị [Họ Tên] (giữ khoảng cách trang trọng)",
    innerCardText: "Anh/Chị [Họ Tên] cùng Gia đình (hoặc ghi riêng tên Anh/Chị)",
    note: "Gọi điện hỏi thăm hoặc nhắn tin xin phép trước rồi mới gửi thiệp.",
    icon: Building2,
  },
];

export function BossAddressingDecisionTree() {
  return (
    <figure
      aria-label="Cách ghi tên sếp theo 4 tình huống độ tuổi và hôn nhân"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          CHỌN ĐÚNG THEO HOÀN CẢNH CẤP TRÊN
        </span>
        <span className="font-display text-xl font-semibold text-text">
          Cách ghi phong bì và ruột thiệp cho 4 nhóm sếp phổ biến
        </span>
      </figcaption>

      <div className="grid gap-3.5 sm:grid-cols-2">
        {BOSS_CASES.map((item) => {
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
                    <h3 className="font-display text-base font-semibold leading-snug text-text">
                      {item.profile}
                    </h3>
                    <span className="mt-1 inline-block rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-text">
                      {item.prefix}
                    </span>
                  </div>
                </div>

                <dl className="mt-3 space-y-1.5 text-xs">
                  <div>
                    <dt className="font-semibold text-text">Ngoài phong bì:</dt>
                    <dd className="text-text-muted">{item.envelopeText}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-text">Trong thiệp:</dt>
                    <dd className="text-text-muted">{item.innerCardText}</dd>
                  </div>
                </dl>
              </div>

              <p className="mt-3 border-t border-border pt-2 text-[11px] leading-relaxed text-text-muted">
                {item.note}
              </p>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
