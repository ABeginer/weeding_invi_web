/**
 * Biểu đồ so sánh tổng chi phí cho đám cưới quy mô 250 khách theo 3 phương án:
 * in 100% thiệp giấy, dùng 100% thiệp online, và phương án kết hợp 40% thiệp giấy + 60% online.
 */
import * as React from "react";
import { Coins } from "lucide-react";

interface CostScenario {
  id: string;
  label: string;
  costEstimate: string;
  barPercent: number;
  breakdown: string;
  verdict: string;
}

const COST_SCENARIOS: readonly CostScenario[] = [
  {
    id: "paper-only",
    label: "Phương án 1: In 100% thiệp giấy (250 bộ)",
    costEstimate: "1.250.000đ – 3.000.000đ+",
    barPercent: 95,
    breakdown:
      "Đơn giá trung bình 5.000đ–12.000đ/bộ (cộng thêm chi phí in thêm 20–30 thiệp dự phòng và gửi bưu điện đi tỉnh).",
    verdict: "Chi phí cao nhất và tốn nhiều công viết tay phong bì.",
  },
  {
    id: "hybrid-40-60",
    label: "Phương án 2: Kết hợp 40% Giấy (100 bộ) + 60% Online (150 khách)",
    costEstimate: "659.000đ – 1.159.000đ",
    barPercent: 45,
    breakdown:
      "100 thiệp giấy trang trọng (~500.000đ–1.000.000đ) kết hợp gói thiệp online Standard 159.000đ không giới hạn khách.",
    verdict: "Tối ưu nhất: trọn lễ nghi gia đình vừa tiết kiệm hơn 50% chi phí và thu RSVP chuẩn.",
  },
  {
    id: "online-only",
    label: "Phương án 3: Dùng 100% thiệp cưới online (gói Standard)",
    costEstimate: "159.000đ trọn gói",
    barPercent: 14,
    breakdown:
      "Khởi tạo miễn phí với 20 khách đầu; nâng cấp Standard 159.000đ (Pro 399.000đ nếu dùng Album QR 300 ảnh).",
    verdict: "Rẻ và nhanh nhất, phù hợp tiệc báo hỷ bạn bè hoặc cô dâu chú rể ở nước ngoài.",
  },
];

export function InvitationCostBreakdown250() {
  return (
    <figure
      aria-label="So sánh chi phí thiệp cưới cho 250 khách theo 3 phương án"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
            ƯỚC LƯỢNG NGÂN SÁCH (QUY MÔ 250 KHÁCH)
          </span>
          <span className="mt-0.5 block font-display text-xl font-semibold text-text">
            Chênh lệch chi phí giữa 3 kịch bản chuẩn bị thiệp cưới
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-text">
          <Coins className="h-3.5 w-3.5" aria-hidden="true" />
          Tiết kiệm tới 60%
        </span>
      </figcaption>

      <div className="space-y-4">
        {COST_SCENARIOS.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-border bg-surface-alt/45 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-base font-semibold text-text">
                {item.label}
              </h3>
              <span className="rounded-full bg-accent-soft px-3 py-0.5 text-xs font-semibold text-accent-text">
                {item.costEstimate}
              </span>
            </div>

            <div
              className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface"
              aria-hidden="true"
            >
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${item.barPercent}%` }}
              />
            </div>

            <p className="mt-2.5 text-xs leading-relaxed text-text-muted">
              {item.breakdown}
            </p>
            <p className="mt-1 text-xs font-medium text-text">
              <strong className="font-semibold text-accent-text">Nhận định:</strong>{" "}
              {item.verdict}
            </p>
          </div>
        ))}
      </div>
    </figure>
  );
}
