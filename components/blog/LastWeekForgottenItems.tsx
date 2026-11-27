/**
 * Danh sách 7 đầu việc hậu cần nhỏ nhưng rất hay bị quên trong tuần cuối cùng trước lễ cưới
 * khi hai bên gia đình chạy đua với thời gian chuẩn bị trong 1 tháng.
 */
import * as React from "react";
import { AlertCircle } from "lucide-react";

interface ForgottenLogisticsItem {
  number: string;
  item: string;
  consequence: string;
  quickFix: string;
}

const FORGOTTEN_ITEMS: readonly ForgottenLogisticsItem[] = [
  {
    number: "01",
    item: "Gửi link bản đồ Google Maps & hướng dẫn gửi xe cho khách khác quận/tỉnh",
    consequence: "Khách đến trễ giờ khai tiệc vì tìm nhầm chi nhánh cùng tên hoặc kẹt cổng gửi xe.",
    quickFix: "Gửi kèm đường link thiệp online tích hợp bản đồ một chạm ngay trong tin nhắn nhắc lịch.",
  },
  {
    number: "02",
    item: "Thử trước file nhạc lễ đường, video ảnh cưới định dạng MP4 trên màn LED sảnh",
    consequence: "Tới lúc mở tiệc mới phát hiện màn hình không nhận USB hoặc mất tiếng khi phát nhạc.",
    quickFix: "Chép sẵn 2 USB dự phòng và test trực tiếp cùng kỹ thuật viên nhà hàng trước 2–3 ngày.",
  },
  {
    number: "03",
    item: "Chuẩn bị tiền lẻ chia sẵn từng phong bì lễ đen, bưng tráp và bồi dưỡng ekip",
    consequence: "Sáng rước dâu lúng túng đi đổi tiền hoặc thiếu phong bì cho đội bê quả.",
    quickFix: "Đổi sẵn tiền mặt và ghi chú rõ ngoài mỗi phong bì (Lễ đen, Bưng quả, Lái xe) từ tối hôm trước.",
  },
  {
    number: "04",
    item: "In hoặc lưu sẵn sơ đồ danh sách bàn tiệc cho người trực bàn đón khách",
    consequence: "Cô chú và bạn bè tự đứng dò tìm bàn gây ùn ứ ngay cửa sảnh trong 30 phút đầu.",
    quickFix: "Giao 1 danh sách xếp bàn cho bạn thân phụ trách sảnh hoặc bật tra cứu bàn qua QR.",
  },
  {
    number: "05",
    item: "Phân công rõ người giữ thùng tiền mừng, khóa thùng và sổ ghi tên phong bì",
    consequence: "Cuối tiệc cả hai gia đình mệt mỏi, khó kiểm đếm hoặc thất lạc phong bì chưa ghi tên.",
    quickFix: "Chỉ định một người thân tin cậy giữ chìa khóa thùng mừng xuyên suốt buổi tiệc.",
  },
  {
    number: "06",
    item: "Chuẩn bị túi cứu hộ nhỏ: giày đế bệt dự phòng, kim chỉ, băng cá nhân, thuốc đau đầu",
    consequence: "Cô dâu bị trầy gót giày khi đứng chào bàn liên tục 2 tiếng hoặc sút khuy áo chú rể.",
    quickFix: "Gói gọn trong một túi nhỏ giao cho phù dâu hoặc em gái cầm theo suốt ngày cưới.",
  },
  {
    number: "07",
    item: "Đặt sẵn phần ăn nhẹ sáng cho cô dâu chú rể và ekip chụp ảnh trước giờ đón dâu",
    consequence: "Dậy từ 4–5 giờ sáng trang điểm tới trưa dễ bị tụt huyết áp giữa nghi lễ.",
    quickFix: "Chuẩn bị sẵn bánh mì, sữa hoặc xôi giao sớm để cả hai ăn lót dạ trước khi vào lễ.",
  },
];

export function LastWeekForgottenItems() {
  return (
    <figure
      aria-label="7 đầu việc hậu cần dễ quên nhất trong tuần cuối trước ngày cưới"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          CHECKLIST RÀ SOÁT TUẦN CUỐI
        </span>
        <span className="font-display text-xl font-semibold text-text">
          7 việc nhỏ hay bị bỏ sót nhất trước ngày rước dâu 7 ngày
        </span>
      </figcaption>

      <div className="space-y-3">
        {FORGOTTEN_ITEMS.map((entry) => (
          <div
            key={entry.number}
            className="rounded-xl border border-border bg-surface-alt/40 p-3.5"
          >
            <div className="flex items-start gap-2.5">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-xs font-semibold text-accent-text">
                {entry.number}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-base font-semibold text-text">
                  {entry.item}
                </h3>
                <p className="mt-1 flex items-start gap-1.5 text-xs text-text-muted">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{entry.consequence}</span>
                </p>
                <p className="mt-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text">
                  <strong className="font-semibold text-accent-text">Cách xử lý:</strong>{" "}
                  {entry.quickFix}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </figure>
  );
}
