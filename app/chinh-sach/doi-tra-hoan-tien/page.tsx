import type { Metadata } from "next";
import { PolicyLayout } from "@/components/policy/PolicyLayout";
import { LEGAL_INFO } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "Chính sách đổi trả & Hoàn tiền | Inviwedd",
  description:
    "Quy định về điều kiện, trường hợp hoàn tiền 100% và quy trình xử lý hoàn trả tiền dịch vụ thiệp cưới điện tử Inviwedd trong vòng 3-5 ngày làm việc.",
};

export default function RefundPolicyPage() {
  return (
    <PolicyLayout
      currentSlug="doi-tra-hoan-tien"
      title="Chính sách đổi trả &amp; Hoàn tiền"
      subtitle="Chính sách minh bạch về quyền lợi hoàn tiền và cơ chế hỗ trợ khách hàng khi phát sinh sự cố kỹ thuật đối với các gói dịch vụ số trả phí trên Inviwedd."
    >
      <div className="space-y-6">
        <section>
          <h2 className="font-serif text-lg font-semibold text-[#1F1D1A]">
            I. Nguyên tắc chung đối với Dịch vụ nội dung số
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#4A453E]">
            Các sản phẩm trên Inviwedd là dịch vụ phần mềm trực tuyến (SaaS),
            được kích hoạt và bàn giao quyền sử dụng tính năng ngay lập tức cho
            khách hàng sau khi thanh toán. Do đặc thù kỹ thuật số, Inviwedd cho
            phép tất cả khách hàng trải nghiệm thực tế miễn phí toàn bộ quy trình
            tạo thiệp trước khi đưa ra quyết định nâng cấp gói trả phí.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#4A453E]">
            Chính sách hoàn tiền này được xây dựng nhằm bảo vệ tối đa quyền lợi
            chính đáng của khách hàng khi phát sinh sự cố không mong muốn.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold text-[#1F1D1A]">
            II. Các trường hợp ĐƯỢC hoàn tiền 100%
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#4A453E]">
            Inviwedd cam kết hoàn trả 100% số tiền giao dịch trong các trường hợp
            sau:
          </p>

          <div className="mt-3 space-y-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs sm:text-sm">
              <h3 className="font-semibold text-emerald-900">
                1. Lỗi kỹ thuật nghiêm trọng từ hệ thống Inviwedd
              </h3>
              <p className="mt-1 text-emerald-800">
                Máy chủ Inviwedd gặp sự cố tê liệt hoặc lỗi phần mềm nghiêm
                trọng khiến thiệp cưới của bạn hoàn toàn không thể truy cập được
                trong ngày diễn ra hôn lễ, và đội ngũ kỹ thuật không thể khắc
                phục trong vòng <strong>24 giờ</strong> kể từ thời điểm tiếp
                nhận thông báo khẩn cấp từ bạn.
              </p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs sm:text-sm">
              <h3 className="font-semibold text-emerald-900">
                2. Thanh toán trùng lặp đơn hàng
              </h3>
              <p className="mt-1 text-emerald-800">
                Khách hàng vô tình thao tác chuyển khoản hai lần hoặc ngân hàng xử
                lý lặp lệnh thanh toán cho cùng một mã thiệp cưới. Inviwedd sẽ
                hoàn trả ngay 100% khoản tiền thanh toán thừa sau khi đối soát
                sao kê.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold text-[#1F1D1A]">
            III. Các trường hợp KHÔNG áp dụng hoàn tiền
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#4A453E]">
            <li>
              <strong>Đã sử dụng tính năng trả phí:</strong> Gói dịch vụ đã kích
              hoạt thành công và khách hàng đã thực hiện các thao tác nâng cao
              như: gửi link thiệp vượt quá 20 khách mời, xuất file in QR để bàn,
              phát hành thẻ check-in QR hoặc sử dụng màn hình LED sảnh tiệc.
            </li>
            <li>
              <strong>Thay đổi kế hoạch cá nhân:</strong> Khách hàng quyết định
              thay đổi ngày cưới, dời lịch hoặc hủy hôn lễ vì lý do cá nhân
              không xuất phát từ lỗi của hệ thống Inviwedd.{" "}
              <em>
                (Lưu ý: Inviwedd luôn hỗ trợ bạn chỉnh sửa lại ngày giờ, địa điểm
                và thông tin tiệc cưới hoàn toàn MIỄN PHÍ trên thiệp thay vì phải
                mua gói mới).
              </em>
            </li>
            <li>
              <strong>Sự cố ngoài tầm kiểm soát của Inviwedd:</strong> Lỗi kết
              nối mạng Internet do nhà mạng cung cấp tại trung tâm tiệc cưới,
              thiết bị màn hình LED của nhà hàng bị hỏng phần cứng hoặc sự cố
              ngắt kết nối từ phía thiết bị của khách hàng.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold text-[#1F1D1A]">
            IV. Quy trình &amp; Thời hạn xử lý hoàn tiền
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#4A453E]">
            Để yêu cầu hoàn tiền, quý khách vui lòng thực hiện theo 3 bước sau:
          </p>

          <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm text-[#4A453E]">
            <li>
              <strong>Bước 1 — Gửi yêu cầu:</strong> Gửi email về địa chỉ{" "}
              <code>{LEGAL_INFO.email}</code> hoặc liên hệ hotline{" "}
              <a href={LEGAL_INFO.hotlineHref} className="text-[#7A1C24] underline">
                {LEGAL_INFO.hotline}
              </a>{" "}
              với tiêu đề: <code>[Yêu cầu hoàn tiền] - Tên cô dâu chú rể - Mã thiệp</code>.
              Nội dung cung cấp: (1) Mã đơn hàng / ảnh chụp biên lai VietQR, (2)
              Lý do yêu cầu hoàn tiền, (3) Thông tin tài khoản ngân hàng nhận tiền
              hoàn (Tên ngân hàng, Số tài khoản, Tên chủ tài khoản).
            </li>
            <li>
              <strong>Bước 2 — Tiếp nhận &amp; Thẩm định:</strong> Bộ phận Chăm
              sóc khách hàng và Kỹ thuật Inviwedd sẽ kiểm tra nhật ký hệ thống
              trong vòng <strong>24 giờ làm việc</strong> và phản hồi xác nhận
              tính hợp lệ của yêu cầu qua email/điện thoại.
            </li>
            <li>
              <strong>Bước 3 — Thực hiện chuyển khoản hoàn tiền:</strong> Sau khi
              yêu cầu được duyệt, Inviwedd sẽ chuyển khoản hoàn trả 100% số tiền
              về tài khoản ngân hàng của khách hàng trong vòng{" "}
              <strong>3 – 5 ngày làm việc</strong> (không tính thứ Bảy, Chủ Nhật
              và các ngày lễ Tết theo quy định nhà nước).
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold text-[#1F1D1A]">
            V. Đầu mối liên hệ giải quyết khiếu nại
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#4A453E]">
            Mọi phản ánh, thắc mắc hoặc yêu cầu hỗ trợ liên quan đến chính sách
            hoàn tiền xin vui lòng liên hệ trực tiếp với chúng tôi:
          </p>
          <div className="mt-3 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] p-4 text-xs sm:text-sm">
            <p className="font-semibold text-[#1F1D1A]">
              Ban Quản trị Nền tảng Inviwedd
            </p>
            <p className="mt-1 text-[#6B655E]">
              Chủ sở hữu: <strong>{LEGAL_INFO.ownerName}</strong>
            </p>
            <p className="mt-1 text-[#6B655E]">
              Hotline hỗ trợ:{" "}
              <a href={LEGAL_INFO.hotlineHref} className="font-medium text-[#7A1C24] underline">
                {LEGAL_INFO.hotline}
              </a>
            </p>
            <p className="mt-1 text-[#6B655E]">
              Email tiếp nhận: <code>{LEGAL_INFO.email}</code>
            </p>
          </div>
        </section>
      </div>
    </PolicyLayout>
  );
}
