/**
 * Trình tự thời gian chuẩn bị và trao thiệp mời cưới cho sếp từ lúc viết tên
 * đến ngày đón tiếp tại bàn khách quý để giữ sự chu đáo tại công sở.
 */
import * as React from "react";
import { CalendarClock, Handshake, MailCheck, MapPin } from "lucide-react";

interface EtiquetteStage {
  step: string;
  timing: string;
  title: string;
  detail: string;
  ruleToAvoid: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STAGES: readonly EtiquetteStage[] = [
  {
    step: "01",
    timing: "Trước tiệc 14 ngày",
    title: "Kiểm tra họ tên đầy đủ và tình trạng gia đình",
    detail: "Xác nhận lại cách viết đúng dấu tên sếp và hỏi khéo đồng nghiệp thân nếu chưa rõ sếp đã lập gia đình hay chưa.",
    ruleToAvoid: "Không ghi tắt chữ đệm hoặc viết biệt danh văn phòng lên thiệp chính thức.",
    icon: CalendarClock,
  },
  {
    step: "02",
    timing: "Trước tiệc 10–12 ngày",
    title: "Trao thiệp giấy tận tay lúc sếp rảnh",
    detail: "Chọn cuối buổi làm việc hoặc sau cuộc họp ngắn, dùng hai tay đưa thiệp tại phòng riêng hoặc bàn làm việc.",
    ruleToAvoid: "Không gửi nhờ đồng nghiệp chuyển hộ khi cùng văn phòng, trừ trường hợp sếp đi công tác dài ngày.",
    icon: Handshake,
  },
  {
    step: "03",
    timing: "Cùng ngày / Trước tiệc 7 ngày",
    title: "Nhắn Zalo riêng kèm link thiệp bản đồ",
    detail: "Nếu sếp làm chi nhánh khác hoặc vừa trao thiệp tay xong, gửi tin nhắn riêng kèm link có bản đồ Google Maps và nút xác nhận.",
    ruleToAvoid: "Tuyệt đối không gửi link thiệp cưới vào nhóm chat công ty chung để mời sếp ké cùng nhân viên.",
    icon: MailCheck,
  },
  {
    step: "04",
    timing: "Trước tiệc 3 ngày",
    title: "Sắp bàn khách quý & xác nhận vị trí đón tiếp",
    detail: "Xếp sếp ngồi cùng trưởng bộ phận, anh chị quản lý hoặc nhóm phòng ban thân quen tại khu vực gần sân khấu, lối đi thoáng.",
    ruleToAvoid: "Không xếp sếp ngồi chung bàn quá ồn cạnh nhóm bạn nhậu hoặc bàn sát loa phát nhạc.",
    icon: MapPin,
  },
];

export function BossInvitationEtiquetteTimeline() {
  return (
    <figure
      aria-label="Lộ trình 4 bước mời cưới sếp lịch sự trước ngày tổ chức"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          LỘ TRÌNH THỰC HIỆN CHUẨN MỰC
        </span>
        <span className="font-display text-xl font-semibold text-text">
          4 mốc thời gian mời sếp dự tiệc cưới ít áp lực nhất
        </span>
      </figcaption>

      <ol className="space-y-3">
        {STAGES.map((stage) => {
          const Icon = stage.icon;
          return (
            <li
              key={stage.step}
              className="grid gap-3 rounded-xl border border-border bg-surface-alt/40 p-4 sm:grid-cols-[155px_minmax(0,1fr)]"
            >
              <div className="flex items-center gap-2.5 sm:flex-col sm:items-start sm:gap-1.5">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <span className="block text-[11px] font-semibold tracking-wider text-accent-text uppercase">
                    Mốc {stage.step}
                  </span>
                  <span className="text-xs font-medium text-text">{stage.timing}</span>
                </div>
              </div>

              <div>
                <h3 className="font-display text-lg font-semibold text-text">
                  {stage.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-text-muted sm:text-sm">
                  {stage.detail}
                </p>
                <p className="mt-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-muted">
                  <strong className="font-semibold text-text">Tránh:</strong> {stage.ruleToAvoid}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
