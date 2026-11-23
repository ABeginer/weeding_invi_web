import type { Metadata } from "next";
import { PolicyLayout } from "@/components/policy/PolicyLayout";
import { LEGAL_INFO } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "Chính sách cung cấp dịch vụ | Inviwedd",
  description:
    "Quy định phương thức bàn giao phần mềm trực tuyến (SaaS), thời gian kích hoạt ngay lập tức và phạm vi cung cấp dịch vụ thiệp cưới điện tử Inviwedd.",
};

export default function ServiceDeliveryPolicyPage() {
  return (
    <PolicyLayout
      currentSlug="cung-cap-dich-vu"
      title="Chính sách cung cấp dịch vụ"
      subtitle="Chính sách quy định phương thức bàn giao phần mềm trực tuyến, thời gian kích hoạt và thời hạn lưu trữ dữ liệu thiệp cưới (áp dụng thay thế cho chính sách giao nhận hàng hóa vật lý)."
    >
      <div className="space-y-6">
        <section>
          <h2 className="font-serif text-lg font-semibold text-[#1F1D1A]">
            I. Bản chất dịch vụ &amp; Phương thức bàn giao
          </h2>
          <div className="mt-3 rounded-2xl border border-[#E8E2D9] bg-[#FAF8F5] p-4 text-xs sm:text-sm">
            <h3 className="font-semibold text-[#7A1C24]">
              Dịch vụ phần mềm trực tuyến (Software as a Service — SaaS)
            </h3>
            <p className="mt-1 text-[#4A453E]">
              Inviwedd cung cấp giải pháp thiệp cưới điện tử và công cụ quản trị
              số hóa hôn lễ hoàn toàn trên nền tảng web trực tuyến.{" "}
              <strong>
                Sản phẩm của chúng tôi không phải là hàng hóa vật lý và không
                áp dụng hình thức đóng gói, vận chuyển hay giao nhận bưu chính.
              </strong>
            </p>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-[#4A453E]">
            <strong>Phương thức bàn giao sản phẩm:</strong>
          </p>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-[#4A453E]">
            <li>
              <strong>Đường dẫn thiệp cưới trực tuyến:</strong> Mỗi đám cưới được
              hệ thống cấp một đường link định danh duy nhất (ví dụ:{" "}
              <code>inviwedd.date/w/ten-co-dau-chu-re</code>). Khách hàng có thể
              chia sẻ đường link này ngay lập tức qua tin nhắn Zalo, Facebook,
              SMS đến người thân và bạn bè.
            </li>
            <li>
              <strong>Không gian quản trị Dashboard:</strong> Bàn giao tài khoản
              quản trị trên trình duyệt web, cho phép người dùng tùy biến nội
              dung thiệp, lập danh sách khách mời, theo dõi phản hồi tham dự và
              xếp bàn tiệc theo thời gian thực.
            </li>
            <li>
              <strong>Tệp kỹ thuật số tải về (dành cho gói VIP):</strong> Khách
              hàng được tải về file ảnh bảng mã QR chuẩn in chất lượng cao để đặt
              tại bàn tiệc và tải file nén <code>.ZIP</code> trọn bộ ảnh kỷ niệm
              do khách mời chụp tại sảnh tiệc sau khi kết thúc hôn lễ.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold text-[#1F1D1A]">
            II. Thời gian bàn giao &amp; Kích hoạt tính năng
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#4A453E]">
            <li>
              <strong>Đối với tài khoản tạo mới (Gói Free):</strong> Kích hoạt tự
              động ngay khi người dùng hoàn tất thao tác lưu thiệp trên hệ thống.
            </li>
            <li>
              <strong>Đối với giao dịch nâng cấp gói trả phí (Pro &amp; VIP):</strong>{" "}
              Hệ thống tự động kích hoạt và mở khóa các tính năng cao cấp (không
              giới hạn khách mời, tải nhạc riêng, sơ đồ bàn tiệc, check-in QR,
              màn hình LED) ngay sau khi hệ thống ghi nhận giao dịch thành công
              qua cổng thanh toán payOS (thường trong vòng vài phút).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold text-[#1F1D1A]">
            III. Phạm vi cung cấp dịch vụ
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#4A453E]">
            Dịch vụ của Inviwedd được cung cấp trên phạm vi{" "}
            <strong>toàn lãnh thổ Việt Nam và quốc tế</strong>. Người tạo thiệp
            cũng như khách mời chỉ cần sở hữu thiết bị điện tử có kết nối
            Internet (điện thoại thông minh, máy tính bảng, máy tính xách tay) và
            trình duyệt web hiện đại là có thể truy cập, xem thiệp và sử dụng đầy
            đủ tính năng mà không cần cài đặt ứng dụng phức tạp.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold text-[#1F1D1A]">
            IV. Thời hạn lưu trữ &amp; Quyền xuất dữ liệu
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#4A453E]">
            <li>
              <strong>Thời hạn lưu trữ:</strong> Được quy định rõ ràng và đồng bộ
              theo từng gói dịch vụ:
              <ul className="mt-1 list-circle space-y-1 pl-5">
                <li>
                  <strong>Gói Miễn phí (Free):</strong> Duy trì lưu trữ trong{" "}
                  <strong>06 tháng</strong> kể từ ngày tạo thiệp.
                </li>
                <li>
                  <strong>Gói Nâng cao (Pro):</strong> Duy trì lưu trữ trong{" "}
                  <strong>01 năm (12 tháng)</strong> kể từ ngày tổ chức hôn lễ.
                </li>
                <li>
                  <strong>Gói Đặc quyền (VIP):</strong> Duy trì lưu trữ trong{" "}
                  <strong>02 năm (24 tháng)</strong> kể từ ngày tổ chức hôn lễ.
                </li>
              </ul>
            </li>
            <li>
              <strong>Quyền sao lưu &amp; Tải dữ liệu:</strong> Chủ tiệc có
              quyền tải về máy danh sách khách mời, danh sách mừng cưới, toàn bộ
              lời chúc và kho ảnh kỷ niệm từ màn hình LED bất cứ lúc nào trong
              thời hạn lưu trữ.
            </li>
            <li>
              <strong>Thông báo trước khi hết hạn:</strong> Trước khi hết hạn lưu
              trữ 30 ngày, hệ thống sẽ gửi email thông báo nhắc nhở để khách hàng
              chủ động sao lưu kỷ niệm ngày cưới.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold text-[#1F1D1A]">
            V. Giới hạn trách nhiệm về đường truyền &amp; Thiết bị đầu cuối
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#4A453E]">
            Inviwedd cam kết duy trì tính sẵn sàng của hệ thống máy chủ ở mức cao
            nhất (SLA 99.5%). Tuy nhiên, Inviwedd không chịu trách nhiệm đối với
            các sự cố truy cập phát sinh từ lỗi thiết bị của người dùng, chất
            lượng kết nối mạng 3G/4G/Wifi yếu tại nơi tổ chức tiệc cưới, hoặc lỗi
            trình duyệt không được cập nhật. Khách hàng sử dụng tính năng màn
            hình LED sảnh tiệc cần đảm bảo máy tính kết nối với màn hình LED có
            kết nối Internet ổn định.
          </p>
        </section>
      </div>
    </PolicyLayout>
  );
}
