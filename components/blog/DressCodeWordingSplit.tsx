/**
 * So sánh hai cách viết thông báo quy định trang phục trên thiệp cưới:
 * cách ra lệnh cứng nhắc dễ gây ngại với khách và cách gợi ý mềm mỏng.
 */
import * as React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface WordingPair {
  context: string;
  avoidText: string;
  betterText: string;
}

const WORDING_COMPARISONS: readonly WordingPair[] = [
  {
    context: "Ghi tiêu đề mục trên thiệp",
    avoidText: "Bắt buộc tuân thủ quy định trang phục (Dress Code)",
    betterText: "Gợi ý trang phục chung vui (Tông màu khuyến khích)",
  },
  {
    context: "Mời khách trẻ & bạn bè",
    avoidText: "Vui lòng mặc đúng 100% màu Nâu / Kem theo quy định",
    betterText: "Sẽ thật tuyệt nếu mọi người ưu tiên gam Kem, Be hoặc Nâu nhạt để lên hình thật hài hòa",
  },
  {
    context: "Dặn tránh trang phục kém phù hợp",
    avoidText: "Cấm mặc đồ ngủ, quần đùi hay áo thun rách đến dự tiệc",
    betterText: "Trang phục lịch sự, thanh lịch phù hợp không gian lễ cưới",
  },
  {
    context: "Với họ hàng, người lớn tuổi",
    avoidText: "Gửi chung thông điệp ép bảng màu cho cả ông bà, cô chú",
    betterText: "Ghi chú thêm: \"Trang phục tự chọn thoải mái nhất cho các cô chú, bác lớn tuổi\"",
  },
];

export function DressCodeWordingSplit() {
  return (
    <figure
      aria-label="So sánh cách viết thông báo dress code gượng gạo và cách viết tinh tế trên thiệp cưới"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          NGHỆ THUẬT DIỄN ĐẠT TRÊN THIỆP
        </span>
        <span className="font-display text-xl font-semibold text-text">
          Đổi từ &ldquo;quy định bắt buộc&rdquo; sang &ldquo;gợi ý để lên ảnh đẹp cùng nhau&rdquo;
        </span>
      </figcaption>

      <div className="space-y-3">
        {WORDING_COMPARISONS.map((pair) => (
          <div
            key={pair.context}
            className="rounded-xl border border-border bg-surface-alt/40 p-4"
          >
            <p className="text-xs font-semibold text-accent-text">
              {pair.context}
            </p>
            <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted">
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Nên tránh viết</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">
                  {pair.avoidText}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-accent-soft/45 px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-accent-text">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Cách viết tinh tế</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-text">
                  {pair.betterText}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </figure>
  );
}
