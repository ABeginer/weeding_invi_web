/**
 * So sánh quy trình đón khách bằng danh sách giấy truyền thống với thẻ check-in QR
 * hiển thị sẵn tên khách và số bàn tiệc trên điện thoại.
 */
import * as React from "react";
import { CheckCircle2, Clock } from "lucide-react";

interface ReceptionModeRow {
  topic: string;
  paperDesk: string;
  qrCheckin: string;
}

const RECEPTION_ROWS: readonly ReceptionModeRow[] = [
  {
    topic: "Tìm số bàn lúc cao điểm 18:00–18:30",
    paperDesk: "Khách xếp hàng chờ bạn lễ tân dò từng dòng tên trên bản in A4 dễ bị ùn tắc cửa sảnh.",
    qrCheckin: "Khách mở thẻ mời trên Zalo hoặc quét QR tra cứu bàn để biết ngay mình ngồi Bàn 05 hay Khu VIP.",
  },
  {
    topic: "Xác nhận khách đã tới dự thực tế",
    paperDesk: "Khó biết bàn nào đã đủ người và bàn nào còn trống để điều phối ghép chỗ.",
    qrCheckin: "Lễ tân quét nhanh thẻ QR check-in của khách, bảng thống kê tự cập nhật tỷ lệ lấp đầy từng bàn.",
  },
  {
    topic: "Cảm giác trải nghiệm của khách trẻ",
    paperDesk: "Giống thủ tục điểm danh thông thường, ít yếu tố mới mẻ để chia sẻ ảnh lên mạng xã hội.",
    qrCheckin: "Nhận thẻ chào mừng thiết kế đẹp mắt mang tên riêng và có thể gửi kèm ảnh lên màn hình LED.",
  },
];

export function QrBoardingPassBenefitsSplit() {
  return (
    <figure
      aria-label="So sánh bàn lễ tân giấy truyền thống và QR check-in tra cứu bàn tiệc"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          GIẢI QUYẾT CẢNH ÙN Ứ GIỜ ĐÓN KHÁCH
        </span>
        <span className="font-display text-xl font-semibold text-text">
          Khác biệt giữa bàn lễ tân dò giấy và check-in bằng mã QR cá nhân
        </span>
      </figcaption>

      <div className="space-y-3">
        {RECEPTION_ROWS.map((row) => (
          <div
            key={row.topic}
            className="rounded-xl border border-border bg-surface-alt/40 p-3.5"
          >
            <h3 className="font-display text-base font-semibold text-text">
              {row.topic}
            </h3>

            <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-surface p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted">
                  <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Bàn danh sách giấy</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-text-muted sm:text-sm">
                  {row.paperDesk}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-surface p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-accent-text">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Check-in QR &amp; Thẻ bàn tiệc</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-text sm:text-sm">
                  {row.qrCheckin}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </figure>
  );
}
