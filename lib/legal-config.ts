/**
 * lib/legal-config.ts
 *
 * Cấu hình thông tin pháp lý & sở hữu website Inviwedd.
 * Tuân thủ quy định thông báo website thương mại điện tử bán hàng với Bộ Công Thương
 * theo Nghị định 52/2013/NĐ-CP và Nghị định 85/2021/NĐ-CP.
 */

export interface LegalInfo {
  brandName: string;
  ownerName: string;
  email: string;
  hotline: string;
  hotlineHref: string;
  address: string;
  taxId?: string;
  businessLicense?: string;
  moitBadgeUrl?: string;
  moitRegistrationUrl?: string;
  effectiveDate: string;
  serviceType: string;
  operatingHours: string;
}

export const LEGAL_INFO: LegalInfo = {
  brandName: "Inviwedd",
  ownerName: "Tôn Long Thuận",
  email: "support@inviwedd.date",
  hotline: "0902 955 594",
  hotlineHref: "tel:0902955594",
  address: "TP. Hồ Chí Minh, Việt Nam",
  taxId: "", // Điền mã số thuế khi có Giấy phép / MST chính thức
  businessLicense: "", // Điền số đăng ký kinh doanh khi có
  moitBadgeUrl: "", // Logo "Đã thông báo Bộ Công Thương" khi hoàn tất duyệt
  moitRegistrationUrl: "", // Link xác nhận trên online.gov.vn
  effectiveDate: "20/11/2026",
  serviceType: "Nền tảng thiệp cưới điện tử trực tuyến (SaaS)",
  operatingHours: "08:30 – 21:00 (Thứ Hai – Chủ Nhật, hỗ trợ trực tuyến 24/7)",
};

export interface LegalPolicyMeta {
  slug: string;
  href: string;
  title: string;
  shortTitle: string;
  navTitle: string;
  description: string;
}

export const LEGAL_POLICIES: readonly LegalPolicyMeta[] = [
  {
    slug: "dieu-khoan-su-dung",
    href: "/chinh-sach/dieu-khoan-su-dung",
    title: "Điều khoản sử dụng & Quy trình giao dịch",
    shortTitle: "Điều khoản sử dụng",
    navTitle: "1. Điều khoản sử dụng",
    description:
      "Quy định sử dụng dịch vụ thiệp cưới điện tử Inviwedd, quy trình giao dịch 4 bước và quyền nghĩa vụ của các bên.",
  },
  {
    slug: "thanh-toan",
    href: "/chinh-sach/thanh-toan",
    title: "Chính sách thanh toán",
    shortTitle: "Chính sách thanh toán",
    navTitle: "2. Chính sách thanh toán",
    description:
      "Quy định hình thức chuyển khoản VietQR tự động qua cổng payOS, xác nhận kích hoạt trong 1–3 giây.",
  },
  {
    slug: "cung-cap-dich-vu",
    href: "/chinh-sach/cung-cap-dich-vu",
    title: "Chính sách cung cấp dịch vụ",
    shortTitle: "Chính sách cung cấp dịch vụ",
    navTitle: "3. Cung cấp dịch vụ",
    description:
      "Quy định về thời gian kích hoạt, phương thức bàn giao phần mềm trực tuyến (SaaS) và thời hạn lưu trữ thiệp cưới.",
  },
  {
    slug: "doi-tra-hoan-tien",
    href: "/chinh-sach/doi-tra-hoan-tien",
    title: "Chính sách đổi trả & Hoàn tiền",
    shortTitle: "Chính sách hoàn tiền",
    navTitle: "4. Đổi trả & Hoàn tiền",
    description:
      "Điều kiện, trường hợp hoàn tiền 100% khi có sự cố kỹ thuật và quy trình xử lý hoàn trả trong 3–5 ngày làm việc.",
  },
  {
    slug: "bao-mat",
    href: "/chinh-sach/bao-mat",
    title: "Chính sách bảo mật thông tin cá nhân",
    shortTitle: "Chính sách bảo mật",
    navTitle: "5. Chính sách bảo mật",
    description:
      "Cam kết bảo vệ dữ liệu khách hàng theo 7 mục bắt buộc của Nghị định 52/2013/NĐ-CP và Nghị định 85/2021/NĐ-CP.",
  },
] as const;
