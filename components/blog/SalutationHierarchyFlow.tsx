/**
 * Biểu đồ luồng quyết định cách xưng hô ghi thiệp cưới theo hai trục:
 * người đứng tên mời trên thiệp và vai vế khách nhận để chọn tiền tố lời mời chuẩn.
 */
import * as React from "react";
import { ArrowRight, Briefcase, Crown, HeartHandshake, Users } from "lucide-react";

interface FlowPathItem {
  id: string;
  hostLabel: string;
  guestTier: string;
  prefix: string;
  hostPronoun: string;
  suffixNote: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FLOW_PATHS: readonly FlowPathItem[] = [
  {
    id: "parents-elders",
    hostLabel: "Bố mẹ hai bên đứng tên mời",
    guestTier: "Ông bà, Cô chú, Bác, Sui gia",
    prefix: "Trân trọng kính mời",
    hostPronoun: "Gia đình chúng tôi",
    suffixNote: "Kèm \"cùng Gia đình\" (trừ trường hợp đã mất một người)",
    icon: Crown,
  },
  {
    id: "parents-peers",
    hostLabel: "Bố mẹ đứng tên (khách của bố mẹ)",
    guestTier: "Bạn bố mẹ, đồng nghiệp phụ huynh",
    prefix: "Trân trọng kính mời",
    hostPronoun: "Gia đình chúng tôi",
    suffixNote: "Xưng \"Anh/Chị\" hoặc \"Ông/Bà\" theo đúng vai của bố mẹ, không ghi \"cháu\"",
    icon: Users,
  },
  {
    id: "couple-colleagues",
    hostLabel: "Cô dâu chú rể trực tiếp mời",
    guestTier: "Sếp, Anh/Chị đồng nghiệp, Đối tác",
    prefix: "Trân trọng mời / Trân trọng kính mời (với sếp lớn tuổi)",
    hostPronoun: "Hai vợ chồng / Em – Cháu",
    suffixNote: "Thêm \"cùng Gia đình\" nếu đã lập gia đình; dùng \"Anh/Chị\" nếu còn độc thân",
    icon: Briefcase,
  },
  {
    id: "couple-friends",
    hostLabel: "Cô dâu chú rể trực tiếp mời",
    guestTier: "Bạn cùng lớp, bạn thân thiết",
    prefix: "Thân mời",
    hostPronoun: "Tụi mình / Hai đứa mình",
    suffixNote: "Có thể ghi tên gọi thân mật kèm \"và người thương\" nếu đi cùng nửa kia",
    icon: HeartHandshake,
  },
];

export function SalutationHierarchyFlow() {
  return (
    <figure
      aria-label="Sơ đồ quyết định xưng hô ghi thiệp cưới theo chủ nhà và vai vế khách"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          QUY TẮC 2 TRỤC XÁC ĐỊNH LỜI MỜI
        </span>
        <span className="font-display text-xl font-semibold text-text">
          Chủ nhà đứng tên + Vai vế khách = Câu mở đầu chuẩn lễ nghĩa
        </span>
      </figcaption>

      <div className="space-y-3">
        {FLOW_PATHS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="grid gap-3 rounded-xl border border-border bg-surface-alt/55 p-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.1fr)] md:items-center"
            >
              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-medium text-text-muted">{item.hostLabel}</p>
                  <p className="mt-0.5 text-sm font-semibold text-text">{item.guestTier}</p>
                </div>
              </div>

              <div className="hidden text-accent-text md:flex md:items-center md:justify-center">
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </div>

              <div className="rounded-lg border border-border bg-surface px-3.5 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent-text">
                    {item.prefix}
                  </span>
                  <span className="text-xs text-text-muted">
                    Tự xưng: <strong className="font-medium text-text">{item.hostPronoun}</strong>
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-text-muted">
                  {item.suffixNote}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
