import * as React from "react";
import Link from "next/link";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { SITE_LINKS } from "@/config/site";
import { ScrollReveal } from "./scroll-reveal";

interface StepItem {
  number: string;
  title: string;
  description: string;
}

const STEPS: StepItem[] = [
  {
    number: "01",
    title: "Chọn mẫu thiệp cưới",
    description:
      "Lựa chọn thiết kế yêu thích trong bộ sưu tập hoặc tự do tinh chỉnh bằng công cụ thiết kế chuyên nghiệp.",
  },
  {
    number: "02",
    title: "Nhập danh sách khách",
    description:
      "Tải danh sách khách mời qua Excel hoặc thêm nhanh từng người; hệ thống tự động gán đúng xưng hô lễ phép.",
  },
  {
    number: "03",
    title: "Gửi link riêng qua Zalo",
    description:
      "Sao chép lời mời đã soạn sẵn kèm link riêng cho từng khách và theo dõi phản hồi tham dự theo thời gian thực.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="cach-hoat-dong"
      className="scroll-mt-14 border-b border-[#E8E2D9] bg-[#FAF8F5] py-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8E2D9] bg-white/80 px-4 py-1.5 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-[#B89B72]" aria-hidden="true" />
            <span className="text-[12px] font-medium tracking-wide text-[#7A1C24] sm:text-[13px]">
              Quy trình đơn giản
            </span>
          </div>

          <h2 className="mt-4 font-serif text-3xl font-normal tracking-tight text-[#1F1D1A] sm:text-4xl lg:text-5xl">
            Chuẩn bị thiệp mời chỉ với <span className="italic text-[#7A1C24]">3 bước</span>
          </h2>

          <p className="mt-3 text-base leading-relaxed text-[#6B655E]">
            Không mất thời gian in ấn hay viết tay từng phong bì, mọi thứ sẵn sàng gửi đến tay khách chỉ sau 5 phút.
          </p>
        </ScrollReveal>

        {/* 3 Step Horizontal Columns */}
        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {STEPS.map((step) => (
            <ScrollReveal
              as="article"
              key={step.number}
              className="relative flex flex-col justify-between rounded-3xl border border-[#E8E2D9] bg-white p-7 shadow-2xs transition-all duration-300 hover:border-[#B89B72]/60 hover:shadow-sm"
            >
              <div>
                <span className="font-serif text-5xl font-light text-[#B89B72]/50 select-none">
                  {step.number}
                </span>

                <h3 className="mt-4 font-serif text-2xl font-normal text-[#1F1D1A]">
                  {step.title}
                </h3>

                <p className="mt-2.5 text-sm leading-relaxed text-[#6B655E]">
                  {step.description}
                </p>
              </div>

              <div className="mt-6 border-t border-[#E8E2D9]/60 pt-4 text-xs font-medium text-[#B89B72]">
                Bước {step.number} / 03
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Luxury Callout Banner */}
        <ScrollReveal className="mt-12 overflow-hidden rounded-3xl border border-[#1F1D1A] bg-[#1F1D1A] p-6 text-[#FAF8F5] shadow-md md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-[#B89B72]">
                <LayoutDashboard className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-serif text-2xl font-normal text-white">
                  Trải nghiệm miễn phí trọn bộ tính năng
                </h3>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-[#FAF8F5]/80">
                  Tạo thiệp thử, nhập danh sách khách và xem trước ngay trên điện thoại mà không cần thanh toán trước.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center md:shrink-0">
              <Link
                href={SITE_LINKS.createWedding}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#7A1C24] px-6 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#5E141B] sm:text-sm"
              >
                <span>Tạo thiệp ngay</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              <Link
                href="/#bang-gia"
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 bg-transparent px-5 text-xs font-medium text-white transition-colors hover:bg-white/10 sm:text-sm"
              >
                Xem bảng giá
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
