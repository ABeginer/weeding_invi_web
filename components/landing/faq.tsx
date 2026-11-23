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
      "Chuyển khoản ngân hàng, kích hoạt sau khi xác nhận thanh toán.",
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
      "Trước khi hết hạn lưu trữ (6 tháng / 1 năm / 2 năm), bạn có thể xuất toàn bộ danh sách khách mời ra file Excel và tải trọn bộ ảnh kỷ niệm về máy. Sau thời hạn, thiệp sẽ tạm ẩn và bạn có thể gia hạn bất cứ lúc nào nếu muốn giữ lâu hơn.",
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
      className="scroll-mt-14 border-b border-border bg-bg py-10 sm:py-12"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[12px] sm:text-[13px] font-semibold tracking-[0.12em] text-accent-text uppercase">
            HỎI ĐÁP PHỔ BIẾN
          </p>
          <h2 className="mt-1.5 font-display text-2xl font-semibold leading-[1.2] text-accent-text sm:text-3xl">
            Câu hỏi thường gặp
          </h2>
          <p className="mt-2 text-sm leading-[1.6] text-text-muted">
            Giải đáp nhanh những thắc mắc thường gặp khi bắt đầu tạo và gửi thiệp cưới online.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          {FAQ_ITEMS.map((item, index) => (
            <details
              key={item.question}
              open={index === 0}
              className="group overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-accent"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 text-left font-display text-base font-semibold text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring sm:p-5 sm:text-lg [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-accent-soft text-accent-text">
                    <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span>{item.question}</span>
                </span>
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-text-muted transition-transform duration-[var(--motion-fast)] ease-[var(--ease-out)] group-open:rotate-180 group-open:text-accent-text motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </summary>

              <div className="border-t border-border/60 px-4 pt-3 pb-4 sm:px-5 sm:pb-5">
                <p className="text-sm leading-[1.6] text-text-muted">
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
