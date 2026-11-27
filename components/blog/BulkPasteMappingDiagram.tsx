/**
 * Minh họa định dạng 3 cột phân tách bằng Tab khi sao chép từ Excel/Google Sheets
 * để dán trực tiếp tối đa 500 khách vào trình nhập nhanh của Inviwedd.
 */
import * as React from "react";
import { ArrowRight, CheckCheck, ClipboardPaste } from "lucide-react";

interface MappingSampleRow {
  col1Name: string;
  col2Role: string;
  col3Table: string;
  parsedOutput: string;
}

const SAMPLE_ROWS: readonly MappingSampleRow[] = [
  {
    col1Name: "Chú Bảy",
    col2Role: "Họ hàng",
    col3Table: "Bàn 1",
    parsedOutput: "Tiền tố: Trân trọng kính mời · Chú Bảy cùng Gia đình · Bàn 1",
  },
  {
    col1Name: "Anh Hoàng Minh",
    col2Role: "Đồng nghiệp",
    col3Table: "Bàn 5",
    parsedOutput: "Tiền tố: Trân trọng mời · Anh Hoàng Minh · Bàn 5",
  },
  {
    col1Name: "Thanh Thảo",
    col2Role: "Bạn thân",
    col3Table: "Bàn 8",
    parsedOutput: "Tiền tố: Thân mời · Thanh Thảo · Bàn 8",
  },
];

export function BulkPasteMappingDiagram() {
  return (
    <figure
      aria-label="Sơ đồ ánh xạ 3 cột từ Excel sang trình nhập hàng loạt 500 khách của Inviwedd"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
            NHẬP NHANH TỪ EXCEL / GOOGLE SHEETS
          </span>
          <span className="mt-0.5 block font-display text-xl font-semibold text-text">
            Cấu trúc 3 cột để dán tối đa 500 khách một lần trên Inviwedd
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-text">
          <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
          Tối đa 500 dòng / lượt
        </span>
      </figcaption>

      <div className="space-y-3">
        {SAMPLE_ROWS.map((row) => (
          <div
            key={row.col1Name}
            className="flex flex-col gap-2.5 rounded-xl border border-border bg-surface-alt/45 p-3.5 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-text">
              <span className="rounded-md border border-border bg-surface px-2.5 py-1">
                Cột 1: {row.col1Name}
              </span>
              <span className="rounded-md border border-border bg-surface px-2.5 py-1 text-text-muted">
                Cột 2: {row.col2Role}
              </span>
              <span className="rounded-md border border-border bg-surface px-2.5 py-1 text-text-muted">
                Cột 3: {row.col3Table}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-accent-text">
              <ArrowRight className="hidden h-4 w-4 shrink-0 lg:block" aria-hidden="true" />
              <CheckCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="font-medium text-text">{row.parsedOutput}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3.5 text-xs leading-relaxed text-text-muted">
        Khi sao chép vùng 3 cột từ Excel hoặc Google Sheets (phân tách bằng phím Tab hoặc dấu phẩy),
        bộ đọc tự động nhận diện vai vế, gán số bàn, bỏ qua dòng trống và lọc trùng tên so với danh sách đã có.
      </p>
    </figure>
  );
}
