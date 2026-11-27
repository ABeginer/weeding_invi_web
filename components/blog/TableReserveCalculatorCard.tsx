/**
 * Bảng tính mẫu 4 bước quy đổi từ 250 thiệp mời phát ra thành 24 bàn chính thức + 2 bàn dự phòng,
 * áp dụng đúng công thức của công cụ Bảng tính chi phí đám cưới trên Inviwedd.
 */
import * as React from "react";
import { Calculator, Layers, ShieldPlus, UsersRound } from "lucide-react";

interface FormulaStep {
  step: string;
  label: string;
  formulaText: string;
  workedResult: string;
  note: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FORMULA_STEPS: readonly FormulaStep[] = [
  {
    step: "Bước 01",
    label: "Ước tính số đầu thiệp thực sự đi tiệc",
    formulaText: "Khách dự kiến = Làm tròn lên(Số thiệp mời × Tỷ lệ tham dự)",
    workedResult: "250 thiệp × 82% = 205 khách chính",
    note: "Không lấy 100% số thiệp vì luôn có khoảng 12%–25% khách bận công tác hoặc ở tỉnh xa.",
    icon: UsersRound,
  },
  {
    step: "Bước 02",
    label: "Cộng hệ số người đi kèm (+1, vợ/chồng, con nhỏ)",
    formulaText: "Tổng người ăn = Khách chính × (1 + Hệ số đi kèm)",
    workedResult: "205 × (1 + 0,15) = 236 chỗ ngồi",
    note: "Mỗi gia đình họ hàng hoặc bạn bè dắt theo bạn đời đều chiếm 1 ghế tính suất trên bàn.",
    icon: Layers,
  },
  {
    step: "Bước 03",
    label: "Chia số chỗ mỗi bàn (mâm chuẩn 10 người)",
    formulaText: "Bàn chính thức = Làm tròn lên(Tổng người ăn ÷ 10)",
    workedResult: "236 ÷ 10 = 24 bàn chính thức",
    note: "Nếu một nhóm phòng ban có 11 người, tách 1 người sang bàn dự bị hoặc ghép thêm mâm lẻ hợp lý.",
    icon: Calculator,
  },
  {
    step: "Bước 04",
    label: "Cộng 5%–10% bàn dự phòng chống thiếu ghế",
    formulaText: "Tổng bàn đặt = Làm tròn lên(Bàn chính × (1 + 8%))",
    workedResult: "24 bàn chính + 2 bàn dự phòng = 26 bàn",
    note: "Chỉ trả tiền 24 bàn trước và ký điều khoản 2 bàn dự phòng không bóc màng bọc sẽ không tính phí.",
    icon: ShieldPlus,
  },
];

export function TableReserveCalculatorCard() {
  return (
    <figure
      aria-label="Ví dụ 4 bước tính số lượng khách mời và bàn dự phòng cho quy mô 250 thiệp"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
            VÍ DỤ TÍNH TOÁN THỰC TẾ (250 THIỆP)
          </span>
          <span className="mt-0.5 block font-display text-xl font-semibold text-text">
            4 bước quy đổi từ danh sách thiệp thành số bàn ký nhà hàng
          </span>
        </div>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-text">
          24 bàn chính · 2 bàn chờ
        </span>
      </figcaption>

      <div className="grid gap-3.5 sm:grid-cols-2">
        {FORMULA_STEPS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              className="flex flex-col justify-between rounded-xl border border-border bg-surface-alt/45 p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-text">
                    {item.step}
                  </span>
                </div>
                <h3 className="mt-2.5 font-display text-base font-semibold text-text">
                  {item.label}
                </h3>
                <p className="mt-1.5 text-xs font-medium text-text-muted">
                  {item.formulaText}
                </p>
                <p className="mt-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-accent-text">
                  {item.workedResult}
                </p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-text-muted">
                {item.note}
              </p>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
