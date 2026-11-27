/**
 * Mô hình kết hợp bàn đón khách truyền thống và tường lời chúc online
 * giúp giảm ùn tắc đầu giờ nhưng vẫn thu đủ lời chúc từ mọi nhóm khách.
 */
import * as React from "react";
import { Globe, PenLine } from "lucide-react";

export function GuestbookHybridSetupCard() {
  return (
    <figure
      aria-label="Mô hình sổ ký tên kép: góc ký tay gọn nhẹ kết hợp tường lời chúc QR"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          GIẢI PHÁP KÉP KHÔNG BỎ SÓT AI
        </span>
        <span className="font-display text-xl font-semibold text-text">
          Chia hai luồng lời chúc để sảnh đón khách luôn thông thoáng
        </span>
      </figcaption>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface-alt/50 p-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
              <PenLine className="h-4 w-4" aria-hidden="true" />
            </span>
            <h3 className="font-display text-base font-semibold text-text">
              Luồng tại sảnh (Khách lớn tuổi & họ hàng)
            </h3>
          </div>
          <ul className="mt-3 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-text-muted">
            <li>Đặt 1 khung ký tên hoặc sổ mỏng kèm sẵn 3–4 cây bút cùng loại.</li>
            <li>Tách bàn ký tên lệch sang một bên, cách thùng mừng 1 bước chân.</li>
            <li>Phù dâu chủ động gợi ý người lớn ký nhanh trong lúc chờ chụp hình.</li>
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-accent-soft/45 p-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
              <Globe className="h-4 w-4" aria-hidden="true" />
            </span>
            <h3 className="font-display text-base font-semibold text-text">
              Luồng trực tuyến (Bạn trẻ & khách ở xa)
            </h3>
          </div>
          <ul className="mt-3 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-text-muted">
            <li>Khách gửi lời chúc ngay trên link thiệp mời trước ngày cưới hoặc tại bàn ăn.</li>
            <li>Bạn bè ở xa không sắp xếp về dự vẫn góp mặt trên tường kỷ niệm.</li>
            <li>Lời chúc dài, có thể đọc lại rõ ràng và chọn lời chúc hay chiếu trên sân khấu.</li>
          </ul>
        </div>
      </div>
    </figure>
  );
}
