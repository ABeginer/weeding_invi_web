/**
 * Tổng hợp 5 ý tưởng khu vực check-in và đón khách tiệc cưới hiện đại thay thế sổ ký tên truyền thống,
 * phân loại theo trải nghiệm khách mời, mức chi phí và phù hợp không gian nhà hàng.
 */
import * as React from "react";
import { Camera, MessageSquareHeart, QrCode, Sparkles, Tv } from "lucide-react";

interface CheckinIdea {
  number: string;
  title: string;
  experience: string;
  setupTip: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CHECKIN_IDEAS: readonly CheckinIdea[] = [
  {
    number: "Ý tưởng 01",
    title: "Check-in bằng mã QR & thẻ tra cứu bàn tiệc trên điện thoại",
    experience:
      "Khách giơ điện thoại quét QR tại bàn đón khách để nhận ngay lời chào tên riêng, số bàn ngồi và khu vực sảnh mà không cần chen nhau dò danh sách giấy.",
    setupTip:
      "Đặt 2 bảng standee nhỏ ngay hai bên cửa sảnh cho khách quen dùng điện thoại và giữ 1 người hỗ trợ khách lớn tuổi.",
    icon: QrCode,
  },
  {
    number: "Ý tưởng 02",
    title: "Tường ảnh LED trình chiếu ảnh khách vừa chụp tại tiệc",
    experience:
      "Khách mời chụp ảnh cùng bạn bè tại sảnh, tải thẳng lên album cưới qua QR và thấy tấm hình xuất hiện trên màn hình LED chính trước giờ khai tiệc.",
    setupTip:
      "Bật chế độ duyệt ảnh nhanh trước khi đẩy lên sân khấu nếu muốn kiểm soát góc chụp và ánh sáng đẹp nhất.",
    icon: Tv,
  },
  {
    number: "Ý tưởng 03",
    title: "Gương nghệ thuật viết lời chúc & chụp ảnh phản chiếu",
    experience:
      "Khách vừa chỉnh trang phục trước khi vào sảnh vừa ký tên hoặc chụp ảnh check-in qua chiếc gương có in tên cô dâu chú rể và ngày cưới.",
    setupTip:
      "Đặt gương ở góc ánh sáng tự nhiên hoặc có đèn rọi ấm, tránh ngược sáng đối diện cửa kính lớn.",
    icon: Sparkles,
  },
  {
    number: "Ý tưởng 04",
    title: "Trạm chụp ảnh in lấy liền kẹp vào sổ lưu niệm",
    experience:
      "Khách chụp một tấm ảnh lấy liền, dán vào trang sổ và viết vài dòng lời chúc ngay bên cạnh thay vì chỉ ký tên khô khan.",
    setupTip:
      "Chuẩn bị sẵn bút nhũ mực nhanh khô, băng dính hai mặt và bố trí 1 bạn trẻ hướng dẫn thay giấy in ảnh.",
    icon: Camera,
  },
  {
    number: "Ý tưởng 05",
    title: "Hòm thư kỷ niệm & thẻ dự đoán dành cho cặp đôi",
    experience:
      "Mỗi bàn hoặc quầy đón khách có thẻ nhỏ để bạn bè viết lời khuyên hôn nhân hoặc dự đoán khoảnh khắc vui rồi bỏ vào hộp gỗ kỷ niệm.",
    setupTip:
      "Mở lại hộp thư vào dịp kỷ niệm 1 năm ngày cưới như một món quà tinh thần riêng tư của hai vợ chồng.",
    icon: MessageSquareHeart,
  },
];

export function ReceptionCheckinIdeasGrid() {
  return (
    <figure
      aria-label="5 ý tưởng khu vực check-in tiệc cưới hiện đại ít đụng hàng"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          5 Ý TƯỞNG KHU VỰC ĐÓN KHÁCH
        </span>
        <span className="font-display text-xl font-semibold text-text">
          Làm mới sảnh check-in đám cưới giúp khách mời thích thú chụp hình
        </span>
      </figcaption>

      <div className="space-y-3.5">
        {CHECKIN_IDEAS.map((idea) => {
          const Icon = idea.icon;
          return (
            <div
              key={idea.number}
              className="rounded-xl border border-border bg-surface-alt/45 p-4"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-semibold text-accent-text">
                  {idea.number}
                </span>
                <h3 className="font-display text-lg font-semibold text-text">
                  {idea.title}
                </h3>
              </div>

              <p className="mt-2.5 text-xs leading-relaxed text-text sm:text-sm">
                {idea.experience}
              </p>
              <p className="mt-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs leading-relaxed text-text-muted">
                <strong className="font-semibold text-accent-text">Mẹo triển khai:</strong>{" "}
                {idea.setupTip}
              </p>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
