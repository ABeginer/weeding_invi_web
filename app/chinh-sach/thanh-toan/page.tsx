import type { Metadata } from "next";
import { PolicyLayout } from "@/components/policy/PolicyLayout";
import { LEGAL_INFO } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "Chính sách thanh toán | Inviwedd",
  description:
    "Chính sách và hướng dẫn thanh toán dịch vụ thiệp cưới điện tử Inviwedd qua cổng VietQR payOS tự động ngay sau khi ghi nhận giao dịch thành công.",
};

export default function PaymentPolicyPage() {
  return (
    <PolicyLayout
      currentSlug="thanh-toan"
      title="Chính sách thanh toán"
      subtitle="Quy định chi tiết về phương thức thanh toán chuyển khoản VietQR tự động, thời gian kích hoạt gói dịch vụ và quy trình bảo vệ quyền lợi giao dịch của khách hàng."
    >
      <div className="space-y-6">
        <section>
          <h2 className="font-serif text-lg font-semibold text-[#1F1D1A]">
            I. Hình thức và Phương thức thanh toán
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#4A453E]">
            Để đảm bảo an toàn tuyệt đối và tốc độ kích hoạt nhanh chóng nhất cho
            khách hàng, <strong>Inviwedd</strong> áp dụng hình thức thanh toán
            trực tuyến thông qua:
          </p>
          <div className="mt-3 rounded-2xl border border-[#E8E2D9] bg-[#FAF8F5] p-4 text-xs sm:text-sm">
            <h3 className="font-semibold text-[#7A1C24]">
              Chuyển khoản Ngân hàng tự động qua mã VietQR (Napas 247)
            </h3>
            <p className="mt-1 text-[#4A453E]">
              Giao dịch được xử lý thông qua Cổng trung gian thanh toán{" "}
              <strong>payOS</strong> (nền tảng kết nối thanh toán ngân hàng tự
              động đã được cấp phép). Khi khách hàng chọn nâng cấp gói (Pro hoặc
              VIP), hệ thống sẽ tạo một mã VietQR động chứa chính xác số tiền và
              cú pháp đơn hàng duy nhất.
            </p>
            <p className="mt-2 text-[#4A453E]">
              Khách hàng chỉ cần mở bất kỳ ứng dụng ngân hàng di động (Mobile
              Banking) nào (như Vietcombank, Techcombank, MBBank, ACB, BIDV,
              v.v.) hoặc ví điện tử hỗ trợ VietQR để quét mã và xác nhận chuyển
              khoản.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold text-[#1F1D1A]">
            II. Nguyên tắc tính phí dịch vụ
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#4A453E]">
            <li>
              <strong>Thanh toán một lần duy nhất:</strong> Chi phí nâng cấp gói
              Pro (159.000đ – 199.000đ) hoặc VIP (399.000đ – 499.000đ) là phí trả
              trọn gói một lần cho toàn bộ thời hạn lưu trữ và sử dụng thiệp cưới
              (<strong>01 năm đối với gói Pro và 02 năm đối với gói VIP</strong>;
              gói Miễn phí lưu trữ 06 tháng).
            </li>
            <li>
              <strong>Không tự động gia hạn:</strong> Inviwedd cam kết{" "}
              <strong>không lưu trữ thông tin thẻ ngân hàng</strong> và tuyệt đối
              không có cơ chế tự động trừ tiền âm thầm của khách hàng.
            </li>
            <li>
              <strong>Không phát sinh phụ phí:</strong> Giá niêm yết trên bảng
              giá là chi phí cuối cùng mà khách hàng cần thanh toán để sở hữu đầy
              đủ các tính năng tương ứng của gói.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold text-[#1F1D1A]">
            III. Thời gian xác nhận &amp; Kích hoạt dịch vụ
          </h2>
          <div className="mt-3 rounded-xl border border-[#B89B72]/30 bg-[#FAF8F5] p-4 text-xs sm:text-sm">
            <p className="font-medium text-[#7A1C24]">
              ⚡ Kích hoạt tự động ngay sau khi hệ thống ghi nhận giao dịch thành công (thường trong vòng vài phút)
            </p>
            <p className="mt-1.5 text-[#4A453E]">
              Nhờ cơ chế Webhook kết nối thời gian thực giữa payOS và máy chủ
              Inviwedd, ngay sau khi hệ thống ghi nhận giao dịch chuyển khoản thành
              công từ ngân hàng, gói dịch vụ sẽ được kích hoạt tự động (thường trong
              vòng vài phút) mà không cần chụp biên lai hay liên hệ CSKH. Màn hình
              Dashboard thiệp cưới của bạn sẽ tự động chuyển sang trạng thái gói
              Pro hoặc VIP.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold text-[#1F1D1A]">
            IV. Quy trình xử lý sự cố &amp; Tra soát giao dịch
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#4A453E]">
            Trong một số trường hợp hãn hữu (như hệ thống ngân hàng khách hàng
            bảo trì đường truyền Napas ngoài giờ hoặc khách hàng tự gõ sai nội dung
            chuyển khoản khi không quét mã QR), nếu sau <strong>5 phút</strong>{" "}
            tài khoản ngân hàng của bạn đã bị trừ tiền mà hệ thống chưa tự động
            kích hoạt:
          </p>

          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[#4A453E]">
            <li>
              Bạn vui lòng chụp lại màn hình giao dịch chuyển khoản thành công từ
              app ngân hàng (rõ số tiền, thời gian và mã giao dịch).
            </li>
            <li>
              Liên hệ ngay với bộ phận Hỗ trợ khách hàng qua Hotline:{" "}
              <a
                href={LEGAL_INFO.hotlineHref}
                className="font-semibold text-[#7A1C24] underline"
              >
                {LEGAL_INFO.hotline}
              </a>{" "}
              hoặc gửi email về <code>{LEGAL_INFO.email}</code>.
            </li>
            <li>
              Đội ngũ kỹ thuật Inviwedd sẽ đối soát trực tiếp trên hệ thống ngân
              hàng và kích hoạt thủ công tài khoản cho bạn trong vòng{" "}
              <strong>15 – 30 phút</strong>.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold text-[#1F1D1A]">
            V. Bảo đảm an toàn thông tin thanh toán
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#4A453E]">
            Inviwedd không trực tiếp lưu trữ số tài khoản, mật khẩu hay mã OTP
            của khách hàng. Mọi giao dịch chuyển khoản đều diễn ra trong môi
            trường bảo mật được mã hóa SSL/TLS 256-bit của chính ngân hàng bạn
            đang sử dụng và cổng thanh toán payOS, đảm bảo tuân thủ tiêu chuẩn an
            toàn thông tin thanh toán theo quy định của Ngân hàng Nhà nước Việt
            Nam.
          </p>
        </section>
      </div>
    </PolicyLayout>
  );
}
