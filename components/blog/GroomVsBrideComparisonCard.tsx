/**
 * Bảng đối chiếu trực quan 3 biến thể thiệp cưới Việt Nam: Nhà trai (Thành Hôn / Tân Hôn),
 * Nhà gái (Vu Quy) và Thiệp chung hai họ (Báo Hỷ) giúp tránh in nhầm thứ tự cột và tên lễ.
 */
import * as React from "react";
import { ArrowLeftRight, Building, Heart, Sparkles } from "lucide-react";

interface VariantCard {
  id: string;
  badge: string;
  title: string;
  parentOrder: string;
  coupleOrder: string;
  headlinePhrase: string;
  useCase: string;
  icon: React.ComponentType<{ className?: string }>;
}

const VARIANTS: readonly VariantCard[] = [
  {
    id: "groom",
    badge: "Nhà trai phát thiệp",
    title: "Lễ Thành Hôn / Lễ Tân Hôn",
    parentOrder: "Bố mẹ Chú rể bên trái (hoặc trên)",
    coupleOrder: "Tên Chú rể trước -> Tên Cô dâu sau",
    headlinePhrase: "Trân trọng báo tin Lễ Thành Hôn của con chúng tôi",
    useCase: "Dùng cho khách họ nội, bạn bố mẹ chú rể và khách dự tiệc tại nhà trai.",
    icon: Building,
  },
  {
    id: "bride",
    badge: "Nhà gái phát thiệp",
    title: "Lễ Vu Quy",
    parentOrder: "Bố mẹ Cô dâu bên trái (hoặc trên)",
    coupleOrder: "Tên Cô dâu trước -> Tên Chú rể sau",
    headlinePhrase: "Trân trọng báo tin Lễ Vu Quy của con chúng tôi",
    useCase: "Dùng cho họ ngoại, khách nhà gái và tiệc tiễn dâu tại tư gia hoặc nhà hàng bên nữ.",
    icon: Heart,
  },
  {
    id: "joint",
    badge: "Tổ chức chung / Báo hỷ",
    title: "Lễ Cưới / Tiệc Báo Hỷ",
    parentOrder: "Nhà trai trái - Nhà gái phải (hoặc chỉ tên cặp đôi)",
    coupleOrder: "Tên Chú rể trước -> Tên Cô dâu sau",
    headlinePhrase: "Trân trọng kính mời đến dự Tiệc Mừng Lễ Thành Hôn / Báo Hỷ",
    useCase: "Phù hợp hai gia đình ở gần tổ chức chung một sảnh lớn hoặc tiệc bạn bè riêng tại thành phố.",
    icon: Sparkles,
  },
];

export function GroomVsBrideComparisonCard() {
  return (
    <figure
      aria-label="So sánh bố cục thiệp nhà trai, thiệp nhà gái và thiệp báo hỷ chung"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
          ĐỐI CHIẾU THEO NGƯỜI PHÁT THIỆP
        </span>
        <span className="font-display text-xl font-semibold text-text">
          Khác biệt cốt lõi giữa thiệp Nhà trai, Nhà gái và Tiệc chung
        </span>
      </figcaption>

      <div className="grid gap-3.5 lg:grid-cols-3">
        {VARIANTS.map((v) => {
          const Icon = v.icon;
          return (
            <div
              key={v.id}
              className="flex flex-col justify-between rounded-xl border border-border bg-surface-alt/45 p-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-semibold text-accent-text">
                    {v.badge}
                  </span>
                  <Icon className="h-4 w-4 text-accent-text" aria-hidden="true" />
                </div>

                <h3 className="mt-2.5 font-display text-lg font-semibold text-text">
                  {v.title}
                </h3>

                <dl className="mt-3 space-y-2 text-xs">
                  <div>
                    <dt className="font-semibold text-text">Vị trí song thân:</dt>
                    <dd className="text-text-muted">{v.parentOrder}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-text">Thứ tự cô dâu chú rể:</dt>
                    <dd className="text-text-muted">{v.coupleOrder}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-text">Câu tiêu đề chuẩn:</dt>
                    <dd className="mt-0.5 rounded border border-border bg-surface px-2.5 py-1.5 font-medium text-text">
                      {v.headlinePhrase}
                    </dd>
                  </div>
                </dl>
              </div>

              <p className="mt-3 border-t border-border pt-2.5 text-[11px] leading-relaxed text-text-muted">
                {v.useCase}
              </p>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
