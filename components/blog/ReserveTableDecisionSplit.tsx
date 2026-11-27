/**
 * Đối chiếu hai cách đặt bàn dự phòng khi làm hợp đồng nhà hàng tiệc cưới:
 * đặt bàn chờ linh hoạt theo suất thực dùng so với đặt dư sẵn nguyên mâm cố định.
 */
import * as React from "react";
import { CheckCircle2, Scale } from "lucide-react";

interface ReserveStrategy {
  id: string;
  badge: string;
  title: string;
  costImpact: string;
  bestWhen: string;
  contractTip: string;
}

const STRATEGIES: readonly ReserveStrategy[] = [
  {
    id: "standby-tables",
    badge: "Khuyên dùng · Tối ưu chi phí",
    title: "Đặt 5%–10% bàn dự phòng dạng bàn chờ (chưa khui)",
    costImpact: "Chỉ tính tiền nếu thực tế mở thêm bàn đón khách phát sinh; không dùng tới = 0 ₫.",
    bestWhen: "Tiệc cưới tại trung tâm hội nghị, nhà hàng chuyên tiệc hoặc đã thu RSVP trước.",
    contractTip:
      "Ghi rõ trong hợp đồng mức bàn dự bị (ví dụ 20 chính + 2 chờ) và hỏi trước thời gian nhà hàng lên món cho bàn phát sinh.",
  },
  {
    id: "prebooked-buffer",
    badge: "Thận trọng · Dễ phát sinh mâm thừa",
    title: "Đặt dư sẵn bàn chính thức không hoàn hủy",
    costImpact: "Khách đi ít hơn dự kiến vẫn phải thanh toán đủ tiền cỗ (mất 4–7 triệu/mâm thừa).",
    bestWhen: "Đãi cỗ tại tư gia thuê nấu lưu động theo số mâm chốt cứng từ sáng sớm.",
    contractTip:
      "Nếu thuê nấu tại nhà, giữ dự phòng bằng cách báo trước với đơn vị nấu số mâm sơ cua thay vì bày hết 100% lên bàn ngay từ đầu.",
  },
];

export function ReserveTableDecisionSplit() {
  return (
    <figure
      aria-label="So sánh 2 cách đặt bàn dự phòng tránh thiếu chỗ và không lỗ tiền cỗ"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          CHIẾN LƯỢC ĐẶT BÀN DỰ PHÒNG
        </span>
        <span className="font-display text-xl font-semibold text-text">
          Nên đặt bàn dự phòng kiểu nào khi ký hợp đồng nhà hàng?
        </span>
      </figcaption>

      <div className="grid gap-4 md:grid-cols-2">
        {STRATEGIES.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between rounded-xl border border-border bg-surface-alt/45 p-4"
          >
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-semibold text-accent-text">
                {item.id === "standby-tables" ? (
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Scale className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {item.badge}
              </span>
              <h3 className="mt-2.5 font-display text-lg font-semibold text-text">
                {item.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-text">
                <strong className="font-semibold text-accent-text">Tác động tài chính:</strong>{" "}
                {item.costImpact}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-text-muted">
                <strong className="font-semibold text-text">Phù hợp khi:</strong> {item.bestWhen}
              </p>
            </div>

            <p className="mt-3 rounded-lg border border-border bg-surface px-3 py-2 text-xs leading-relaxed text-text-muted">
              <strong className="font-semibold text-text">Lưu ý hợp đồng:</strong>{" "}
              {item.contractTip}
            </p>
          </div>
        ))}
      </div>
    </figure>
  );
}
