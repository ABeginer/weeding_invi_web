/**
 * Hướng dẫn cách ghi tên cha mẹ chú rể trong các trường hợp gia đình đặc biệt
 * (khuyết một bên phụ huynh, bố mẹ không chung sống, thứ bậc con trai trong dòng họ).
 */
import * as React from "react";
import { AlertCircle, CheckCircle2, Users } from "lucide-react";

interface SpecialFamilyCase {
  id: string;
  situation: string;
  recommendedFormat: string;
  avoidFormat: string;
  note: string;
}

const SPECIAL_CASES: readonly SpecialFamilyCase[] = [
  {
    id: "single-surviving-parent",
    situation: "Chỉ còn Bố hoặc chỉ còn Mẹ đứng tên",
    recommendedFormat: "Ông Nguyễn Văn Hùng (hoặc Quả phụ Trần Thị Mai / Bà Trần Thị Mai)",
    avoidFormat: "Ghi chung \"Ông Bà\" hoặc để trống một dòng gây khó hiểu",
    note: "Nhiều gia đình miền Bắc ghi \"Bà Trần Thị Mai\", còn miền Trung/Nam thường dùng \"Quả phụ [Họ tên bố hoặc mẹ]\" hoặc ghi trang trọng mỗi tên người còn lại.",
  },
  {
    id: "both-parents-deceased",
    situation: "Cả hai song thân đều đã khuất",
    recommendedFormat: "Đại diện gia đình (Bác/Chú ruột) đứng tên hoặc \"Cố phụ... / Gia đình chúng tôi\"",
    avoidFormat: "Bỏ hoàn toàn cột nhà trai mà không có người đại diện",
    note: "Nên hỏi ý kiến bậc trưởng họ xem chú bác hay anh trai cả đứng tên chủ hôn, giữ sự trang nghiêm với khách mời.",
  },
  {
    id: "son-rank",
    situation: "Thứ bậc của chú rể dưới tên riêng",
    recommendedFormat: "Trưởng Nam (con đầu), Thứ Nam (con giữa), Quý Nam hoặc Út Nam (con út)",
    avoidFormat: "Ghi nhầm \"Đích Nam\" nếu không phải con trai một / trưởng tộc",
    note: "Miền Nam hay ghi Thứ Nam / Út Nam; nếu chú rể là con trai duy nhất trong nhà thì ghi Trưởng Nam hoặc Quý Nam đều lịch sự.",
  },
  {
    id: "divorced-parents",
    situation: "Bố mẹ ly hôn nhưng cùng dự lễ cưới",
    recommendedFormat: "Vẫn ghi song song Ông [Tên Bố] & Bà [Tên Mẹ] (bỏ chữ \"Và\") hoặc ghi từng dòng",
    avoidFormat: "Tự ý bỏ tên một người khi cả hai vẫn tham dự và đón khách",
    note: "Thống nhất trước với cả bố và mẹ về cách ghi trên thiệp để tránh hiểu nhầm ngay sát ngày cưới.",
  },
];

export function GroomSpecialFamilyCases() {
  return (
    <figure
      aria-label="Cách ghi tên gia đình chú rể trong 4 tình huống đặc biệt"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          TÌNH HUỐNG GIA ĐÌNH ĐẶC BIỆT
        </span>
        <span className="font-display text-xl font-semibold text-text">
          Cách ghi thông tin nhà trai khéo léo khi hoàn cảnh gia đình khác mặc định
        </span>
      </figcaption>

      <div className="space-y-3">
        {SPECIAL_CASES.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-border bg-surface-alt/40 p-4"
          >
            <h3 className="font-display text-base font-semibold text-text">
              {item.situation}
            </h3>

            <div className="mt-2.5 grid gap-2.5 md:grid-cols-2">
              <div className="rounded-lg border border-success-border bg-success-bg px-3.5 py-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-success-fg">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Cách ghi chuẩn</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-text">
                  {item.recommendedFormat}
                </p>
              </div>

              <div className="rounded-lg border border-danger-border bg-danger-bg px-3.5 py-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-danger-fg">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Nên tránh</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-text">
                  {item.avoidFormat}
                </p>
              </div>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-text-muted">{item.note}</p>
          </div>
        ))}
      </div>
    </figure>
  );
}
