/**
 * Sơ đồ quy trình 3 chặng thu ảnh từ điện thoại khách qua mã QR bàn tiệc,
 * kiểm duyệt trước khi phát lên màn hình LED và chia sẻ lại Album chung.
 */
import * as React from "react";
import { MonitorPlay, QrCode, ShieldCheck } from "lucide-react";

interface ModerationStage {
  step: string;
  title: string;
  detail: string;
  safetyNote: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MODERATION_STAGES: readonly ModerationStage[] = [
  {
    step: "CHẶNG 01",
    title: "Khách quét QR trên bàn hoặc cuối thiệp",
    detail:
      "Mỗi bàn đặt một thẻ mica nhỏ có mã QR Album. Khách mở camera iPhone hoặc Zalo quét một chạm và tải trực tiếp ảnh vừa chụp.",
    safetyNote: "Hỗ trợ sẵn ảnh HEIC từ iPhone mà không đòi khách tự đổi đuôi file.",
    icon: QrCode,
  },
  {
    step: "CHẶNG 02",
    title: "Chủ nhà hoặc phù dâu duyệt ảnh theo ý muốn",
    detail:
      "Bật chế độ duyệt trước khi hiển thị để lọc nhanh các tấm bị rung nhòe, trùng lặp hoặc hình ảnh nhạy cảm trước khi lên sóng.",
    safetyNote: "Tránh hoàn toàn sự cố ảnh trêu đùa quá đà lọt lên sảnh cưới đông người lớn.",
    icon: ShieldCheck,
  },
  {
    step: "CHẶNG 03",
    title: "Chiếu realtime lên LED & chia sẻ lại sau tiệc",
    detail:
      "Ảnh được duyệt tự động luân chuyển trên màn hình LED sân khấu suốt giờ đón khách, đồng thời lưu thành Album kỷ niệm cho mọi người tải về.",
    safetyNote: "Không bị mất ảnh hay vỡ nét như khi gửi rải rác qua nhiều nhóm tin nhắn.",
    icon: MonitorPlay,
  },
];

export function QrPhotoModerationFlow() {
  return (
    <figure
      aria-label="Quy trình 3 chặng gom ảnh khách mời bằng mã QR và duyệt trước khi lên màn hình LED"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          VẬN HÀNH AN TOÀN TẠI SẢNH TIỆC
        </span>
        <span className="font-display text-xl font-semibold text-text">
          Từ điện thoại khách lên màn hình LED qua 3 chặng kiểm soát gọn nhẹ
        </span>
      </figcaption>

      <div className="grid gap-3.5 md:grid-cols-3">
        {MODERATION_STAGES.map((stage) => {
          const Icon = stage.icon;
          return (
            <div
              key={stage.step}
              className="flex flex-col justify-between rounded-xl border border-border bg-surface-alt/40 p-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold tracking-[0.14em] text-accent-text uppercase">
                    {stage.step}
                  </span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
                <h3 className="mt-2 font-display text-base font-semibold leading-snug text-text">
                  {stage.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-text-muted">
                  {stage.detail}
                </p>
              </div>
              <p className="mt-3 rounded-lg border border-border bg-surface px-3 py-2 text-[11px] leading-relaxed text-text">
                {stage.safetyNote}
              </p>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
