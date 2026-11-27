/**
 * Bảng danh mục 5 trò chơi tiệc cưới thực tế kèm thời lượng, cách chơi tại bàn
 * và mức độ chuẩn bị đạo cụ để cô dâu chú rể chọn theo quy mô sảnh tiệc.
 */
import * as React from "react";
import { Armchair, Camera, Hash, HelpCircle, Sparkles } from "lucide-react";

interface ReceptionGameItem {
  id: string;
  name: string;
  duration: string;
  prepLevel: string;
  howItWorks: string;
  highlight: string;
  icon: React.ComponentType<{ className?: string }>;
}

const RECEPTION_GAMES: readonly ReceptionGameItem[] = [
  {
    id: "chair-ribbon",
    name: "Chiếc nơ may mắn dưới ghế",
    duration: "5 phút",
    prepLevel: "Chuẩn bị trước giờ đón khách",
    howItWorks:
      "Ban tổ chức dán ngầm 3–5 phong bao nhỏ hoặc ruy băng khác màu dưới đáy ghế ngẫu nhiên ở các khu bàn khác nhau.",
    highlight: "Ai cũng tham gia ngay tại chỗ, hợp cả họ hàng lớn tuổi.",
    icon: Armchair,
  },
  {
    id: "couple-quiz",
    name: "Đố vui \"Hiểu Cô dâu Chú rể bao nhiêu %?\"",
    duration: "8–10 phút",
    prepLevel: "Soạn sẵn 6–8 câu hỏi ngắn",
    howItWorks:
      "MC đọc câu hỏi vui về lần đầu gặp gỡ hoặc thói quen đời thường; khách giơ tay hoặc quét mã QR chọn đáp án nhanh.",
    highlight: "Khách ở mọi bàn đều bật cười khi nghe các câu chuyện hậu trường.",
    icon: HelpCircle,
  },
  {
    id: "led-photo-hunt",
    name: "Thử thách khoảnh khắc lên màn hình LED",
    duration: "Chạy xuyên suốt lúc ăn tiệc",
    prepLevel: "Đặt bảng QR Album tại từng bàn",
    howItWorks:
      "Khách quét mã QR tải ảnh tự sướng cùng bàn lên Album cưới; MC chọn 3 tấm sáng tạo hoặc hài hước nhất ngay trên màn hình LED.",
    highlight: "Vừa có game, vừa gom được hàng trăm ảnh nét sau tiệc.",
    icon: Camera,
  },
  {
    id: "table-number-draw",
    name: "Bốc thăm theo số bàn hoặc mã check-in",
    duration: "5–7 phút",
    prepLevel: "Đồng bộ danh sách số bàn trên thiệp",
    howItWorks:
      "Cô dâu chú rể bốc số bàn hoặc đọc 3 số cuối mã khách mời vừa check-in đầu giờ để trao quà cảm ơn.",
    highlight: "Khuyến khích khách đến đúng giờ và ghé quét mã đầu sảnh.",
    icon: Hash,
  },
  {
    id: "wish-wall-pick",
    name: "Chọn lời chúc tâm đắc nhất trên tường kỷ niệm",
    duration: "5 phút",
    prepLevel: "Bật tường lời chúc trên thiệp online",
    howItWorks:
      "Cuối phần giao lưu, cặp đôi chọn 2 lời chúc dí dỏm hoặc cảm động nhất khách gửi qua thiệp để mời lên nhận quà.",
    highlight: "Kích thích cả khách ở xa không tới dự vẫn gửi lời chúc.",
    icon: Sparkles,
  },
];

export function ReceptionGameRosterCard() {
  return (
    <figure
      aria-label="5 trò chơi tiệc cưới dễ triển khai giúp khách mời tương tác vui vẻ"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          DANH MỤC GỢI Ý THEO THỜI LƯỢNG
        </span>
        <span className="font-display text-xl font-semibold text-text">
          5 trò chơi tiệc cưới ít rườm rà, dễ hòa nhập mọi độ tuổi
        </span>
      </figcaption>

      <div className="space-y-3">
        {RECEPTION_GAMES.map((game, index) => {
          const Icon = game.icon;
          return (
            <div
              key={game.id}
              className="rounded-xl border border-border bg-surface-alt/45 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-base font-semibold text-text">
                    {index + 1}. {game.name}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <span className="rounded-full bg-accent-soft px-2.5 py-0.5 font-semibold text-accent-text">
                    {game.duration}
                  </span>
                  <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-text-muted">
                    {game.prepLevel}
                  </span>
                </div>
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-text-muted sm:text-sm">
                {game.howItWorks}
              </p>
              <p className="mt-1.5 text-xs font-medium text-text">
                Điểm cộng: <span className="font-normal text-text-muted">{game.highlight}</span>
              </p>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
