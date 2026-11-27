/**
 * Bảng đối chiếu thiệp cưới giấy truyền thống và thiệp cưới online trên 6 tiêu chí thực tế
 * (chi phí, thời gian xử lý, khả năng sửa lỗi, RSVP, chỉ đường và lễ nghi gia đình).
 */
import * as React from "react";
import { FileText, Smartphone } from "lucide-react";

interface CriterionComparison {
  criterion: string;
  paperCard: string;
  onlineCard: string;
}

const CRITERIA: readonly CriterionComparison[] = [
  {
    criterion: "Chi phí với quy mô 250 khách",
    paperCard: "Khoảng 1,25 – 3 triệu đồng (tùy giấy mỹ thuật, ép kim và phí gửi bưu điện đi tỉnh).",
    onlineCard: "0đ dùng thử 20 khách đầu; gói Standard 159.000đ không giới hạn số khách.",
  },
  {
    criterion: "Thời gian thiết kế & giao thiệp",
    paperCard: "Mất 7–14 ngày in ấn, cộng thêm 1–2 tuần viết tay phong bì và gửi tận tay.",
    onlineCard: "Khởi tạo trong 15 phút, xuất ngay link riêng cho từng vị khách để gửi qua Zalo.",
  },
  {
    criterion: "Khi cần đổi giờ lễ hoặc đổi sảnh tiệc",
    paperCard: "Không thể sửa trên bản đã in; phải in đè phiếu chỉnh sửa hoặc gọi đính chính từng người.",
    onlineCard: "Cập nhật một lần trên trình quản lý, toàn bộ link khách đang giữ tự đồng bộ tức thì.",
  },
  {
    criterion: "Theo dõi số khách đi tiệc & +1",
    paperCard: "Phải gọi điện hoặc nhắn hỏi từng người rồi ghi chép rời rạc vào sổ tay.",
    onlineCard: "Khách tự bấm Xác nhận tham dự và chọn số người đi cùng ngay trên thiệp.",
  },
  {
    criterion: "Hỗ trợ chỉ đường tới nhà hàng",
    paperCard: "Chỉ có dòng địa chỉ chữ; khách ở xa phải tự gõ tìm lại trên ứng dụng bản đồ.",
    onlineCard: "Tích hợp sẵn nút mở Google Maps một chạm đúng tọa độ sảnh tiệc.",
  },
  {
    criterion: "Giá trị lễ nghi với người lớn tuổi",
    paperCard: "Rất cao; ông bà, họ hàng và gia đình thông gia luôn trân trọng tấm thiệp cầm tay.",
    onlineCard: "Phù hợp hơn với thế hệ trẻ, đồng nghiệp và bạn bè thường xuyên dùng điện thoại.",
  },
];

export function PaperVsOnlineScorecard() {
  return (
    <figure
      aria-label="Bảng đối chiếu thiệp cưới giấy và thiệp cưới online qua 6 tiêu chí thực tế"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          SO SÁNH TRỰC DIỆN 6 TIÊU CHÍ
        </span>
        <span className="font-display text-xl font-semibold text-text">
          Điểm mạnh và giới hạn thật của thiệp giấy so với thiệp online
        </span>
      </figcaption>

      <div className="space-y-3">
        {CRITERIA.map((row) => (
          <div
            key={row.criterion}
            className="rounded-xl border border-border bg-surface-alt/40 p-3.5"
          >
            <h3 className="font-display text-base font-semibold text-text">
              {row.criterion}
            </h3>

            <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-surface p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted uppercase">
                  <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Thiệp cưới giấy</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-text sm:text-sm">
                  {row.paperCard}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-surface p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-accent-text uppercase">
                  <Smartphone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Thiệp cưới online</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-text sm:text-sm">
                  {row.onlineCard}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </figure>
  );
}
