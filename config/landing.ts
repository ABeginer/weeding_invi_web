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
    eyebrow: "GIÁ TRỊ XỨNG ĐÁNG & QUẢN TRỊ THÔNG MINH",
    title: "Giải quyết gọn nhẹ mọi khâu mời khách từ một Dashboard",
    description:
      "Thay cho chi phí in thiệp giấy đắt đỏ và cảnh nhắn tin hỏi từng người, chỉ từ một khoản chi phí nhỏ bạn sở hữu trọn bộ thiệp cá nhân hóa cùng bảng điều khiển quản lý ngày cưới chuyên nghiệp.",
    steps: [
      {
        number: "01",
        title: "Đúng tên từng khách mời",
        description:
          "Tiết kiệm công sức ghi tay và chi phí in lại khi sai tên. Mỗi khách mời nhận một liên kết mang đúng tên riêng đầy trân trọng.",
        bullets: [
          "Dán nhanh cả danh sách khách mời từ Excel hoặc Google Sheets trong vài giây",
          "Tự sinh link mời cá nhân & tin nhắn mẫu copy 1 chạm gửi Zalo/SMS",
          "Phân quyền mời riêng theo từng buổi lễ (Thành hôn hoặc Tiệc cưới)",
        ],
      },
      {
        number: "02",
        title: "Dashboard chốt bàn chính xác",
        description:
          "Không còn cảnh ước lượng cảm tính khiến thừa hoặc thiếu cỗ. Theo dõi chính xác ai sẽ đến theo thời gian thực ngay trong Dashboard.",
        bullets: [
          "Thống kê trực quan số khách xác nhận, báo bận và đang chờ phản hồi",
          "Tự cộng dồn tổng khách kèm số người đi cùng cho từng buổi lễ",
          "Tổng hợp sẵn chế độ ăn chay / ăn mặn để đặt thực đơn chuẩn xác",
        ],
      },
      {
        number: "03",
        title: "Chỉnh sửa thiệp mọi lúc, không tốn phí in lại",
        description:
          "Đổi giờ tiệc, bổ sung bản đồ sảnh hay thay ảnh cưới sau khi đã phát hành — mọi cập nhật đồng bộ tức thì tới tất cả khách mời.",
        bullets: [
          "Cập nhật thông tin cưới, lịch lễ và Google Maps chỉ đường dễ dàng",
          "Quản lý thư viện ảnh HD, nhạc nền và QR mừng cưới hai gia đình",
          "Xem trước trực tiếp trên khung điện thoại ngay trong trang quản trị",
        ],
      },
      {
        number: "04",
        title: "Lưu giữ lời chúc & chia sẻ không giới hạn",
        description:
          "Mọi lời chúc tốt đẹp được gom gọn gàng thay vì trôi mất trên mạng xã hội, đi kèm chỉ đường một chạm và hộp mừng cưới tinh tế.",
        bullets: [
          "Tự động lưu và tìm kiếm toàn bộ lời chúc trong mục Quản lý Dashboard",
          "Có sẵn đường dẫn công khai tiện đăng Facebook hoặc mời nhóm bạn",
          "Khung quà mừng đặt gọn gàng sau bước xác nhận để giữ sự trang nhã",
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
