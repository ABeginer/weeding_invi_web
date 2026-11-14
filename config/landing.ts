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
      { label: "Thiệp cưới", href: "/thiep-cuoi" },
      { label: "Mẫu thiệp", href: "/#mau-thiep" },
      { label: "Công cụ", href: "/cong-cu" },
      { label: "Cách hoạt động", href: "/#cach-hoat-dong" },
      { label: "Bảng giá", href: "/#bang-gia" },
    ],
    loginLabel: "Đăng nhập",
    startLabel: "Tạo thiệp miễn phí",
    dashboardLabel: "Dashboard",
    logoutLabel: "Đăng xuất",
  },
  hero: {
    eyebrow: "Gửi thiệp online một cách nhanh chóng",
    title: "Trao gửi lời mời trân trọng đến từng vị khách quý",
    description:
      "Tạo thiệp cưới online tự động đổi cách xưng hô theo vai vế, cá nhân hóa ảnh hiển thị Zalo và quản lý bàn tiệc thông minh. Lưu trữ 6 tháng, không giới hạn lượt xem.",
    primaryCta: "Tạo thiệp miễn phí",
    secondaryCta: "Xem bộ sưu tập mẫu",
    authenticatedCta: "Tạo thiệp miễn phí",
    noCardNote: "Miễn phí cho 20 khách, không cần thẻ",
    phoneFrameAriaLabel: "Khung xem thử mẫu thiệp cưới tương tác trên màn hình điện thoại",
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
    emptyFilterLabel: "Chưa có mẫu nào trong nhóm này.",
  },
  howItWorks: {
    eyebrow: "CÁCH THỨC HOẠT ĐỘNG",
    title: "3 bước đơn giản để trao gửi thiệp cưới online",
    description:
      "Giải pháp mời cưới thông minh thay thế in thiệp giấy đắt đỏ, giúp bạn chuẩn bị chu đáo và quản lý ngày vui trọn vẹn.",
    steps: [
      {
        number: "01",
        title: "Chọn mẫu thiệp",
        description:
          "Khám phá bộ sưu tập mẫu thiệp cưới trực tuyến tinh tế, tối ưu trải nghiệm chạm và lướt mượt mà trên điện thoại.",
        bullets: [
          "Nghe thử nhạc nền lãng mạn và ngắm trọn album ảnh cưới kỷ niệm",
          "Xem trước trực quan thiệp cưới trên màn hình di động thực tế",
          "Đa dạng phong cách từ tối giản, cổ điển đến sang trọng hiện đại",
        ],
      },
      {
        number: "02",
        title: "Nhập danh sách khách (tối đa 500 khách mỗi lần nhập)",
        description:
          "Không còn mất thời gian nắn nót viết tay từng phong bì. Nhập cả danh sách khách mời trong nháy mắt.",
        bullets: [
          "Dán nhanh danh sách khách từ Excel hoặc Google Sheets lên tới 500 khách",
          "Phân quyền khách mời theo từng buổi lễ (Lễ Thành Hôn hoặc Tiệc Cưới)",
          "Hệ thống tự động tạo mã và đường liên kết riêng mang tên từng vị khách",
        ],
      },
      {
        number: "03",
        title: "Gửi link riêng cho từng khách",
        description:
          "Trao gửi lời mời trân trọng và tiện lợi qua Zalo, Messenger hoặc SMS chỉ với một thao tác sao chép.",
        bullets: [
          "Tự động soạn sẵn tin nhắn mẫu lịch thiệp kèm link riêng của khách",
          "Khách mời mở thiệp ngay không cần đăng nhập hay tải ứng dụng",
          "Theo dõi phản hồi xác nhận tham dự (RSVP) theo thời gian thực",
        ],
      },
    ],
    dashboardCtaTitle: "Trải nghiệm trọn bộ Dashboard quản lý cưới ngay hôm nay",
    dashboardCtaDescription:
      "Bắt đầu miễn phí cho 20 khách mời đầu tiên — không cần thẻ, dùng thử thực tế trước khi nâng cấp gói Pro/VIP.",
    dashboardPrimaryCta: "Tạo thiệp miễn phí",
    dashboardSecondaryCta: "Xem bảng giá",
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
      "Mở thiệp tương tác, cuộn mượt chuẩn màn hình điện thoại",
      "Quản lý nhiều lễ & địa điểm kèm chỉ đường Google Maps",
      "Tự tải ảnh cưới, chọn lễ mời cho từng khách và nhận xác nhận tham dự",
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
    toolsLabel: "Công cụ",
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
