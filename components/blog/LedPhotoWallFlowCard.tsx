/**
 * Sơ đồ vận hành luồng chiếu ảnh khách mời lên màn hình LED sân khấu theo thời gian thực
 * trên hệ thống Inviwedd Pro (tối đa 300 ảnh album QR, bảo mật bằng khóa trình chiếu riêng).
 */
import * as React from "react";
import { CloudUpload, MonitorPlay, QrCode, ShieldCheck } from "lucide-react";

interface FlowStep {
  step: string;
  title: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FLOW_STEPS: readonly FlowStep[] = [
  {
    step: "Bước 01",
    title: "Khách quét mã QR đặt tại sảnh hoặc trên bàn tiệc",
    detail: "Không cần tải app hay đăng nhập phức tạp; trình duyệt mở thẳng cổng gửi ảnh cưới chung.",
    icon: QrCode,
  },
  {
    step: "Bước 02",
    title: "Tải ảnh vừa chụp kèm lời chúc từ điện thoại",
    detail: "Hỗ trợ lưu trữ tới 300 ảnh độ nét cao (gói Pro) để cô dâu chú rể xem lại trọn vẹn sau tiệc.",
    icon: CloudUpload,
  },
  {
    step: "Bước 03",
    title: "Kiểm duyệt tùy chọn bảo vệ hình ảnh sân khấu",
    detail: "Bật duyệt ảnh trước hoặc dùng liên kết màn hình LED có mã khóa bảo mật riêng.",
    icon: ShieldCheck,
  },
  {
    step: "Bước 04",
    title: "Phát slideshow tự động trên màn LED sảnh tiệc",
    detail: "Khoảnh khắc khách chụp cùng bạn bè hiện lên màn lớn tạo không khí kết nối trước giờ khai tiệc.",
    icon: MonitorPlay,
  },
];

export function LedPhotoWallFlowCard() {
  return (
    <figure
      aria-label="Luồng hoạt động tường ảnh LED tiệc cưới thời gian thực"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
            TƯƠNG TÁC MÀN HÌNH LED SẢNH TIỆC
          </span>
          <span className="mt-0.5 block font-display text-xl font-semibold text-text">
            Biến ảnh khách mời chụp thành slideshow chiếu ngay trên sân khấu
          </span>
        </div>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-text">
          Lưu tối đa 300 ảnh
        </span>
      </figcaption>

      <div className="grid gap-3.5 sm:grid-cols-2">
        {FLOW_STEPS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              className="rounded-xl border border-border bg-surface-alt/45 p-4"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-text">
                  {item.step}
                </span>
              </div>
              <h3 className="mt-2.5 font-display text-base font-semibold text-text">
                {item.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-text-muted">
                {item.detail}
              </p>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
