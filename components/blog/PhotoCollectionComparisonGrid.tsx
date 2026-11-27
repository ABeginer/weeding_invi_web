/**
 * Bảng đối chiếu trực quan 4 phương án thu gom và chia sẻ ảnh cưới từ điện thoại khách mời
 * dựa trên chất lượng ảnh, yêu cầu tài khoản và khả năng chiếu trực tiếp lên màn hình LED.
 */
import * as React from "react";
import { Cloud, FolderDown, QrCode, Smartphone } from "lucide-react";

interface PhotoMethodCard {
  id: string;
  title: string;
  sharpness: string;
  guestFriction: string;
  ledSupport: string;
  verdict: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PHOTO_METHODS: readonly PhotoMethodCard[] = [
  {
    id: "zalo-group",
    title: "Nhóm chat Zalo / Messenger",
    sharpness: "Dễ bị nén nếu khách quên chọn HD",
    guestFriction: "Phải thêm từng người vào nhóm đông, hay bị trôi tin",
    ledSupport: "Không tự cập nhật lên màn hình sân khấu",
    verdict: "Chỉ tiện cho nhóm 5–10 bạn rất thân",
    icon: Smartphone,
  },
  {
    id: "google-drive",
    title: "Link Google Drive mở quyền sửa",
    sharpness: "Giữ tốt độ nét gốc khi tải lên",
    guestFriction: "Khách lớn tuổi ngại đăng nhập Gmail trên điện thoại",
    ledSupport: "Phải tải thủ công xuống máy kỹ thuật viên mới chiếu được",
    verdict: "Hợp chia sẻ lại ảnh thợ chụp sau tiệc",
    icon: Cloud,
  },
  {
    id: "airdrop",
    title: "AirDrop trực tiếp tại bàn",
    sharpness: "Nguyên gốc 100%",
    guestFriction: "Chỉ dùng giữa máy iPhone gần nhau, khách Android đứng ngoài",
    ledSupport: "Không gom về một kho chung của cô dâu chú rể",
    verdict: "Dùng bổ sung khi tụ tập chụp chung sau lễ",
    icon: FolderDown,
  },
  {
    id: "album-qr",
    title: "Mã QR Album chung đặt tại bàn tiệc",
    sharpness: "Ảnh nén tối ưu giữ chi tiết rõ ràng, gom chung 1 nơi",
    guestFriction: "Quét camera và chọn ảnh từ thư viện, không cần cài app",
    ledSupport: "Chiếu trực tiếp ảnh mới gửi lên màn hình LED sảnh tiệc",
    verdict: "Tối ưu cho cả thu ảnh khách lẫn khuấy động tiệc",
    icon: QrCode,
  },
];

export function PhotoCollectionComparisonGrid() {
  return (
    <figure
      aria-label="So sánh 4 phương án thu gom và chia sẻ ảnh đám cưới với khách mời"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          SO SÁNH TRẢI NGHIỆM KHÁCH MỜI
        </span>
        <span className="font-display text-xl font-semibold text-text">
          Bốn cách gom ảnh cưới từ điện thoại khách: cái nào giữ nét và dễ dùng nhất?
        </span>
      </figcaption>

      <div className="grid gap-3.5 sm:grid-cols-2">
        {PHOTO_METHODS.map((method) => {
          const Icon = method.icon;
          return (
            <div
              key={method.id}
              className="flex flex-col justify-between rounded-xl border border-border bg-surface-alt/45 p-4"
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-base font-semibold text-text">
                    {method.title}
                  </h3>
                </div>
                <dl className="mt-3 space-y-1.5 text-xs">
                  <div>
                    <dt className="font-semibold text-text">Chất lượng ảnh:</dt>
                    <dd className="text-text-muted">{method.sharpness}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-text">Thao tác phía khách:</dt>
                    <dd className="text-text-muted">{method.guestFriction}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-text">Chiếu màn hình LED:</dt>
                    <dd className="text-text-muted">{method.ledSupport}</dd>
                  </div>
                </dl>
              </div>
              <p className="mt-3 rounded-lg bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent-text">
                {method.verdict}
              </p>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
