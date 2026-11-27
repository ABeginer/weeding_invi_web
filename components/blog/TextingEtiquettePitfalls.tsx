/**
 * Đối chiếu 6 lỗi nhắn tin gửi thiệp cưới thường gây mất thiện cảm trên Zalo/Messenger
 * và cách sửa câu chữ cụ thể cho lịch sự hơn.
 */
import * as React from "react";
import { AlertTriangle, Sparkles } from "lucide-react";

interface PitfallItem {
  id: string;
  mistakeTitle: string;
  badExample: string;
  betterExample: string;
}

const PITFALLS: readonly PitfallItem[] = [
  {
    id: "group-blast",
    mistakeTitle: "1. Thả link thiệp chung vào nhóm chat đông người",
    badExample: "Cuối tuần mình cưới, gửi cả nhà link thiệp, mọi người nhớ đi đông đủ nhé @All.",
    betterExample: "Nhắn tin riêng 1-1 cho từng đồng nghiệp, gọi đúng tên và hỏi thăm công việc 1 câu.",
  },
  {
    id: "bare-link",
    mistakeTitle: "2. Gửi mỗi đường link hoặc ảnh chụp màn hình không kèm lời chào",
    badExample: "[Dán mỗi URL thiệp cưới, không viết thêm chữ nào]",
    betterExample: "Mở đầu bằng tên khách + ngày giờ tóm tắt + lý do gửi thiệp online rồi mới tới URL.",
  },
  {
    id: "last-minute",
    mistakeTitle: "3. Nhắn mời sát ngày cưới chỉ trước 2–3 hôm",
    badExample: "Thứ bảy này tao cưới rồi nha, rảnh thì chạy qua sảnh A ăn cỗ với tụi tao.",
    betterExample: "Gửi trước ít nhất 10–14 ngày; nếu mời muộn vì thiếu sót, chân thành xin lỗi ngay câu đầu.",
  },
  {
    id: "abrupt-plusone",
    mistakeTitle: "4. Hỏi dồn số lượng người đi kèm như đang thu tiền",
    badExample: "Bạn đi mấy người báo sớm để mình còn tính tiền bàn nha.",
    betterExample: "Hùng xem có đi cùng người thương được không thì bấm chọn số khách ngay trong thiệp giúp mình sắp chỗ nha.",
  },
  {
    id: "pushy-followup",
    mistakeTitle: "5. Nhắn hối trả lời RSVP nhiều lần liên tiếp",
    badExample: "Sao thấy xem tin mà chưa phản hồi vậy bạn, có đi hay không chốt lẹ giúp mình.",
    betterExample: "Nhắn nhẹ đúng 1 lần trước ngày chốt danh sách nhà hàng kèm lý do sắp xếp chỗ ngồi.",
  },
  {
    id: "wrong-tone-old-friend",
    mistakeTitle: "6. Đột ngột gửi thiệp cho bạn cũ nhiều năm không trò chuyện mà không hỏi thăm",
    badExample: "Mời bạn dự đám cưới của mình vào ngày 24/05 nha [link].",
    betterExample: "Hỏi thăm cuộc sống hiện tại trước, nhắc khéo không ép buộc nếu bạn ở xa bận lịch.",
  },
];

export function TextingEtiquettePitfalls() {
  return (
    <figure
      aria-label="6 tình huống nhắn tin mời cưới dễ mất lòng và cách viết lại tinh tế"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          6 LỖI GIAO TIẾP CẦN TRÁNH
        </span>
        <span className="font-display text-xl font-semibold text-text">
          Sửa nhanh những cách nhắn tin mời cưới dễ làm khách thấy gượng
        </span>
      </figcaption>

      <div className="grid gap-3.5 md:grid-cols-2">
        {PITFALLS.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between rounded-xl border border-border bg-surface-alt/40 p-4"
          >
            <h3 className="font-display text-base font-semibold text-text">
              {item.mistakeTitle}
            </h3>

            <div className="mt-3 space-y-2">
              <div className="rounded-lg border border-border bg-surface p-2.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-text-muted">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                  Dễ gây hiểu lầm
                </span>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">
                  {item.badExample}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-surface p-2.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-accent-text">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Cách nhắn tinh tế
                </span>
                <p className="mt-1 text-xs leading-relaxed text-text">
                  {item.betterExample}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </figure>
  );
}
