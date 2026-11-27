/**
 * Bảng đối chiếu so sánh trực tiếp giữa các lỗi xưng hô thường gặp và cách ghi đúng
 * trong văn hóa cưới hỏi Việt Nam để cô dâu chú rể rà soát nhanh trước khi gửi thiệp.
 */
import * as React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface MistakePair {
  id: string;
  caseTitle: string;
  avoidText: string;
  recommendedText: string;
  reason: string;
}

const MISTAKE_PAIRS: readonly MistakePair[] = [
  {
    id: "widowed-elder",
    caseTitle: "Người lớn tuổi chỉ còn một bác (đã góa)",
    avoidText: "Trân trọng kính mời: Bác Hai và Bác gái / Hai Bác",
    recommendedText: "Trân trọng kính mời: Bác Hai cùng Gia đình (hoặc Bác Hai)",
    reason: "Gọi đủ cả hai bác khi một người đã khuất là lỗi tối kỵ dễ gây chạnh lòng nhất.",
  },
  {
    id: "younger-senior-kin",
    caseTitle: "Cô, chú, cậu, dì ít tuổi hơn cha mẹ nhưng thuộc hàng trên",
    avoidText: "Thân mời: Em Lan (hoặc Bạn Lan) đến dự lễ cưới",
    recommendedText: "Trân trọng kính mời: Cô Lan cùng Gia đình (theo vai với cô dâu/chú rể)",
    reason: "Trong họ hàng Việt, thứ bậc vai vế luôn đứng trước tuổi tác khi đứng tên trên thiệp gia đình.",
  },
  {
    id: "parents-guests-voice",
    caseTitle: "Bạn thân của bố mẹ nhưng con tự tay viết thiệp",
    avoidText: "Cháu kính mời Chú Minh đến dự lễ cưới của tụi cháu",
    recommendedText: "Trân trọng kính mời: Anh Minh cùng Gia đình (theo vai bố mẹ đứng mời)",
    reason: "Người mời ghi trên thiệp là hai phụ huynh, nên câu mời cần nhất quán ở ngôi của bố mẹ.",
  },
  {
    id: "unmarried-boss",
    caseTitle: "Sếp hoặc quản lý còn độc thân",
    avoidText: "Trân trọng kính mời: Anh Minh và Phu nhân / Gia đình",
    recommendedText: "Trân trọng kính mời: Anh Minh (hoặc Anh Hoàng Minh)",
    reason: "Tránh gán cụm \"và Gia đình\" hay \"Phu nhân\" nếu biết chắc cấp trên chưa lập gia đình.",
  },
];

export function SalutationMistakeSplit() {
  return (
    <figure
      aria-label="So sánh lỗi xưng hô cần tránh và cách ghi thiệp cưới chuẩn"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          RÀ SOÁT TRƯỚC KHI PHÁT THIỆP
        </span>
        <span className="font-display text-xl font-semibold text-text">
          4 tình huống nhạy cảm: Nên tránh vs Nên ghi chuẩn
        </span>
      </figcaption>

      <div className="space-y-3">
        {MISTAKE_PAIRS.map((pair) => (
          <div
            key={pair.id}
            className="rounded-xl border border-border bg-surface-alt/40 p-4"
          >
            <p className="text-sm font-semibold text-text">{pair.caseTitle}</p>

            <div className="mt-2.5 grid gap-2.5 md:grid-cols-2">
              <div className="rounded-lg border border-danger-border bg-danger-bg px-3.5 py-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-danger-fg">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Nên tránh</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-text">{pair.avoidText}</p>
              </div>

              <div className="rounded-lg border border-success-border bg-success-bg px-3.5 py-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-success-fg">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Nên ghi</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-text">{pair.recommendedText}</p>
              </div>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-text-muted">{pair.reason}</p>
          </div>
        ))}
      </div>
    </figure>
  );
}
