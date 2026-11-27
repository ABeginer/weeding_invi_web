/**
 * Trình bày 4 hình thức sổ ký tên đám cưới hiện đại phổ biến hiện nay
 * kèm ưu điểm trưng bày sau cưới và lưu ý triển khai tại sảnh tiệc.
 */
import * as React from "react";
import { BookOpen, Camera, Frame, MessageSquareHeart } from "lucide-react";

interface GuestbookFormat {
  id: string;
  title: string;
  keepValue: string;
  bottleNeckNote: string;
  bestFor: string;
  icon: React.ComponentType<{ className?: string }>;
}

const GUESTBOOK_FORMATS: readonly GuestbookFormat[] = [
  {
    id: "drop-box-frame",
    title: "Khung gỗ hoặc mica thả tim ký tên",
    keepValue: "Treo tường phòng khách làm vật trang trí sau ngày cưới",
    bottleNeckNote: "Cần đặt sẵn bút nhũ mảnh và khay đựng riêng để tránh rơi mảnh gỗ",
    bestFor: "Tiệc dưới 180 khách có phong cách mộc mạc hoặc tối giản",
    icon: Frame,
  },
  {
    id: "polaroid-board",
    title: "Bảng ảnh chụp lấy liền kèm thẻ viết lời chúc",
    keepValue: "Lưu lại cả gương mặt tươi cười của khách bên dưới nét chữ tay",
    bottleNeckNote: "Cần 1 phù dâu đứng hỗ trợ thay phim máy chụp để tránh ùn ứ",
    bestFor: "Nhóm bạn trẻ, đồng nghiệp thích chụp hình kỷ niệm tại bàn gallery",
    icon: Camera,
  },
  {
    id: "flatlay-photobook",
    title: "Sổ ảnh cưới chừa khoảng trắng ký tên",
    keepValue: "Xem chung luôn bộ ảnh pre-wedding, lật giở gọn như tạp chí",
    bottleNeckNote: "Mực bút dầu dễ lem nếu khách gấp trang quá sớm khi chưa khô",
    bestFor: "Gia đình muốn giữ một cuốn sách kỷ niệm đặt trên bàn trà",
    icon: BookOpen,
  },
  {
    id: "digital-wish-qr",
    title: "Tường lời chúc online kết nối mã QR trên bàn tiệc",
    keepValue: "Khách ở xa không tới được vẫn gửi lời chúc; tìm lại dễ bằng từ khóa",
    bottleNeckNote: "Không thay thế hoàn toàn thói quen viết tay của khách lớn tuổi nếu thiếu bảng hướng dẫn",
    bestFor: "Mọi quy mô đám cưới kết hợp khách trẻ và khách tỉnh xa",
    icon: MessageSquareHeart,
  },
];

export function GuestbookFormatsShowcase() {
  return (
    <figure
      aria-label="4 hình thức sổ ký tên đám cưới hiện đại dễ lưu giữ sau tiệc"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          LỰA CHỌN ĐỂ TRƯNG BÀY ĐƯỢC SAU TIỆC
        </span>
        <span className="font-display text-xl font-semibold text-text">
          4 kiểu sổ ký tên đám cưới không bị cất quên vào góc tủ
        </span>
      </figcaption>

      <div className="grid gap-3.5 sm:grid-cols-2">
        {GUESTBOOK_FORMATS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-xl border border-border bg-surface-alt/45 p-4"
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-base font-semibold text-text">
                    {item.title}
                  </h3>
                </div>
                <dl className="mt-3 space-y-1.5 text-xs">
                  <div>
                    <dt className="font-semibold text-text">Giá trị lưu giữ:</dt>
                    <dd className="text-text-muted">{item.keepValue}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-text">Lưu ý thực tế:</dt>
                    <dd className="text-text-muted">{item.bottleNeckNote}</dd>
                  </div>
                </dl>
              </div>
              <p className="mt-3 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-muted">
                <strong className="font-semibold text-accent-text">Hợp nhất với:</strong>{" "}
                {item.bestFor}
              </p>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
