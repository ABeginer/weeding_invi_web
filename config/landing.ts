import { SITE_NAME } from "./site";

export const LANDING_COPY = {
  seo: {
    title: `Thiệp cưới online | ${SITE_NAME}`,
    description:
      "Tạo thiệp cưới online cá nhân hóa tên từng khách, chỉ trong vài phút. Miễn phí cho 20 khách, không cần thẻ.",
    ogAlt: `Thiệp cưới online ${SITE_NAME}`,
  },
  navbar: {
    menuOpenLabel: "Mở menu điều hướng",
    menuCloseLabel: "Đóng menu điều hướng",
    links: [
      { label: "Mẫu thiệp", href: "/#mau-thiep" },
      { label: "Ưu điểm", href: "/#cach-hoat-dong" },
      { label: "Bảng giá", href: "/#bang-gia" },
    ],
    loginLabel: "Đăng nhập",
    startLabel: "Tạo thiệp miễn phí",
    dashboardLabel: "Dashboard",
    logoutLabel: "Đăng xuất",
  },
  hero: {
    eyebrow: "THIỆP CƯỚI TRỰC TUYẾN",
    title: "Trao gửi lời mời trân trọng đến từng vị khách quý",
    description:
      "Tạo thiệp cưới online cá nhân hóa tên từng khách, chỉ trong vài phút. Miễn phí cho 20 khách, không cần thẻ.",
    primaryCta: "Tạo thiệp miễn phí",
    secondaryCta: "Xem mẫu thiệp",
    authenticatedCta: "Tạo thiệp miễn phí",
    noCardNote: "Miễn phí cho 20 khách, không cần thẻ",
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
    eyebrow: "TRỌN VẸN CHO NGÀY CƯỚI",
    title: "Giải quyết gọn nhẹ mọi khâu mời khách",
    steps: [
      {
        number: "01",
        title: "Đúng tên từng khách",
        description:
          "Nhập danh sách một lần, mỗi khách một link riêng.",
      },
      {
        number: "02",
        title: "Biết ai sẽ đến",
        description:
          "Xác nhận tham dự, số người đi cùng, chế độ ăn, thống kê trong dashboard.",
      },
      {
        number: "03",
        title: "Chỉ đường và mừng cưới",
        description:
          "Bản đồ, chỉ đường một chạm, quà mừng hiện khi khách muốn xem.",
      },
      {
        number: "04",
        title: "Lời chúc được lưu lại",
        description:
          "Mọi lời chúc hiện trong thiệp và dashboard.",
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
    switchToDesktopLabel: "Xem bản Máy tính",
    previewEyebrow: "XEM THỬ TRỰC TIẾP TRÊN ĐIỆN THOẠI",
    sampleCoupleLabel: "Cặp đôi minh họa",
    musicTrackLabel: "Nhạc nền đi kèm",
    highlightsTitle: "Điểm nổi bật sẵn có",
    highlights: [
      "Mở thiệp tương tác, cuộn mượt chuẩn màn hình di động 390px",
      "Quản lý nhiều lễ & địa điểm kèm chỉ đường Google Maps",
      "Tự tải ảnh cưới, phân quyền lễ cho từng khách và nhận RSVP",
    ],
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
