import * as React from "react";
import Link from "next/link";
import { ArrowRight, Calculator, Calendar, ClipboardList, MessageSquare, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToolId =
  | "wedding-calc"
  | "lunar-converter"
  | "zalo-invite"
  | "guest-list"
  | "wedding-checklist";

interface ToolItem {
  id: ToolId;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ALL_TOOLS: ToolItem[] = [
  {
    id: "wedding-calc",
    title: "Bảng tính đám cưới",
    description:
      "Ước tính tổng chi phí, số bàn cỗ kèm dự phòng và số lượt mừng hòa vốn theo giá thực tế.",
    href: "/cong-cu/bang-tinh-dam-cuoi",
    icon: Calculator,
  },
  {
    id: "lunar-converter",
    title: "Đổi âm dương lịch",
    description:
      "Đổi ngày dương sang âm lịch (1900–2100), tra cứu can chi năm, tháng, ngày cưới theo giờ VN.",
    href: "/cong-cu/doi-am-lich",
    icon: Calendar,
  },
  {
    id: "zalo-invite",
    title: "Tạo lời mời Zalo",
    description:
      "Soạn lời mời gửi Zalo/Messenger đúng chuẩn lễ nghi và xưng hô cho từng nhóm khách mời.",
    href: "/cong-cu/tao-loi-moi-zalo",
    icon: MessageSquare,
  },
  {
    id: "guest-list",
    title: "Lập danh sách khách mời",
    description:
      "Phân nhóm khách theo Lễ Vu Quy, Thành Hôn, Tiệc Cưới, chia bàn và xuất Excel hoặc dán 500 khách vào Inviwedd.",
    href: "/cong-cu/tao-danh-sach-khach-moi",
    icon: Users,
  },
  {
    id: "wedding-checklist",
    title: "Checklist chuẩn bị đám cưới",
    description:
      "Chia lộ trình 5 mốc thời gian theo ngày cưới thực tế, lưu tiến độ trình duyệt và xuất file Excel chuẩn tiếng Việt.",
    href: "/cong-cu/checklist-chuan-bi-dam-cuoi",
    icon: ClipboardList,
  },
];

interface CrossToolNavProps {
  currentTool: ToolId;
  className?: string;
}

export function CrossToolNav({ currentTool, className }: CrossToolNavProps) {
  const otherTools = ALL_TOOLS.filter((tool) => tool.id !== currentTool);

  return (
    <section
      aria-label="Công cụ cưới hữu ích khác"
      className={cn("mt-10 border-t border-[#E8E2D9] pt-8 print:hidden", className)}
    >
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#B89B72]">
          KHÁM PHÁ THÊM
        </p>
        <h2 className="font-serif text-2xl font-normal text-[#1F1D1A]">
          Công cụ cưới hữu ích khác
        </h2>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {otherTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.id}
              href={tool.href}
              className="group flex flex-col justify-between rounded-2xl border border-[#E8E2D9] bg-[#F4EFEA] p-5 transition-all duration-200 hover:border-[#7A1C24]/30 hover:bg-[#EFE9E2] hover:shadow-sm"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E8E2D9] bg-white text-[#7A1C24] transition-colors group-hover:border-[#7A1C24]/40">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-serif text-lg font-medium text-[#1F1D1A] group-hover:text-[#7A1C24] transition-colors">
                    {tool.title}
                  </h3>
                </div>
                <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-[#6B655E]">
                  {tool.description}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#7A1C24]">
                <span>Mở công cụ</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
