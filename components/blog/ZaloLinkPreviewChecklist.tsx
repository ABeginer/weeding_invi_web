/**
 * Bảng đối chiếu thói quen nên áp dụng và lỗi cần tránh khi đính kèm liên kết
 * thiệp cưới online trên Zalo hoặc Messenger để tránh cảm giác gửi hàng loạt.
 */
import * as React from "react";
import { CheckCircle2, XCircle } from "lucide-react";

interface ComparisonRow {
  topic: string;
  doAction: string;
  avoidAction: string;
}

const CHECKLIST_ROWS: readonly ComparisonRow[] = [
  {
    topic: "Đường dẫn thiệp",
    doAction: "Dùng link riêng từng khách (/m/ten-khach) hiển thị đúng tên và lời xưng hô khi mở thiệp.",
    avoidAction: "Gửi chung một link tổng khiến khách tự hỏi chủ nhà có nhớ tên mình hay không.",
  },
  {
    topic: "Kênh gửi tin nhắn",
    doAction: "Nhắn riêng 1-1 cho từng người hoặc vợ chồng, kèm một câu hỏi thăm phù hợp hoàn cảnh.",
    avoidAction: "Thả một đường link vào nhóm Zalo công ty hoặc nhóm bạn đông người rồi tag @All.",
  },
  {
    topic: "Vị trí đặt URL",
    doAction: "Đặt link ở dòng cuối cùng sau lời chào để Zalo/Messenger hiện trọn thẻ ảnh xem trước.",
    avoidAction: "Chèn link giữa đoạn văn dài hoặc gửi thêm đường link rác làm mất ảnh bìa thiệp.",
  },
  {
    topic: "Lời nhắc xác nhận",
    doAction: "Khéo léo nhờ khách bấm RSVP trước tiệc 7–10 ngày để gia đình xếp chỗ ngồi chu đáo.",
    avoidAction: "Nhắn dồn dập nhiều lần trong ngày hoặc đặt câu hỏi theo kiểu chốt đơn, thúc ép.",
  },
];

export function ZaloLinkPreviewChecklist() {
  return (
    <figure
      aria-label="So sánh nên làm và cần tránh khi gửi link thiệp cưới online qua Zalo"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          KIỂM TRA TRƯỚC KHI NHẤN GỬI
        </span>
        <span className="font-display text-xl font-semibold text-text">
          Phân biệt tin nhắn gửi thiệp tinh tế và lỗi giống tin spam
        </span>
      </figcaption>

      <div className="space-y-3">
        {CHECKLIST_ROWS.map((row) => (
          <div
            key={row.topic}
            className="grid gap-3 rounded-xl border border-border bg-surface-alt/40 p-3.5 sm:grid-cols-2"
          >
            <div className="rounded-lg border border-border bg-surface p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-accent-text">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Nên làm · {row.topic}</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-text sm:text-sm">
                {row.doAction}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-surface p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
                <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Tránh mắc phải</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-text-muted sm:text-sm">
                {row.avoidAction}
              </p>
            </div>
          </div>
        ))}
      </div>
    </figure>
  );
}
