import { SITE_NAME } from "./site";

export const IS_LUNAR_TOOL_PUBLIC = false;

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
