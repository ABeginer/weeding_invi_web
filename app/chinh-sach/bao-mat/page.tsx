import type { Metadata } from "next";
import { PolicyLayout } from "@/components/policy/PolicyLayout";
import { LEGAL_INFO } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "Chính sách bảo mật thông tin cá nhân | Inviwedd",
  description:
    "Chính sách bảo vệ thông tin cá nhân của Inviwedd tuân thủ đầy đủ Nghị định 52/2013/NĐ-CP, Nghị định 85/2021/NĐ-CP và Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân.",
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout
      currentSlug="bao-mat"
      title="Chính sách bảo mật thông tin cá nhân"
      subtitle="Cam kết bảo vệ dữ liệu người dùng, thông tin khách mời và hình ảnh ngày cưới theo đúng quy định tại Nghị định số 52/2013/NĐ-CP, Nghị định 85/2021/NĐ-CP và Nghị định số 13/2023/NĐ-CP của Chính phủ về Bảo vệ dữ liệu cá nhân."
    >
      <div className="space-y-6">
        <section>
          <h2 className="font-serif text-lg font-semibold text-[#1F1D1A]">
            1. Mục đích thu thập thông tin cá nhân
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#4A453E]">
            Inviwedd thu thập thông tin cá nhân từ người tạo thiệp và khách mời
            với các mục đích rõ ràng, minh bạch sau:
          </p>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-[#4A453E]">
            <li>
              <strong>Khởi tạo và hiển thị thiệp cưới:</strong> Lưu trữ họ tên cô
              dâu, chú rể, ngày giờ, địa điểm tổ chức hôn lễ và các thông điệp
              yêu thương để hiển thị trên thiệp điện tử.
            </li>
            <li>
              <strong>Cá nhân hóa lời mời cho từng khách:</strong> Lưu danh xưng
              và họ tên khách mời (ví dụ: &ldquo;Chú Bảy cùng Gia đình&rdquo;)
              để hiển thị riêng biệt khi khách mở thiệp và chia sẻ qua Zalo.
            </li>
            <li>
              <strong>Điều phối tiệc cưới &amp; Check-in:</strong> Ghi nhận phản
              hồi tham dự (RSVP), số lượng người đi cùng, nhu cầu món ăn
              (chay/mặn), số bàn tiệc và giờ điểm danh check-in tại sảnh tiệc.
            </li>
            <li>
              <strong>Hộp mừng cưới VietQR:</strong> Hiển thị thông tin số tài
              khoản ngân hàng mừng cưới theo sự chủ động cài đặt của cô dâu chú rể.
            </li>
            <li>
              <strong>Màn hình LED sảnh tiệc (Gói VIP):</strong> Tiếp nhận ảnh
              kỷ niệm do khách mời quét mã QR gửi lên để trình chiếu tại tiệc cưới.
            </li>
            <li>
              <strong>Hỗ trợ kỹ thuật &amp; Xử lý thanh toán:</strong> Xác nhận
              giao dịch nâng cấp gói và liên hệ khi có yêu cầu hỗ trợ từ khách hàng.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold text-[#1F1D1A]">
            2. Quy định bảo vệ dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP) &amp; Dữ liệu khách mời
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#4A453E]">
            Inviwedd nghiêm túc thực hiện các nguyên tắc bảo vệ dữ liệu cá nhân
            theo quy định tại <strong>Nghị định số 13/2023/NĐ-CP</strong> ngày
            17/04/2023 của Chính phủ về Bảo vệ dữ liệu cá nhân:
          </p>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-[#4A453E]">
            <li>
              <strong>Vai trò xử lý dữ liệu:</strong> Chủ tài khoản (cô dâu, chú rể)
              là Bên kiểm soát dữ liệu cá nhân đối với danh sách khách mời tiệc cưới.
              Inviwedd đóng vai trò là Bên xử lý dữ liệu theo sự ủy quyền và thiết lập
              của chủ tài khoản nhằm phục vụ gửi thiệp và điều phối hôn lễ.
            </li>
            <li>
              <strong>Trách nhiệm thông báo &amp; Đồng ý:</strong> Chủ tài khoản cam kết
              đã thông báo rõ ràng và/hoặc nhận được sự đồng ý phù hợp từ khách mời trước
              khi nhập thông tin cá nhân của họ (họ tên, cách xưng hô, số điện thoại) lên
              hệ thống Inviwedd để phục vụ việc gửi thiệp cưới và ghi nhận phản hồi tham dự.
            </li>
            <li>
              <strong>Dữ liệu hình ảnh do khách mời tải lên:</strong> Khi khách mời quét mã
              QR và gửi ảnh kỷ niệm lên tính năng Màn hình LED / Kỷ niệm sảnh tiệc, khách mời
              chủ động đồng ý để ảnh được kiểm duyệt và trình chiếu tại sự kiện hôn lễ. Khách
              mời hoặc chủ tiệc có toàn quyền yêu cầu ẩn hoặc xóa ảnh bất kỳ lúc nào qua công
              cụ kiểm duyệt ảnh (Photo Moderator) trên Dashboard hoặc liên hệ hỗ trợ Inviwedd.
            </li>
            <li>
              <strong>Không thu thập dữ liệu nhạy cảm trái phép:</strong> Inviwedd không thu
              thập dữ liệu sinh trắc học, thông tin tài chính cá nhân hay các thông tin cá
              nhân nhạy cảm ngoài phạm vi cần thiết cho hoạt động tổ chức tiệc cưới.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold text-[#1F1D1A]">
            3. Phạm vi sử dụng thông tin
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#4A453E]">
            Inviwedd chỉ sử dụng thông tin cá nhân trong phạm vi nội bộ phục vụ
            trực tiếp cho quá trình tạo lập và vận hành thiệp cưới của khách hàng:
          </p>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-[#4A453E]">
            <li>Cung cấp quyền truy cập và các tính năng tương ứng theo từng gói dịch vụ.</li>
            <li>Gửi thông báo xác nhận thanh toán thành công và kích hoạt tính năng.</li>
            <li>Hỗ trợ giải đáp thắc mắc và khắc phục lỗi kỹ thuật khi khách hàng yêu cầu.</li>
            <li>
              <strong>Cam kết không thương mại hóa:</strong> Inviwedd tuyệt đối{" "}
              <strong>
                không bán, cho thuê, trao đổi hoặc chia sẻ thông tin cá nhân, số
                điện thoại hay dữ liệu khách mời cho bất kỳ bên thứ ba nào
              </strong>{" "}
              vì mục đích quảng cáo hoặc tiếp thị khi chưa có sự đồng ý của bạn.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold text-[#1F1D1A]">
            4. Thời gian lưu trữ thông tin
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#4A453E]">
            Thời hạn lưu trữ dữ liệu thiệp cưới, danh sách khách mời và hình ảnh
            được quy định đồng bộ theo từng gói dịch vụ:
          </p>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-[#4A453E]">
            <li>
              <strong>Gói Miễn phí (Free):</strong> Lưu trữ trong vòng{" "}
              <strong>06 tháng</strong> kể từ ngày khởi tạo thiệp cưới.
            </li>
            <li>
              <strong>Gói Nâng cao (Pro):</strong> Lưu trữ trong vòng{" "}
              <strong>01 năm (12 tháng)</strong> kể từ ngày tổ chức hôn lễ.
            </li>
            <li>
              <strong>Gói Đặc quyền (VIP):</strong> Lưu trữ trong vòng{" "}
              <strong>02 năm (24 tháng)</strong> kể từ ngày tổ chức hôn lễ.
            </li>
            <li>
              Thông tin sẽ được xóa vĩnh viễn khỏi cơ sở dữ liệu khi hết thời hạn
              lưu trữ nêu trên hoặc khi người dùng chủ động gửi yêu cầu xóa dữ liệu
              thiệp cưới trước thời hạn.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold text-[#1F1D1A]">
            5. Những người hoặc tổ chức có thể được tiếp cận thông tin
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#4A453E]">
            Thông tin cá nhân thu thập được chỉ có thể được tiếp cận bởi các đối
            tượng sau:
          </p>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-[#4A453E]">
            <li>
              <strong>Chính chủ tài khoản:</strong> Cô dâu, chú rể và người thân
              được chủ tiệc ủy quyền quản trị (thông qua mã PIN 4 số phân quyền
              trợ lý).
            </li>
            <li>
              <strong>Đội ngũ vận hành &amp; Kỹ thuật Inviwedd:</strong> Nhân sự
              chuyên trách kỹ thuật tiếp cận trong phạm vi tối thiểu cần thiết để
              hỗ trợ khách hàng hoặc khắc phục sự cố hệ thống.
            </li>
            <li>
              <strong>Đối tác cung cấp hạ tầng bảo mật:</strong> Cổng thanh toán{" "}
              <strong>payOS</strong> (xử lý đối soát giao dịch ngân hàng theo
              chuẩn an toàn thông tin) và nhà cung cấp dịch vụ máy chủ đám mây
              uy tín quốc tế (Supabase, Cloudflare) tuân thủ tiêu chuẩn mã hóa bảo mật.
            </li>
            <li>
              <strong>Cơ quan Nhà nước có thẩm quyền:</strong> Khi có yêu cầu
              bằng văn bản hợp pháp từ cơ quan điều tra hoặc cơ quan quản lý nhà
              nước theo quy định của pháp luật Việt Nam.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold text-[#1F1D1A]">
            6. Địa chỉ của đơn vị thu thập và quản lý thông tin
          </h2>
          <div className="mt-3 rounded-2xl border border-[#E8E2D9] bg-[#FAF8F5] p-5 text-xs sm:text-sm">
            <p className="font-semibold text-[#7A1C24]">
              Nền tảng thiệp cưới điện tử Inviwedd
            </p>
            <div className="mt-3 space-y-2 text-[#4A453E]">
              <p>
                <strong>Chủ sở hữu website:</strong> {LEGAL_INFO.ownerName}
              </p>
              <p>
                <strong>Địa chỉ:</strong> {LEGAL_INFO.address}
              </p>
              <p>
                <strong>Điện thoại / Hotline:</strong>{" "}
                <a
                  href={LEGAL_INFO.hotlineHref}
                  className="font-medium text-[#7A1C24] underline"
                >
                  {LEGAL_INFO.hotline}
                </a>
              </p>
              <p>
                <strong>Email liên hệ:</strong>{" "}
                <a
                  href={`mailto:${LEGAL_INFO.email}`}
                  className="text-[#7A1C24] underline"
                >
                  {LEGAL_INFO.email}
                </a>
              </p>
              <p>
                <strong>Website chính thức:</strong>{" "}
                <code>https://inviwedd.date</code>
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold text-[#1F1D1A]">
            7. Phương thức và công cụ để người dùng tiếp cận &amp; chỉnh sửa dữ liệu
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#4A453E]">
            Inviwedd trao cho khách hàng toàn quyền kiểm soát dữ liệu cá nhân của
            mình thông qua các công cụ trực quan:
          </p>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-[#4A453E]">
            <li>
              <strong>Chỉnh sửa 24/7 trên Dashboard:</strong> Người dùng có thể
              đăng nhập bất cứ lúc nào để thay đổi họ tên, ảnh cưới, thông tin gia
              đình, xóa bớt hoặc thêm mới khách mời tại đường dẫn{" "}
              <code>inviwedd.date/dashboard</code>.
            </li>
            <li>
              <strong>Tải về sao lưu:</strong> Chủ tiệc có quyền xuất file danh
              sách khách mời, xuất file ảnh kỷ niệm LED về máy tính cá nhân.
            </li>
            <li>
              <strong>Quyền yêu cầu xóa vĩnh viễn:</strong> Nếu muốn xóa bỏ hoàn
              toàn tài khoản và mọi dữ liệu thiệp cưới khỏi hệ thống trước thời
              hạn lưu trữ của gói, bạn chỉ cần gửi yêu cầu từ email đăng ký về{" "}
              <code>{LEGAL_INFO.email}</code>. Đội ngũ kỹ thuật sẽ tiếp nhận và{" "}
              <strong>xử lý yêu cầu xóa dữ liệu trong vòng 3–7 ngày làm việc</strong>.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold text-[#1F1D1A]">
            8. Cam kết bảo mật &amp; Cơ chế giải quyết khiếu nại
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#4A453E]">
            Inviwedd áp dụng các tiêu chuẩn an toàn kỹ thuật hàng đầu hiện nay:
          </p>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-[#4A453E]">
            <li>
              Mã hóa toàn bộ đường truyền dữ liệu qua giao thức bảo mật HTTPS/TLS
              thông qua mạng biên toàn cầu của Cloudflare.
            </li>
            <li>
              Hệ thống xác thực người dùng được quản lý an toàn qua giải pháp chuyên
              dụng (Supabase Auth / OAuth Google), không lưu trữ mật khẩu thuần
              (plaintext password); cơ sở dữ liệu được phân quyền truy cập nghiêm
              ngặt theo chính sách Row Level Security (RLS) và mã định danh duy nhất.
            </li>
            <li>
              Cơ chế kiểm duyệt ảnh LED hai lớp (chế độ duyệt thủ công trước khi
              phát lên màn hình lớn) giúp chủ tiệc kiểm soát 100% hình ảnh xuất
              hiện tại sảnh tiệc.
            </li>
          </ul>

          <div className="mt-4 rounded-xl border border-[#B89B72]/30 bg-[#FAF8F5] p-4 text-xs sm:text-sm">
            <h3 className="font-semibold text-[#7A1C24]">
              Cơ chế tiếp nhận &amp; giải quyết khiếu nại thông tin cá nhân
            </h3>
            <p className="mt-1.5 text-[#4A453E]">
              Khi phát hiện thông tin cá nhân của mình bị sử dụng sai mục đích
              hoặc phạm vi đã nêu trong chính sách này, người dùng gửi khiếu nại
              kèm chứng cứ đến:
            </p>
            <ul className="mt-2 space-y-1 text-[#4A453E]">
              <li>
                Hotline hỗ trợ khẩn cấp:{" "}
                <a href={LEGAL_INFO.hotlineHref} className="font-semibold text-[#7A1C24] underline">
                  {LEGAL_INFO.hotline}
                </a>
              </li>
              <li>
                Email tiếp nhận khiếu nại: <code>{LEGAL_INFO.email}</code>
              </li>
            </ul>
            <p className="mt-2 text-[#4A453E]">
              Inviwedd cam kết phản hồi bằng văn bản hoặc email giải trình trong
              vòng <strong>24 – 48 giờ làm việc</strong> và chủ động phối hợp với
              người dùng để khắc phục ngay lập tức.
            </p>
          </div>
        </section>
      </div>
    </PolicyLayout>
  );
}
