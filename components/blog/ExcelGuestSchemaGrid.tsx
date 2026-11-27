/**
 * Bảng đặc tả 8 cột chuẩn của một file Excel danh sách khách mời đám cưới Việt Nam,
 * giúp đồng bộ giữa việc chia bàn từng buổi lễ và nhập dữ liệu lên thiệp online.
 */
import * as React from "react";
import { Columns3, FileSpreadsheet } from "lucide-react";

interface ExcelColumnSpec {
  colLetter: string;
  header: string;
  sample: string;
  purpose: string;
}

const EXCEL_COLUMNS: readonly ExcelColumnSpec[] = [
  {
    colLetter: "Cột A",
    header: "Tên hiển thị trên thiệp",
    sample: "Chú Tư Hùng / Anh Nguyễn Hoàng Minh",
    purpose: "Giữ đúng danh xưng đầy đủ để in phong bì hoặc hiển thị trực tiếp lên thiệp online.",
  },
  {
    colLetter: "Cột B",
    header: "Vai vế / Nhóm quan hệ",
    sample: "Họ hàng / Gia đình / Đồng nghiệp / Bạn thân",
    purpose: "Giúp hệ thống tự tách tiền tố mời (Trân trọng kính mời hay Thân mời) và lọc danh sách.",
  },
  {
    colLetter: "Cột C",
    header: "Bên mời (Hai họ)",
    sample: "Nhà trai / Nhà gái / Bạn chung",
    purpose: "Tránh trùng tên khi bố mẹ hai bên cùng lên danh sách và tách chi phí từng họ.",
  },
  {
    colLetter: "Cột D",
    header: "Buổi lễ tham dự",
    sample: "Vu Quy / Thành Hôn / Tiệc Cưới",
    purpose: "Xác định chính xác ai dự lễ gia tiên buổi sáng và ai chỉ tới sảnh tiệc nhà hàng.",
  },
  {
    colLetter: "Cột E",
    header: "Số người dự kiến",
    sample: "1 / 2 / 4",
    purpose: "Tính tổng đầu người thực tế theo công thức SUM thay vì đếm số dòng thiệp mời.",
  },
  {
    colLetter: "Cột F",
    header: "Số bàn dự kiến",
    sample: "Bàn 01 / Bàn 05",
    purpose: "Gom nhóm người quen, phòng ban hoặc họ hàng ngồi chung một mâm 10 người.",
  },
  {
    colLetter: "Cột G",
    header: "Trạng thái gửi & RSVP",
    sample: "Đã gửi / Đi 2 người / Chờ phản hồi",
    purpose: "Lọc nhanh nhóm chưa trả lời để nhắn nhắc nhẹ 5–7 ngày trước tiệc.",
  },
  {
    colLetter: "Cột H",
    header: "Chế độ ăn & Ghi chú",
    sample: "Ăn chay / Có ghế trẻ em / Đón xe",
    purpose: "Báo trước với bếp nhà hàng số suất chay và vị trí bàn gần sân khấu hoặc lối ra vào.",
  },
];

export function ExcelGuestSchemaGrid() {
  return (
    <figure
      aria-label="Cấu trúc 8 cột chuẩn của file Excel danh sách khách mời đám cưới"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
            CẤU TRÚC FILE EXCEL CHUẨN
          </span>
          <span className="mt-0.5 block font-display text-xl font-semibold text-text">
            8 cột dữ liệu cần thiết để quản lý gọn từ thiệp đến bàn tiệc
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-text">
          <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
          Mâm chuẩn 10 chỗ
        </span>
      </figcaption>

      <div className="grid gap-3 sm:grid-cols-2">
        {EXCEL_COLUMNS.map((col) => (
          <div
            key={col.colLetter}
            className="rounded-xl border border-border bg-surface-alt/45 p-3.5"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] font-semibold text-accent-text">
                <Columns3 className="h-3 w-3" aria-hidden="true" />
                {col.colLetter}
              </span>
              <h3 className="font-display text-base font-semibold text-text">
                {col.header}
              </h3>
            </div>
            <p className="mt-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-text">
              Ví dụ: {col.sample}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-text-muted">
              {col.purpose}
            </p>
          </div>
        ))}
      </div>
    </figure>
  );
}
