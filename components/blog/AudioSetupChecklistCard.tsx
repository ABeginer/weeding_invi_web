/**
 * Checklist kiểm tra kỹ thuật âm thanh giữa sảnh tiệc nhà hàng
 * và trình phát nhạc nền tích hợp trên thiệp cưới online.
 */
import * as React from "react";
import { Radio, Smartphone } from "lucide-react";

export function AudioSetupChecklistCard() {
  return (
    <figure
      aria-label="Checklist kiểm tra nhạc nền cho sảnh tiệc và thiệp cưới điện tử"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          KIỂM TRA KỸ THUẬT TRƯỚC NGÀY CƯỚI
        </span>
        <span className="font-display text-xl font-semibold text-text">
          Hai điểm cần rà soát để nhạc nền chạy mượt cả ngoài sảnh lẫn trên điện thoại
        </span>
      </figcaption>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface-alt/45 p-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
              <Radio className="h-4 w-4" aria-hidden="true" />
            </span>
            <h3 className="font-display text-base font-semibold text-text">
              Hệ thống loa sảnh nhà hàng
            </h3>
          </div>
          <ul className="mt-3 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-text-muted">
            <li>Chép file MP3 320kbps vào USB riêng theo thứ tự số 01, 02, 03 tránh phụ thuộc mạng Wi-Fi sảnh.</li>
            <li>Cân lại âm lượng nhạc đón khách ở mức 35–45% để người ngồi gần loa không bị chói tai.</li>
            <li>Cắt sẵn đoạn dạo đầu quá dài ở bản nhạc làm lễ để tránh cô dâu đứng chờ giữa thảm đỏ.</li>
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-accent-soft/45 p-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
              <Smartphone className="h-4 w-4" aria-hidden="true" />
            </span>
            <h3 className="font-display text-base font-semibold text-text">
              Nhạc nền trên thiệp cưới online
            </h3>
          </div>
          <ul className="mt-3 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-text-muted">
            <li>Chọn bản hòa tấu nhẹ, nhịp dịu ngay từ giây đầu tiên để tránh làm giật mình khách mở thiệp nơi công sở.</li>
            <li>Đảm bảo có nút bật/tắt loa gọn ở góc màn hình cho người dùng iPhone và Android.</li>
            <li>Ưu tiên đồng bộ tông nhạc với chủ đề thiệp (ví dụ piano cổ điển cho thiệp tối giản, acoustic cho thiệp sân vườn).</li>
          </ul>
        </div>
      </div>
    </figure>
  );
}
