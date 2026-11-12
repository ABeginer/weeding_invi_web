import { SITE_NAME } from "./site";

export const LANDING_COPY = {
  seo: {
    title: `Thiệp cưới online | ${SITE_NAME}`,
    description:
      "Thiết kế thiệp cưới online tinh tế, trải nghiệm trực tiếp trên khung điện thoại, gửi link mời cá nhân hóa và quản lý RSVP dễ dàng.",
    ogAlt: `Thiệp cưới online ${SITE_NAME}`,
  },
  navbar: {
    menuOpenLabel: "Mở menu điều hướng",
    menuCloseLabel: "Đóng menu điều hướng",
    links: [
      { label: "Mẫu thiệp", href: "#mau-thiep" },
      { label: "Bảng giá", href: "#bang-gia" },
      { label: "Cách hoạt động", href: "#cach-hoat-dong" },
    ],
    loginLabel: "Đăng nhập",
    startLabel: "Dùng ngay",
    dashboardLabel: "Bảng điều khiển",
    logoutLabel: "Đăng xuất",
  },
  hero: {
    eyebrow: "THIỆP CƯỚI TRỰC TUYẾN CAO CẤP",
    title: "Thiệp cưới online, đẹp như bạn mong đợi",
    description:
      "Chạm mở phong bì, cuộn xem từng trang thiệp ngay trên điện thoại và gửi lời mời mang tên riêng từng vị khách.",
    primaryCta: "Dùng ngay miễn phí",
    secondaryCta: "Xem mẫu thiệp",
    authenticatedCta: "Vào trang quản lý",
    noCardNote: "Gói miễn phí không cần thẻ",
    phoneFrameAriaLabel: "Khung xem thử mẫu thiệp cưới tương tác trên màn hình điện thoại",
    phoneLoadingLabel: "Đang tải mẫu thiệp...",
    phoneHelperHint: "Vuốt hoặc cuộn ngay trong khung để xem thử",
    quickSwitchLabel: "Đổi nhanh mẫu thiệp:",
  },
  templates: {
    eyebrow: "BỘ SƯU TẬP MẪU THIỆP",
    title: "Chọn mẫu thiệp của bạn",
    description:
      "Mỗi mẫu đều tối ưu hiển thị mượt mà trên điện thoại, hỗ trợ nhạc nền, album ảnh cưới và xác nhận tham dự.",
    filters: [
      { id: "all", label: "Tất cả" },
      { id: "free", label: "Miễn phí" },
      { id: "pro", label: "Pro" },
      { id: "vip", label: "VIP" },
    ] as const,
    planBadges: {
      free: "Miễn phí",
      pro: "Pro",
      vip: "VIP",
    },
    previewLabel: "Xem thử",
    useTemplateLabel: "Dùng mẫu này",
    comingSoonLabel: "Sắp ra mắt",
    vipPlaceholderBadge: "Sắp có",
    loadingLabel: "Đang chuẩn bị kho mẫu...",
    emptyFilterLabel: "Chưa có mẫu nào trong nhóm này.",
  },
  howItWorks: {
    eyebrow: "QUY TRÌNH 3 BƯỚC",
    title: "Tạo thiệp trong vài phút",
    steps: [
      {
        number: "01",
        title: "Chọn mẫu",
        description:
          "Xem thử trực tiếp trên khung điện thoại và chọn phong cách phù hợp nhất với buổi lễ của hai bạn.",
      },
      {
        number: "02",
        title: "Điền thông tin và ảnh cưới",
        description:
          "Nhập tên cô dâu chú rể, lịch tiệc, lời ngỏ và thông tin hai bên gia đình trong trang quản lý gọn nhẹ.",
      },
      {
        number: "03",
        title: "Gửi link cho khách",
        description:
          "Sao chép từng đường dẫn cá nhân có sẵn tên khách mời hoặc link chung để gửi qua Zalo, Messenger.",
      },
    ],
  },
  pricing: {
    eyebrow: "CHI PHÍ MINH BẠCH",
    title: "Bảng giá dịch vụ",
    description:
      "Bắt đầu miễn phí không cần thẻ thanh toán. Nâng cấp linh hoạt bất cứ lúc nào khi cần thêm khách mời và giao diện.",
    featureColumnHeader: "Tính năng",
    comingSoonBadge: "Sắp có",
  },
  paymentModal: {
    title: "Thanh toán chuyển khoản",
    description:
      "Vui lòng chuyển khoản theo đúng nội dung mã đơn bên dưới. Bộ phận hỗ trợ sẽ kích hoạt gói ngay sau khi đối soát.",
    planLabel: "Gói đã chọn",
    amountLabel: "Số tiền",
    orderCodeLabel: "Mã đơn thanh toán",
    bankLabel: "Ngân hàng",
    accountNumberLabel: "Số tài khoản",
    accountHolderLabel: "Chủ tài khoản",
    branchLabel: "Chi nhánh",
    emptyValuePlaceholder: "Đang cập nhật (TODO)",
    copyCodeLabel: "Sao chép mã đơn",
    copiedCodeLabel: "Đã chép mã",
    closeLabel: "Đóng",
    notice:
      "Đây là giao diện đặt gói tạm thời — chưa thực hiện thanh toán trực tuyến tự động.",
  },
  planUpgradeModal: {
    title: "Mẫu thuộc gói nâng cao",
    descriptionPrefix: "Mẫu",
    descriptionMiddle: "thuộc gói",
    descriptionSuffix:
      "để mở khóa giao diện và các hiệu ứng trình diễn đi kèm.",
    chooseProLabel: "Chọn gói Pro",
    chooseVipLabel: "Chọn gói VIP",
    chooseFreeInsteadLabel: "Xem các mẫu Miễn phí",
    closeLabel: "Để sau",
  },
  demo: {
    backToTemplates: "← Quay lại mẫu",
    phoneViewLabel: "Điện thoại (390px)",
    desktopViewLabel: "Máy tính",
    viewSwitcherAriaLabel: "Chuyển góc nhìn xem mẫu",
    useNowLabel: "Dùng mẫu này ngay",
    musicPlayLabel: "Phát nhạc",
    musicPauseLabel: "Tắt nhạc",
    musicLoadingLabel: "Đang tải...",
    vipComingSoonTitle: "Mẫu VIP đang được hoàn thiện",
    vipComingSoonBody:
      "Phiên bản mẫu độc quyền có hiệu ứng nâng cao hiện đang ở trạng thái placeholder và sẽ sớm ra mắt.",
    backHomeLabel: "Về danh sách mẫu",
  },
  footer: {
    privacyLabel: "Chính sách bảo mật",
    termsLabel: "Điều khoản sử dụng",
    contactPrefix: "Liên hệ:",
  },
  legalPages: {
    privacyTitle: "Chính sách bảo mật",
    termsTitle: "Điều khoản sử dụng",
    placeholderNote:
      "Nội dung văn bản pháp lý đang được biên soạn và sẽ được cập nhật chính thức trước ngày phát hành.",
    backHomeLabel: "← Quay lại trang chủ",
  },
} as const;

