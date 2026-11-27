import { SITE_NAME } from "./site";

export const IS_LUNAR_TOOL_PUBLIC = true;

export interface ToolFaqItem {
  question: string;
  answer: string;
}

export interface SuggestedExpenseCategory {
  id: string;
  label: string;
  hint: string;
}

export const TOOLS_HUB_COPY = {
  seo: {
    title: `Công cụ cưới miễn phí | ${SITE_NAME}`,
    description:
      "Tổng hợp công cụ chuẩn bị đám cưới miễn phí: ước tính tổng chi phí tiệc, số bàn cần đặt và lượt mừng hòa vốn ngay trên trình duyệt.",
    ogAlt: `Công cụ chuẩn bị đám cưới miễn phí ${SITE_NAME}`,
  },
  navLabel: "Công cụ",
  eyebrow: "CÔNG CỤ CHUẨN BỊ ĐÁM CƯỚI",
  title: "Công cụ tính toán miễn phí cho ngày cưới",
  description:
    "Tính nhanh số bàn tiệc, dự trù ngân sách theo báo giá thực tế của bạn và tra cứu lịch cưới ngay trên trình duyệt. Không cần đăng nhập, dữ liệu không gửi về máy chủ.",
  homepageSection: {
    eyebrow: "CÔNG CỤ MIỄN PHÍ",
    title: "Công cụ tính toán miễn phí",
    description:
      "Hỗ trợ cô dâu chú rể ước tính ngân sách, số mâm tiệc và chuẩn bị kế hoạch trước khi gửi thiệp mời.",
  },
  cards: [
    {
      id: "wedding-calc",
      title: "Bảng tính đám cưới",
      description:
        "Ước tính tổng chi phí, số bàn chính thức kèm dự phòng, chi phí thực đơn theo giá mâm và số lượt mừng cần để hòa vốn.",
      href: "/cong-cu/bang-tinh-dam-cuoi",
      ctaLabel: "Mở bảng tính",
      badge: "Đang mở",
      available: true,
    },
    {
      id: "lunar-converter",
      title: "Đổi âm lịch",
      description:
        "Đổi ngày dương sang âm lịch và ngược lại (1900–2100), hiển thị can chi năm, tháng, ngày theo múi giờ Việt Nam.",
      href: "/cong-cu/doi-am-lich",
      ctaLabel: IS_LUNAR_TOOL_PUBLIC ? "Mở công cụ" : "Đang đối chiếu lịch",
      badge: IS_LUNAR_TOOL_PUBLIC ? "Đang mở" : "Đang đối chiếu",
      available: IS_LUNAR_TOOL_PUBLIC,
    },
    {
      id: "zalo-invite",
      title: "Tạo lời mời Zalo",
      description:
        "Soạn lời mời cưới gửi Zalo/Messenger đúng vai vế (ông bà, cô chú, sếp, bạn thân…) với 3 phương án chỉn chu, sao chép 1 chạm.",
      href: "/cong-cu/tao-loi-moi-zalo",
      ctaLabel: "Soạn lời mời",
      badge: "Mới",
      available: true,
    },
    {
      id: "guest-list",
      title: "Lập danh sách khách mời",
      description:
        "Chia khách theo Lễ Vu Quy, Thành Hôn, Tiệc Cưới, ước tính số bàn kèm bàn dự phòng, xuất Excel UTF-8 và dán thẳng 500 khách vào Inviwedd.",
      href: "/cong-cu/tao-danh-sach-khach-moi",
      ctaLabel: "Lập danh sách",
      badge: "Mới",
      available: true,
    },
    {
      id: "save-the-date",
      title: "Tạo ảnh Save the Date & đếm ngược",
      description:
        "Thiết kế ảnh đếm ngược ngày cưới chuẩn Story 9:16 và bài đăng Facebook 4:5 ngay trên trình duyệt, tải PNG sắc nét không cần cài app.",
      href: "/cong-cu/tao-anh-dem-nguoc-ngay-cuoi",
      ctaLabel: "Tạo ảnh ngay",
      badge: "Mới",
      available: true,
    },
    {
      id: "wedding-checklist",
      title: "Checklist đếm ngược đám cưới",
      description:
        "Chọn ngày cưới dương lịch để tự chia 5 mốc chuẩn bị từ 6 tháng tới ngày lễ, lưu tiến độ trên trình duyệt và xuất file Excel chuẩn UTF-8.",
      href: "/cong-cu/checklist-chuan-bi-dam-cuoi",
      ctaLabel: "Mở checklist",
      badge: "Mới",
      available: true,
    },
  ] as const,
} as const;

export const WEDDING_CALC_COPY = {
  seo: {
    title: `Bảng tính chi phí đám cưới online | ${SITE_NAME}`,
    description:
      "Ước tính chi phí đám cưới, số bàn tiệc dự phòng và số lượt mừng hòa vốn theo giá mâm thực tế. Chạy ngay trên trình duyệt, không lưu máy chủ.",
    ogAlt: `Bảng tính chi phí đám cưới online ${SITE_NAME}`,
  },
  breadcrumbs: [
    { label: "Trang chủ", href: "/" },
    { label: "Công cụ", href: "/cong-cu" },
    { label: "Bảng tính đám cưới", href: "/cong-cu/bang-tinh-dam-cuoi" },
  ],
  eyebrow: "BẢNG TÍNH ĐÁM CƯỚI",
  h1: "Bảng tính chi phí đám cưới online",
  intro:
    "Bảng tính này giúp bạn ước tính tổng chi phí đám cưới, số bàn và số mâm cần đặt, và số khách cần thiết để tiền mừng bù đắp chi phí. Nhập số khách mời, giá một mâm và các khoản chi. Kết quả cập nhật ngay khi bạn thay đổi.",
  defaultDisclaimer:
    "Chỉ là gợi ý, hãy nhập số thực tế của bạn.",
  howToTitle: "Cách dùng",
  howToSteps: [
    {
      step: "01",
      title: "Nhập số khách",
      description:
        "Điền số khách mời dự kiến, chỉnh tỉ lệ đến dự và số người đi cùng trung bình nếu có.",
    },
    {
      step: "02",
      title: "Nhập giá mâm và khoản chi",
      description:
        "Nhập đơn giá một mâm từ nhà hàng cùng các khoản chi dự kiến khác của hai gia đình.",
    },
    {
      step: "03",
      title: "Xem kết quả",
      description:
        "Theo dõi số bàn cần đặt, tổng chi phí, biểu đồ tỉ trọng từng nhóm và mốc hòa vốn tham khảo.",
    },
  ],
  groups: {
    guestsAndTables: {
      title: "Nhóm A · Khách và bàn tiệc",
      invitedGuestsLabel: "Số khách mời dự kiến",
      invitedGuestsPlaceholder: "Ví dụ: 300 (nhập số thực tế của bạn)",
      invitedGuestsHint: "Số nguyên từ 0 đến 2.000.",
      attendanceRateLabel: "Tỉ lệ khách đến dự (%)",
      attendanceRateHint: "Ước tính, hãy điều chỉnh theo thực tế (mặc định gợi ý 90%).",
      avgPlusOnesLabel: "Số người đi cùng trung bình mỗi khách đến dự",
      avgPlusOnesHint:
        "Số thập phân từ 0 đến 5 (ví dụ 0,5 nghĩa là trung bình 2 khách mời có thêm 1 người đi cùng).",
      guestsPerTableLabel: "Số khách mỗi bàn",
      guestsPerTableHint: "Số nguyên từ 1 đến 30 (chỉ là gợi ý, hãy nhập theo loại bàn thực tế).",
      reserveRateLabel: "Dự phòng thêm (%)",
      reserveRateHint: "Từ 0% đến 20% (chỉ là gợi ý, nhập tỉ lệ dự phòng bạn muốn đặt thêm).",
      pricePerTableLabel: "Giá một mâm (₫)",
      pricePerTablePlaceholder: "Ví dụ: 5.000.000 (nhập báo giá thực tế)",
      pricePerTableHint: "Nhập theo báo giá của nhà hàng hoặc dịch vụ tiệc.",
    },
    otherExpenses: {
      title: "Nhóm B · Các khoản chi khác",
      subtitle:
        "Khoản Thực đơn được tính tự động từ số mâm đặt (đã gồm dự phòng) nhân giá một mâm, nên không nằm trong danh sách dưới đây.",
      addButtonLabel: "Thêm khoản chi",
      customNamePlaceholder: "Tên khoản chi (ví dụ: MC / Ban nhạc)",
      amountPlaceholder: "Số tiền (₫)",
      removeLabel: "Xóa khoản chi",
      defaultOtherTotalNote: "Để trống hoặc nhập 0 nếu chưa có số liệu.",
    },
    gifts: {
      title: "Nhóm C · Tiền mừng (tính hòa vốn tham khảo)",
      avgGiftLabel: "Số tiền mừng trung bình mỗi lượt mừng (₫)",
      avgGiftPlaceholder: "Không bắt buộc — nhập mức bạn dự kiến",
      avgGiftHint: "Một lượt mừng là một khách hoặc một gia đình tùy cách bạn đếm.",
    },
  },
  suggestedExpenses: [
    {
      id: "venue",
      label: "Địa điểm",
      hint: "Thuê sảnh, rạp cưới hoặc phí mặt bằng (nếu tách riêng thực đơn).",
    },
    {
      id: "decor",
      label: "Trang trí",
      hint: "Gia tiên, cổng hoa, backdrop, bàn gallery.",
    },
    {
      id: "photography",
      label: "Nhiếp ảnh",
      hint: "Chụp pre-wedding và chụp ngày lễ.",
    },
    {
      id: "videography",
      label: "Quay phim",
      hint: "Quay phóng sự cưới hoặc truyền thống.",
    },
    {
      id: "attire",
      label: "Trang phục cô dâu chú rể",
      hint: "Váy cưới, vest, áo dài, trang điểm.",
    },
    {
      id: "ceremony-gifts",
      label: "Lễ vật và sính lễ",
      hint: "Mâm quả ăn hỏi, tráp lễ, vàng cưới (nếu tính vào ngân sách chung).",
    },
    {
      id: "invitations",
      label: "Thiệp và in ấn",
      hint: "Thiệp giấy, bảng đón khách, hashtag cầm tay.",
    },
    {
      id: "transport",
      label: "Di chuyển",
      hint: "Xe hoa, xe đưa đón họ hàng hai bên.",
    },
    {
      id: "av",
      label: "Âm thanh và ánh sáng",
      hint: "Loa đài, màn hình LED, MC (nếu thuê ngoài).",
    },
    {
      id: "other",
      label: "Khác",
      hint: "Phí phát sinh, thợ phụ hoặc khoản dự phòng riêng.",
    },
  ] satisfies SuggestedExpenseCategory[],
  results: {
    title: "Kết quả ước tính",
    assumptionsTitle: "Giả định đang dùng",
    emptyState: "Nhập số khách và giá mâm để xem kết quả",
    attendingGuestsLabel: "Số khách đến dự",
    attendingPeopleLabel: "Tổng số người dự kiến",
    tablesLabel: "Số bàn cần đặt",
    reserveSubtext: (baseTables: number, reserveTables: number) =>
      `${baseTables} bàn chính + ${reserveTables} bàn dự phòng`,
    totalCostLabel: "Tổng chi phí dự kiến",
    foodCostLabel: "Chi phí thực đơn",
    otherCostLabel: "Chi phí các khoản khác",
    expectedGiftsLabel: "Tiền mừng dự kiến",
    netLabel: "Chênh lệch dự kiến",
    netNegativeNote: "Chi phí đang cao hơn tiền mừng dự kiến",
    netPositiveNote: "Tiền mừng dự kiến đang lớn hơn chi phí",
    netZeroNote: "Tiền mừng dự kiến cân bằng với tổng chi phí",
    breakevenLabel: "Số lượt mừng cần để hòa vốn",
    breakevenSuffix: "lượt mừng",
    chartTitle: "So sánh tỷ trọng các nhóm chi phí",
    chartMenuLabel: "Thực đơn tiệc cưới",
  },
  actions: {
    saveLabel: "Lưu bảng tính",
    savedBannerPrefix: "Đã lưu trên trình duyệt lúc",
    clearLabel: "Xóa dữ liệu đã lưu",
    clearConfirmTitle: "Xác nhận xóa dữ liệu đã lưu?",
    clearConfirmMessage:
      "Thao tác này sẽ xóa các số liệu bảng tính bạn đã lưu trong trình duyệt này và đặt lại biểu mẫu về trạng thái trống.",
    clearConfirmAccept: "Xóa dữ liệu",
    clearConfirmCancel: "Giữ lại",
    printLabel: "In hoặc lưu PDF",
    privacyNote:
      "Mọi tính toán chạy trực tiếp trên trình duyệt. Dữ liệu không gửi về máy chủ và không tạo đường dẫn chia sẻ công khai.",
  },
  bottomCta: {
    title: "Đã có danh sách khách? Tạo link mời riêng cho từng người",
    description:
      "Khởi tạo thiệp cưới cá nhân hóa theo từng vị khách mời và thu thập xác nhận tham dự tự động để chốt số bàn chuẩn xác.",
    buttonLabel: "Tạo thiệp miễn phí",
    href: "/tao-thiep",
  },
  crossLinks: {
    title: "Liên kết nhanh",
    items: [
      { label: "Trang tổng hợp công cụ", href: "/cong-cu" },
      ...(IS_LUNAR_TOOL_PUBLIC
        ? [{ label: "Đổi ngày dương sang âm lịch", href: "/cong-cu/doi-am-lich" }]
        : []),
      { label: "Tạo thiệp cưới miễn phí", href: "/tao-thiep" },
    ],
  },
  faqTitle: "Câu hỏi thường gặp",
  faqs: [
    {
      question: "Chi phí đám cưới thường gồm những khoản nào?",
      answer:
        "Các khoản phổ biến thường gồm tiệc thực đơn, địa điểm, trang trí, nhiếp ảnh, quay phim, trang phục và trang điểm, lễ vật ăn hỏi, thiệp mời, di chuyển, âm thanh ánh sáng và chi phí dự phòng. Danh sách trong bảng tính chỉ mang tính tham khảo; bạn có thể giữ, bỏ trống hoặc thêm khoản riêng phù hợp với lễ cưới của mình.",
    },
    {
      question: "Làm sao để ước tính số bàn tiệc?",
      answer:
        "Bạn lấy số khách mời nhân với tỉ lệ đến dự để ra số khách chính, cộng thêm số người đi cùng trung bình để ước tính tổng số người, rồi chia cho số khách mỗi bàn và cộng thêm tỉ lệ bàn dự phòng theo thói quen của nhà hàng hoặc gia đình.",
    },
    {
      question: "Tiền mừng trung bình là bao nhiêu?",
      answer:
        "Không có con số chung cố định cho mọi đám cưới. Mức tiền mừng phụ thuộc vào vùng miền, loại hình địa điểm, mối quan hệ thân sơ và điều kiện của từng gia đình, vì vậy bạn nên tham khảo thêm từ người thân hoặc bạn bè vừa tổ chức gần đây tại địa phương.",
    },
    {
      question: "Vì sao cần tính số lượt mừng để hòa vốn?",
      answer:
        "Con số lượt mừng hòa vốn giúp cô dâu chú rể hình dung tương quan giữa ngân sách tổng và lượng khách mời thực tế khi lập kế hoạch tài chính, từ đó chủ động cân đối các hạng mục hoặc quỹ dự phòng.",
    },
    {
      question: "Công cụ có lưu thông tin của tôi không?",
      answer:
        "Không. Mọi phép tính đều chạy trên trình duyệt của bạn và không gửi dữ liệu về máy chủ Inviwedd. Thông tin chỉ được ghi vào bộ nhớ trình duyệt (localStorage) khi bạn chủ động bấm nút Lưu bảng tính.",
    },
  ] satisfies ToolFaqItem[],
} as const;

export const LUNAR_CONVERTER_COPY = {
  seo: {
    title: `Đổi ngày dương sang âm lịch | ${SITE_NAME}`,
    description:
      "Chuyển đổi ngày dương lịch sang âm lịch và ngược lại (1900–2100) kèm can chi năm, tháng, ngày theo giờ Việt Nam để tham khảo ngày cưới.",
    ogAlt: `Công cụ đổi ngày dương sang âm lịch ${SITE_NAME}`,
  },
  breadcrumbs: [
    { label: "Trang chủ", href: "/" },
    { label: "Công cụ", href: "/cong-cu" },
    { label: "Đổi âm lịch", href: "/cong-cu/doi-am-lich" },
  ],
  eyebrow: "TRA CỨU ÂM DƯƠNG LỊCH VIỆT NAM",
  h1: "Đổi ngày dương sang âm lịch",
  intro:
    "Đổi ngày dương lịch sang âm lịch và ngược lại, kèm can chi của năm, tháng và ngày. Hữu ích khi chọn ngày cưới và ghi ngày âm trong thiệp.",
  referenceNote:
    "Kết quả mang tính tham khảo. Hãy đối chiếu với lịch chính thức khi cần quyết định quan trọng.",
  timezoneNote:
    "Tính toán cố định theo múi giờ Việt Nam (Asia/Ho_Chi_Minh, UTC+7), không phụ thuộc cài đặt giờ trên thiết bị.",
  modes: {
    solarToLunar: "Dương lịch -> Âm lịch",
    lunarToSolar: "Âm lịch -> Dương lịch",
  },
  bottomCta: {
    title: "Ghi ngày âm lịch vào thiệp cưới",
    description:
      "Sau khi tra cứu ngày phù hợp, bạn có thể nhập trực tiếp ngày âm lịch vào thiệp cưới online và gửi link mời cho từng vị khách.",
    buttonLabel: "Tạo thiệp miễn phí",
    href: "/tao-thiep",
  },
  faqs: [
    {
      question: "Công cụ tính âm lịch theo múi giờ nào?",
      answer:
        "Thuật toán luôn quy đổi theo múi giờ Việt Nam (Asia/Ho_Chi_Minh, UTC+7) dựa trên ngày Sóc và Trung khí để tránh sai lệch ngày khi bạn mở công cụ ở nước ngoài hoặc thiết bị đặt sai múi giờ.",
    },
    {
      question: "Tháng nhuận âm lịch được xử lý ra sao?",
      answer:
        "Khi chuyển từ dương sang âm, công cụ tự động đánh dấu tháng nhuận nếu ngày đó rơi vào tháng nhuận. Khi đổi ngược từ âm sang dương, bạn có thể chọn ô Tháng nhuận và công cụ sẽ kiểm tra xem năm âm lịch đó có đúng tháng nhuận này hay không.",
    },
    {
      question: "Tôi có thể dùng kết quả này để chốt ngày cưới ngay không?",
      answer:
        "Kết quả mang tính tham khảo kỹ thuật theo thuật toán lịch thiên văn phổ biến. Trước khi ấn định các mốc lễ quan trọng hoặc in ấn, hai gia đình nên đối chiếu thêm với lịch chính thức đang lưu hành.",
    },
  ] satisfies ToolFaqItem[],
} as const;

export const GUEST_LIST_COPY = {
  seo: {
    title: "Tạo danh sách khách mời đám cưới & chia bàn theo buổi lễ",
    description:
      "Công cụ lập danh sách khách mời đám cưới miễn phí theo Lễ Vu Quy, Thành Hôn và Tiệc Cưới. Tự chia bàn theo nhóm, xuất Excel UTF-8 và dán 500 khách vào Inviwedd.",
    keywords: [
      "tạo danh sách khách mời đám cưới",
      "lập danh sách khách mời cưới",
      "chia bàn tiệc cưới",
      "mẫu danh sách khách mời đám cưới excel",
      "tính số bàn tiệc cưới",
      "Inviwedd",
    ],
    appName: "Công cụ tạo danh sách khách mời đám cưới",
    ogAlt: `Công cụ lập danh sách khách mời đám cưới và chia bàn ${SITE_NAME}`,
  },
  breadcrumbs: [
    { label: "Trang chủ", href: "/" },
    { label: "Công cụ", href: "/cong-cu" },
    { label: "Tạo danh sách khách mời", href: "/cong-cu/tao-danh-sach-khach-moi" },
  ],
  hero: {
    eyebrow: "LẬP DANH SÁCH & CHIA BÀN TIỆC CƯỚI",
    h1: "Công cụ tạo danh sách khách mời đám cưới",
    subtitle:
      "Phân tách khách dự Lễ Vu Quy, Thành Hôn, Tiệc Cưới, ước tính số bàn kèm bàn dự phòng và xuất Excel hoặc dán thẳng vào thiệp điện tử.",
  },
  faqs: [
    {
      question: "Vì sao nên chia khách mời theo từng buổi lễ ngay từ đầu?",
      answer:
        "Đám cưới Việt Nam thường có ba mốc riêng: Lễ Vu Quy tại nhà gái, Lễ Thành Hôn tại nhà trai và Tiệc Cưới chung tại nhà hàng. Nếu chỉ ghi chung một danh sách, hai bên rất dễ đặt thừa mâm cỗ lễ gia tiên hoặc gửi nhầm giờ đón dâu cho nhóm bạn chỉ đi tiệc tối.",
    },
    {
      question: "Cách tính số bàn chính thức và bàn dự phòng hoạt động thế nào?",
      answer:
        "Mỗi khách mời được cộng thêm số người đi cùng dự kiến (ví dụ gia đình 4 người tính thành 4 chỗ). Tổng số người tham dự từng buổi lễ chia cho bội số khách mỗi bàn (thường là 10 hoặc 8 người) và làm tròn lên để ra số bàn chính thức, sau đó cộng thêm khoảng 10% (tối thiểu 1 bàn) làm bàn dự phòng phát sinh.",
    },
    {
      question: "Dữ liệu danh sách khách mời có bị mất khi tải lại trang không?",
      answer:
        "Danh sách và số bàn được lưu tự động trên bộ nhớ trình duyệt (localStorage) ngay tại máy của bạn. Công cụ chạy hoàn toàn phía trình duyệt, không tải danh sách cá nhân lên máy chủ khi bạn chưa bấm tạo thiệp.",
    },
    {
      question: "Làm sao mở file CSV tiếng Việt trên Excel mà không bị lỗi font?",
      answer:
        "Nút Xuất Excel (.csv) gắn sẵn mã UTF-8 BOM ở đầu tệp để Microsoft Excel trên Windows và macOS nhận diện đúng dấu tiếng Việt khi nhấp đúp mở trực tiếp, đồng thời tự động bảo vệ các ký tự đặc biệt ở đầu tên khách.",
    },
    {
      question: "Nút Sao chép dán Inviwedd dùng để làm gì?",
      answer:
        "Khi bấm Sao chép dán Inviwedd, công cụ xuất văn bản 3 cột chuẩn gồm Tên khách, Vai vế xưng hô và Số bàn. Bạn chỉ cần mở trình tạo thiệp tại /tao-thiep, vào mục Nhập khách hàng loạt (hỗ trợ tối đa 500 khách) và dán một lần là xong cả tên lẫn cách xưng hô đúng vai vế.",
    },
  ] satisfies ToolFaqItem[],
} as const;

export const SAVE_THE_DATE_COPY = {
  seo: {
    title: "Tạo ảnh Save the Date & đếm ngược ngày cưới Story 9:16 miễn phí",
    description:
      "Tạo ảnh Save the Date và đếm ngược ngày cưới chuẩn khung Story 9:16 hoặc Facebook Feed 4:5 ngay trên trình duyệt. Tải file PNG 1080px sắc nét kèm caption gợi ý miễn phí.",
    keywords: [
      "tạo ảnh đếm ngược ngày cưới",
      "tạo ảnh save the date",
      "story đếm ngược ngày cưới",
      "thiệp save the date online",
      "đếm ngày cưới online",
      "Inviwedd",
    ],
    appName: "Trình tạo ảnh Save the Date và đếm ngược ngày cưới",
    ogAlt: `Trình tạo ảnh Save the Date và đếm ngược ngày cưới ${SITE_NAME}`,
  },
  breadcrumbs: [
    { label: "Trang chủ", href: "/" },
    { label: "Công cụ", href: "/cong-cu" },
    {
      label: "Tạo ảnh đếm ngược ngày cưới",
      href: "/cong-cu/tao-anh-dem-nguoc-ngay-cuoi",
    },
  ],
  hero: {
    eyebrow: "SAVE THE DATE & ĐẾM NGƯỢC",
    h1: "Trình tạo ảnh đếm ngược ngày cưới",
    subtitle:
      "Tạo nhanh tấm ảnh Save the Date chuẩn khung Story 9:16 hoặc Facebook Feed 4:5 từ ảnh cưới của bạn và tải xuống PNG 1080px chỉ trong 30 giây.",
  },
  faqs: [
    {
      question: "Ảnh cưới tải lên công cụ có bị lưu trên máy chủ hay bị giảm nét không?",
      answer:
        "Không. Toàn bộ quá trình ghép khung, đếm ngược số ngày theo múi giờ Việt Nam và xuất ảnh PNG độ phân giải ngang 1080px chạy 100% ngay trên trình duyệt của bạn, không tải ảnh gốc lên máy chủ.",
    },
    {
      question: "Nên chọn kích thước Story 9:16 hay Bài đăng 4:5 khi thông báo ngày cưới?",
      answer:
        "Khung Story 9:16 (1080x1920 px) phù hợp để đăng lên Instagram Story, Facebook Story, Zalo Khoảnh khắc hoặc TikTok. Khung 4:5 (1080x1350 px) hiển thị trọn vẹn khung đứng đẹp nhất trên bảng tin Facebook và Threads.",
    },
    {
      question: "Công cụ tính số ngày đếm ngược theo múi giờ nào?",
      answer:
        "Ngày hiện tại luôn được đối chiếu cố định theo múi giờ Việt Nam (Asia/Ho_Chi_Minh, UTC+7) nên không bị lệch 1 ngày khi bạn hoặc bạn bè mở ở nước ngoài.",
    },
    {
      question: "Sau khi có ảnh Save the Date thì nên gửi kèm gì để thu thập xác nhận tham dự?",
      answer:
        "Khi đăng ảnh Save the Date lên mạng xã hội trước tiệc 3 đến 4 tuần, bạn có thể tạo một thiệp cưới online miễn phí tại /tao-thiep để ghim liên kết kèm bản đồ Google Maps và nút xác nhận tham dự dưới phần bình luận.",
    },
  ] satisfies ToolFaqItem[],
} as const;

export const WEDDING_CHECKLIST_COPY = {
  seo: {
    title: "File checklist chuẩn bị đám cưới đếm ngược theo ngày (Xuất Excel)",
    description:
      "Công cụ checklist đếm ngược chuẩn bị đám cưới miễn phí: nhập ngày cưới để tự chia mốc 6 tháng, 3 tháng, 1 tháng, 1 tuần, lưu tiến độ trình duyệt và xuất file CSV mở ngay trên Excel.",
    keywords: [
      "file checklist chuẩn bị đám cưới",
      "checklist đám cưới excel",
      "kế hoạch chuẩn bị đám cưới theo tháng",
      "Inviwedd",
    ],
    appName: "Checklist đếm ngược chuẩn bị đám cưới",
    ogAlt: `Công cụ checklist đếm ngược chuẩn bị đám cưới ${SITE_NAME}`,
  },
  breadcrumbs: [
    { label: "Trang chủ", href: "/" },
    { label: "Công cụ", href: "/cong-cu" },
    { label: "Checklist chuẩn bị đám cưới", href: "/cong-cu/checklist-chuan-bi-dam-cuoi" },
  ],
  hero: {
    eyebrow: "LỘ TRÌNH CHUẨN BỊ ĐÁM CƯỚI ĐẦY ĐỦ",
    h1: "Checklist đếm ngược chuẩn bị đám cưới",
    subtitle:
      "Chọn ngày cưới dự kiến để tự tính hạn hoàn thành cho 5 mốc thời gian, lưu tiến độ ngay trên trình duyệt và tải xuống file Excel chuẩn tiếng Việt.",
  },
  faqs: [
    {
      question: "Làm sao công cụ tính ngày hạn cho từng đầu việc trong checklist?",
      answer:
        "Từ ngày cưới dương lịch bạn chọn, công cụ trừ lùi chính xác số ngày theo 5 mốc: Trước 6 tháng (-180 ngày), Trước 3 tháng (-90 ngày), Trước 1 tháng (-30 ngày), Trước 1 tuần (-7 ngày) và Ngày cưới. Ví dụ chọn ngày 20/06/2027 thì hạn gửi thiệp sẽ rơi vào 21/05/2027.",
    },
    {
      question: "Tiến độ tôi đã tích hoàn thành có bị mất khi đóng trình duyệt không?",
      answer:
        "Không. Mọi dấu tích hoàn thành, quy mô đám cưới, ngày cưới và các đầu việc riêng bạn thêm vào đều được lưu tự động trong localStorage của trình duyệt trên thiết bị đang dùng.",
    },
    {
      question: "File tải về có mở được bằng Microsoft Excel mà không bị lỗi font tiếng Việt không?",
      answer:
        "Có. File .csv xuất ra đã gắn sẵn mã UTF-8 BOM ở đầu tệp nên khi nhấp đúp mở bằng Microsoft Excel hoặc nhập vào Google Sheets sẽ hiển thị đầy đủ dấu tiếng Việt cùng cột phụ trách Nhà trai, Nhà gái và trạng thái.",
    },
    {
      question: "Quy mô Thân mật gia đình và Cả hai họ hai nơi khác nhau điểm gì?",
      answer:
        "Chế độ Cả hai họ hai nơi bổ sung đầy đủ các bước đặt sảnh tách riêng cho Lễ Vu Quy và Lễ Thành Hôn, cùng khâu chuẩn bị mâm quả và đội bưng tráp hai bên; còn Thân mật gia đình tinh gọn lại các đầu việc cồng kềnh không cần thiết.",
    },
    {
      question: "Khi đến mốc 1 tháng trước ngày cưới thì nên dùng tính năng nào tiếp theo?",
      answer:
        "Tại mốc Trước 1 tháng, bạn có thể mở trực tiếp trình tạo thiệp tại /tao-thiep trên Inviwedd để dán danh sách khách từ Excel (tối đa 500 khách/lượt), lấy đường dẫn cá nhân hóa tên từng người và thu xác nhận bàn tiệc RSVP tự động.",
    },
  ] satisfies ToolFaqItem[],
} as const;


