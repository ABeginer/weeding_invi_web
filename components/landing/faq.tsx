import * as React from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Dữ liệu được lưu bao lâu?",
    answer:
      "Gói Miễn phí lưu 6 tháng, gói Standard lưu 1 năm và gói Pro lưu 2 năm. Bạn có thể nâng cấp bất cứ lúc nào để giữ thiệp lâu hơn.",
  },
  {
    question: "Thiệp có giới hạn lượt xem không?",
    answer:
      "Không. Tất cả các gói (Miễn phí, Standard và Pro) đều cho khách mở thiệp không giới hạn lượt xem, không tính phí theo lượt.",
  },
  {
    question: "Thanh toán như thế nào?",
    answer:
      "Chuyển khoản ngân hàng qua mã VietQR (PayOS), hệ thống tự động kích hoạt ngay sau 1–3 giây khi nhận được giao dịch.",
  },
  {
    question: "Khách có cần tài khoản để xem thiệp không?",
    answer:
      "Không. Khách mở bằng link riêng.",
  },
  {
    question: "Tôi có thể nhập danh sách khách hàng loạt không?",
    answer:
      "Có, dán từ Excel hoặc Google Sheets, tối đa 500 khách mỗi lần nhập.",
  },
  {
    question: "Có xuất được danh sách khách ra Excel không?",
    answer:
      "Có. Gói Standard và Pro hỗ trợ xuất danh sách khách ra file mở trực tiếp bằng Excel trên máy tính, hiển thị chuẩn tiếng Việt không lỗi font.",
  },
  {
    question: "Có sửa được thiệp hoặc đổi ngày cưới sau khi đã gửi link không?",
    answer:
      "Có. Bạn có thể chỉnh sửa thông tin, đổi ngày giờ, địa điểm hoặc đổi mẫu thiệp không giới hạn; toàn bộ đường link đã gửi cho khách qua Zalo sẽ tự động cập nhật ngay lập tức mà không cần gửi lại.",
  },
  {
    question: "Hết thời hạn lưu trữ thì thiệp và dữ liệu có bị mất không?",
    answer:
      "Trước khi hết hạn lưu trữ (6 tháng với gói Miễn phí, 1 năm với gói Standard và 2 năm với gói Pro), bạn có thể xuất toàn bộ danh sách khách mời ra file Excel, tải trọn bộ ảnh kỷ niệm về máy hoặc nâng cấp/gia hạn để tiếp tục lưu giữ thiệp lâu dài.",
  },
  {
    question: "Dùng thử gói Miễn phí (20 khách) rồi nâng cấp có phải tạo lại thiệp không?",
    answer:
      "Không. Toàn bộ nội dung thiệp, danh sách khách đã nhập, phản hồi RSVP và các đường link đã gửi đều được giữ nguyên 100% khi bạn nâng cấp lên Standard hoặc Pro.",
  },
];

export function LandingFaq() {
  return (
    <section
      id="faq"
      className="scroll-mt-14 border-b border-[#E8E2D9] bg-[#FAF8F5] py-20 lg:py-28"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8E2D9] bg-white/80 px-4 py-1.5 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-[#B89B72]" aria-hidden="true" />
            <span className="text-[12px] font-medium tracking-wide text-[#7A1C24] sm:text-[13px]">
              Hỏi đáp phổ biến
            </span>
          </div>

          <h2 className="mt-4 font-serif text-3xl font-normal tracking-tight text-[#1F1D1A] sm:text-4xl lg:text-5xl">
            Câu hỏi <span className="italic text-[#7A1C24]">thường gặp</span>
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#6B655E]">
            Giải đáp nhanh những thắc mắc thường gặp khi bắt đầu tạo và gửi thiệp cưới online.
          </p>
        </div>

        <div className="mt-12 space-y-3">
          {FAQ_ITEMS.map((item, index) => (
            <details
              key={item.question}
              open={index === 0}
              className="group overflow-hidden rounded-2xl border border-[#E8E2D9] bg-white shadow-2xs transition-colors hover:border-[#B89B72]/70"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 text-left font-serif text-base font-medium text-[#1F1D1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24] sm:p-5 sm:text-lg [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#E8E2D9] bg-[#FAF8F5] text-[#7A1C24]">
                    <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span>{item.question}</span>
                </span>
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-[#6B655E] transition-transform duration-200 group-open:rotate-180 group-open:text-[#7A1C24] motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </summary>

              <div className="border-t border-[#E8E2D9]/70 px-4 pt-3.5 pb-4 sm:px-5 sm:pb-5">
                <p className="text-sm leading-relaxed text-[#6B655E]">
                  {item.answer}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
