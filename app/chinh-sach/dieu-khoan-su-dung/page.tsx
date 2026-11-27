import type { Metadata } from "next";
import { PolicyLayout } from "@/components/policy/PolicyLayout";
import { LEGAL_INFO } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng & Quy trình giao dịch | Inviwedd",
  description:
    "Quy chế hoạt động, điều khoản sử dụng dịch vụ thiệp cưới điện tử Inviwedd, quy trình giao dịch 4 bước và quyền nghĩa vụ của khách hàng theo quy định Bộ Công Thương.",
};

export default function TermsOfServicePage() {
  return (
    <PolicyLayout
      currentSlug="dieu-khoan-su-dung"
      title="Điều khoản sử dụng & Quy trình giao dịch"
      subtitle="Văn bản quy định điều kiện tham gia, quy trình giao dịch trực tuyến và cam kết trách nhiệm giữa Nền tảng thiệp cưới điện tử Inviwedd và người sử dụng."
    >
      <div className="space-y-6">
        <section>
          <h2 className="font-serif text-lg font-semibold text-[#1F1D1A]">
            I. Giới thiệu chung về Nền tảng Inviwedd
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#4A453E]">
            Chào mừng bạn đến với <strong>Inviwedd</strong> (website:{" "}
            <code>inviwedd.date</code>). Inviwedd là nền tảng trực tuyến chuyên
            cung cấp giải pháp thiệp cưới điện tử cao cấp, cá nhân hóa tên khách
            mời và số hóa công tác điều phối tiệc cưới (quản lý danh sách khách
            mời RSVP, sơ đồ xếp bàn, mã QR đón khách và trình chiếu ảnh LED tại
            sảnh tiệc).
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#4A453E]">
            Bằng việc truy cập, khởi tạo tài khoản hoặc tiến hành giao dịch trên
            Inviwedd, bạn xác nhận đã đọc, hiểu rõ và tự nguyện đồng ý tuân thủ
            toàn bộ các điều khoản được quy định dưới đây.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold text-[#1F1D1A]">
            II. Các gói dịch vụ &amp; Mô hình cung cấp (Freemium)
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#4A453E]">
            Inviwedd áp dụng mô hình dịch vụ số hóa kết hợp miễn phí và trả phí
            minh bạch, không tự động gia hạn, thanh toán 1 lần trọn gói theo
            từng thiệp cưới:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#4A453E]">
            <li>
              <strong>Gói Trải Nghiệm (Free — Miễn phí 100%):</strong> Áp dụng
              cho các cặp đôi có quy mô tiệc nhỏ (tối đa 20 khách mời), đầy đủ
              tính năng hiển thị thiệp cưới, bản đồ chỉ đường, chọn nhạc nền mẫu,
              hộp mừng cưới VietQR và lưu trữ thiệp trong vòng 06 tháng.
            </li>
            <li>
              <strong>Gói Nâng Cao (Gói Pro — 159.000đ – 199.000đ):</strong>{" "}
              Không giới hạn số lượng khách mời, tải file nhạc MP3 kỷ niệm riêng,
              tùy biến giao diện nâng cao, album ảnh cưới chất lượng cao và lưu
              trữ thiệp ổn định trong vòng 01 năm (12 tháng).
            </li>
            <li>
              <strong>Gói Đặc Quyền Sảnh Tiệc (Gói VIP — 399.000đ – 499.000đ):</strong>{" "}
              Bao gồm toàn bộ tính năng Pro, tích hợp sơ đồ xếp bàn tiệc, phát
              hành thẻ check-in QR cho từng khách mời, tính năng phân quyền người
              thân hỗ trợ bằng mã PIN 4 số, tải file bảng QR chuẩn in để bàn,
              hệ thống chiếu ảnh khách chụp trực tiếp lên màn hình LED tại sảnh tiệc
              và duy trì lưu trữ kỷ niệm trong vòng 02 năm (24 tháng).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold text-[#1F1D1A]">
            III. Quy trình giao dịch trực tuyến (Theo Nghị định 52/2013/NĐ-CP)
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#4A453E]">
            Khách hàng thực hiện giao dịch mua gói dịch vụ số trên Inviwedd theo
            quy trình 4 bước chuẩn hóa và tự động hóa:
          </p>

          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] p-4 text-xs sm:text-sm">
              <h3 className="font-semibold text-[#7A1C24]">
                Bước 1: Chọn mẫu thiệp &amp; Khởi tạo nội dung
              </h3>
              <p className="mt-1 text-[#4A453E]">
                Khách hàng truy cập trang Mẫu thiệp (<code>/thiep-cuoi</code>) hoặc
                Tạo thiệp (<code>/tao-thiep</code>), nhập tên cô dâu, chú rể, ngày giờ,
                địa điểm hôn lễ và xem trước giao diện thiệp trực quan trên khung điện thoại.
              </p>
            </div>

            <div className="rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] p-4 text-xs sm:text-sm">
              <h3 className="font-semibold text-[#7A1C24]">
                Bước 2: Đăng nhập &amp; Quản trị thiệp tại Dashboard
              </h3>
              <p className="mt-1 text-[#4A453E]">
                Khách hàng xác thực tài khoản qua Google / Email để lưu trữ thiệp
                vào hệ thống. Tại màn hình Dashboard, người dùng có thể tải ảnh
                cưới, cấu hình thông tin mừng cưới, lập danh sách khách mời và
                chia sẻ thiệp.
              </p>
            </div>

            <div className="rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] p-4 text-xs sm:text-sm">
              <h3 className="font-semibold text-[#7A1C24]">
                Bước 3: Lựa chọn gói nâng cấp &amp; Tạo mã thanh toán VietQR
              </h3>
              <p className="mt-1 text-[#4A453E]">
                Khi có nhu cầu mở rộng tính năng hoặc quy mô khách mời, khách
                hàng nhấn &ldquo;Nâng cấp gói&rdquo; (Pro hoặc VIP). Cổng thanh toán
                tích hợp <strong>payOS</strong> tự động tạo mã thanh toán VietQR
                chính xác với số tiền và mã đơn hàng định danh duy nhất.
              </p>
            </div>

            <div className="rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] p-4 text-xs sm:text-sm">
              <h3 className="font-semibold text-[#7A1C24]">
                Bước 4: Chuyển khoản ngân hàng &amp; Kích hoạt tự động tức thì
              </h3>
              <p className="mt-1 text-[#4A453E]">
                Khách hàng mở app ngân hàng quét mã VietQR và xác nhận chuyển
                khoản. Ngay khi giao dịch hoàn tất, hệ thống tự động đối soát qua
                webhook và kích hoạt gói dịch vụ tự động ngay sau khi ghi nhận giao
                dịch thành công (thường trong vòng vài phút). Khách hàng có thể sử
                dụng ngay các tính năng nâng cao mà không cần chụp biên lai hay chờ
                duyệt thủ công.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold text-[#1F1D1A]">
            IV. Quyền và trách nhiệm của Người sử dụng
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#4A453E]">
            <li>
              <strong>Tính chính xác của thông tin:</strong> Người dùng cam kết
              cung cấp thông tin ngày cưới, địa điểm, số điện thoại và thông tin
              liên lạc chính xác khi sử dụng nền tảng.
            </li>
            <li>
              <strong>Trách nhiệm bảo vệ dữ liệu khách mời (Nghị định 13/2023/NĐ-CP):</strong>{" "}
              Người dùng khi thu thập và nhập thông tin danh sách khách mời (họ tên,
              cách xưng hô, số điện thoại) lên hệ thống cam kết đã thông báo và/hoặc
              được sự đồng ý phù hợp từ khách mời; đảm bảo việc xử lý dữ liệu phục
              vụ mục đích gửi thiệp cưới và điều phối hôn lễ tuân thủ quy định pháp
              luật về bảo vệ dữ liệu cá nhân.
            </li>
            <li>
              <strong>Bản quyền nội dung tải lên:</strong> Bạn giữ toàn bộ quyền
              sở hữu đối với hình ảnh cưới, thông tin và tệp âm thanh tải lên;
              đồng thời cam kết không vi phạm bản quyền hay quyền riêng tư của
              bất kỳ cá nhân, tổ chức nào.
            </li>
            <li>
              <strong>Nghiêm cấm nội dung vi phạm:</strong> Tuyệt đối không tải
              lên hoặc phát tán nội dung khiêu dâm, đồi trụy, bạo lực, xúc phạm
              danh dự cá nhân, chống phá Nhà nước CHXHCN Việt Nam hoặc phát tán
              phần mềm độc hại. Inviwedd có quyền khóa vĩnh viễn và phối hợp với
              cơ quan chức năng xử lý các trường hợp vi phạm.
            </li>
            <li>
              <strong>Bảo mật tài khoản:</strong> Bạn chịu trách nhiệm bảo quản
              tài khoản đăng nhập và không chia sẻ đường dẫn quản trị nhạy cảm
              cho người không có thẩm quyền.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold text-[#1F1D1A]">
            V. Quyền và trách nhiệm của Đơn vị cung cấp dịch vụ (Inviwedd)
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#4A453E]">
            <li>
              <strong>Duy trì hoạt động ổn định:</strong> Đảm bảo hệ thống máy
              chủ và đường truyền mạng vận hành thông suốt 24/7 để khách mời của
              bạn có thể truy cập thiệp mượt mà trên mọi thiết bị.
            </li>
            <li>
              <strong>Bảo mật thông tin:</strong> Tuân thủ nghiêm ngặt Chính
              sách bảo mật thông tin cá nhân, không cung cấp dữ liệu khách mời hay
              ảnh cưới cho bất kỳ bên thứ ba nào vì mục đích thương mại.
            </li>
            <li>
              <strong>Hỗ trợ kỹ thuật:</strong> Hỗ trợ giải đáp thắc mắc, xử lý
              sự cố thanh toán hoặc thao tác trong vòng 24 giờ qua Hotline{" "}
              <a href={LEGAL_INFO.hotlineHref} className="text-[#7A1C24] underline">
                {LEGAL_INFO.hotline}
              </a>{" "}
              hoặc Email <code>{LEGAL_INFO.email}</code>.
            </li>
            <li>
              <strong>Quyền từ chối phục vụ:</strong> Có quyền tạm ngưng hoặc
              chấm dứt cung cấp dịch vụ đối với tài khoản cố tình gian lận thanh
              toán, tấn công hệ thống hoặc vi phạm pháp luật hiện hành.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold text-[#1F1D1A]">
            VI. Điều khoản thực thi &amp; Giải quyết tranh chấp
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#4A453E]">
            Điều khoản này có hiệu lực kể từ ngày{" "}
            <strong>{LEGAL_INFO.effectiveDate}</strong>. Inviwedd có quyền cập nhật
            nội dung điều khoản để phù hợp với quy định pháp luật mới nhất và sẽ
            thông báo công khai trên website. Mọi tranh chấp phát sinh trong quá
            trình giao dịch sẽ được ưu tiên giải quyết qua thương lượng thiện chí.
            Trường hợp không đạt được thỏa thuận, vụ việc sẽ được đưa ra cơ quan
            Tòa án có thẩm quyền tại Thành phố Hồ Chí Minh theo luật pháp Việt Nam.
          </p>
        </section>
      </div>
    </PolicyLayout>
  );
}
