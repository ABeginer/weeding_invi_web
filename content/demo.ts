import { CANONICAL_SECTION_ORDER } from "@/config/template-sections";
import type {
  TemplateData,
  WeddingContent,
  WeddingEvent,
  WeddingPhoto,
  WeddingPlan,
} from "@/lib/types";
import { toTemplateData } from "@/lib/wedding-data";
import { getTemplateMeta } from "@/templates/registry";
import type { TemplateId } from "@/templates/types";

const DEMO_EVENTS: WeddingEvent[] = [
  {
    id: "demo-event-1",
    title: "Lễ Thành Hôn",
    startsAt: "2027-03-20T10:00:00+07:00",
    lunarDate: "13 tháng 02 năm Đinh Mùi",
    venueName: "Gem Center — Sảnh Saltus (Tầng 3)",
    venueAddress: "08 Nguyễn Bỉnh Khiêm, Đa Kao, Quận 1, TP. Hồ Chí Minh",
    mapEmbedUrl: null,
    mapDirectionsUrl:
      "https://www.google.com/maps/search/?api=1&query=08+Nguyen+Binh+Khiem+Quan+1+Ho+Chi+Minh",
    position: 0,
  },
  {
    id: "demo-event-2",
    title: "Tiệc Mừng Cưới",
    startsAt: "2027-03-20T18:00:00+07:00",
    lunarDate: "13 tháng 02 năm Đinh Mùi",
    venueName: "Gem Center — Sảnh Pollux Ballroom",
    venueAddress: "08 Nguyễn Bỉnh Khiêm, Đa Kao, Quận 1, TP. Hồ Chí Minh",
    mapEmbedUrl: null,
    mapDirectionsUrl:
      "https://www.google.com/maps/search/?api=1&query=08+Nguyen+Binh+Khiem+Quan+1+Ho+Chi+Minh",
    position: 1,
  },
];

const SEN_NGOC_EVENTS: WeddingEvent[] = [
  {
    id: "sn-event-1",
    title: "Lễ Thành Hôn",
    startsAt: "2031-07-15T09:30:00+07:00",
    lunarDate: "26 tháng 05 năm Tân Hợi",
    venueName: "Hôn lễ được cử hành tại",
    venueAddress: "Tư Gia Nhà Trai",
    mapEmbedUrl: null,
    mapDirectionsUrl: "https://www.google.com/maps/search/?api=1&query=Tu+Gia+Nha+Trai",
    position: 0,
  },
  {
    id: "sn-event-2",
    title: "Lễ Vu Quy",
    startsAt: "2031-07-15T09:30:00+07:00",
    lunarDate: "26 tháng 05 năm Tân Hợi",
    venueName: "Hôn lễ được cử hành tại",
    venueAddress: "Tư Gia Nhà Gái",
    mapEmbedUrl: null,
    mapDirectionsUrl: "https://www.google.com/maps/search/?api=1&query=Tu+Gia+Nha+Gai",
    position: 1,
  },
];

const DEMO_GALLERY_PHOTOS: WeddingPhoto[] = [
  { id: "demo-gal-1", kind: "gallery", url: "/photos/1.webp", position: 0 },
  { id: "demo-gal-2", kind: "gallery", url: "/photos/2.webp", position: 1 },
  { id: "demo-gal-3", kind: "gallery", url: "/photos/3.webp", position: 2 },
  { id: "demo-gal-4", kind: "gallery", url: "/photos/4.webp", position: 3 },
  { id: "demo-gal-5", kind: "gallery", url: "/photos/5.webp", position: 4 },
  { id: "demo-gal-6", kind: "gallery", url: "/photos/6.webp", position: 5 },
];

const LONG_PHUNG_GALLERY_PHOTOS: WeddingPhoto[] = [
  { id: "demo-gal-lp-1", kind: "gallery", url: "/photos/long-phung-1.webp", position: 0 },
  { id: "demo-gal-lp-2", kind: "gallery", url: "/photos/long-phung-2.webp", position: 1 },
  { id: "demo-gal-lp-3", kind: "gallery", url: "/photos/long-phung-3.webp", position: 2 },
];

const HONGKONG_GALLERY_PHOTOS: WeddingPhoto[] = [
  { id: "demo-gal-hk-1", kind: "gallery", url: "/demo/hongkong/04_album_mercedes_couple.webp", position: 0 },
  { id: "demo-gal-hk-2", kind: "gallery", url: "/demo/hongkong/05_album_hotel_corridor.webp", position: 1 },
  { id: "demo-gal-hk-3", kind: "gallery", url: "/demo/hongkong/06_album_crimson_lounge_toast.webp", position: 2 },
  { id: "demo-gal-hk-4", kind: "gallery", url: "/demo/hongkong/07_album_neon_street_walk.webp", position: 3 },
  { id: "demo-gal-hk-5", kind: "gallery", url: "/demo/hongkong/08_album_rain_umbrella_closeup.webp", position: 4 },
];

const SEN_NGOC_GALLERY_PHOTOS: WeddingPhoto[] = [
  { id: "demo-gal-sn-1", kind: "gallery", url: "/demo/sen-ngoc-tram-nam/04_album_1.webp", position: 0 },
  { id: "demo-gal-sn-2", kind: "gallery", url: "/demo/sen-ngoc-tram-nam/05_album_2.webp", position: 1 },
  { id: "demo-gal-sn-3", kind: "gallery", url: "/demo/sen-ngoc-tram-nam/06_album_3.webp", position: 2 },
  { id: "demo-gal-sn-4", kind: "gallery", url: "/demo/sen-ngoc-tram-nam/07_album_4.webp", position: 3 },
  { id: "demo-gal-sn-5", kind: "gallery", url: "/demo/sen-ngoc-tram-nam/08_album_5.webp", position: 4 },
];

const DEMO_PORTRAITS: WeddingPhoto[] = [
  { id: "demo-groom", kind: "couple", url: "/photos/portrait_cr.webp", position: 0 },
  { id: "demo-bride", kind: "couple", url: "/photos/portrait_cd.webp", position: 1 },
];

const HONGKONG_PORTRAITS: WeddingPhoto[] = [
  { id: "demo-groom", kind: "couple", url: "/demo/hongkong/02_groom_solo_mercedes.webp", position: 0 },
  { id: "demo-bride", kind: "couple", url: "/demo/hongkong/03_bride_solo_neon_lounge.webp", position: 1 },
];

const SEN_NGOC_PORTRAITS: WeddingPhoto[] = [
  { id: "demo-groom", kind: "couple", url: "/demo/sen-ngoc-tram-nam/02_groom.webp", position: 0 },
  { id: "demo-bride", kind: "couple", url: "/demo/sen-ngoc-tram-nam/03_bride.webp", position: 1 },
];

const DEMO_GIFT_QR_PHOTOS: WeddingPhoto[] = [
  { id: "demo-gift-groom", kind: "gift", url: "/images/gift-qr.png", position: 0 },
  { id: "demo-gift-bride", kind: "gift", url: "/images/gift-qr.png", position: 1 },
];

interface DemoPreset {
  plan: WeddingPlan;
  content: WeddingContent;
  heroUrl: string;
  eyebrow: string;
  heroSubtitle: string;
  defaultGuestName: string;
  thankYouBody: string;
}

const DEMO_PRESETS: Record<string, DemoPreset> = {
  "vuon-o-liu": {
    plan: "free",
    heroUrl: "/photos/hero2.webp",
    eyebrow: "Thiệp mời tham dự lễ cưới",
    heroSubtitle: "Hân hạnh đón tiếp trong ngày chung đôi",
    defaultGuestName: "Bạn Thanh Mai",
    thankYouBody:
      "Cảm ơn sự yêu thương, hiện diện và chúc phúc của bạn dành cho Minh Khôi & Thảo Nguyên.",
    content: {
      couple: {
        groomName: "Minh Khôi",
        brideName: "Thảo Nguyên",
        groomFullName: "Nguyễn Minh Khôi",
        brideFullName: "Trần Thảo Nguyên",
        groomParents: "Ông Nguyễn Quốc Bảo & Bà Lê Thu Hà",
        brideParents: "Ông Trần Hải Đăng & Bà Phạm Thanh Xuân",
      },
      date: "2027-03-20T10:00:00+07:00",
      quote:
        "Giữa muôn ngàn ngã rẽ của cuộc đời, điều bình yên nhất là hai ta chọn đi cùng nhau tới suốt chặng đường sau.",
      heroPhotoId: "demo-hero",
      groomPhotoId: "demo-groom",
      bridePhotoId: "demo-bride",
      gift: {
        groomBankName: "",
        groomAccountName: "",
        groomAccountNumber: "",
        brideBankName: "",
        brideAccountName: "",
        brideAccountNumber: "",
      },
    },
  },
  "bach-lan-lua-nga": {
    plan: "free",
    heroUrl: "/photos/1.webp",
    eyebrow: "Thiệp mời tham dự lễ cưới",
    heroSubtitle: "Hân hạnh đón tiếp trong ngày chung đôi",
    defaultGuestName: "Quý Khách Quý Mến",
    thankYouBody:
      "Cảm ơn Quý khách đã dành thời gian sẻ chia niềm vui cùng chúng tôi.",
    content: {
      couple: {
        groomName: "Gia Huy",
        brideName: "Ngọc Hân",
        groomFullName: "Lê Gia Huy",
        brideFullName: "Đoàn Ngọc Hân",
        groomParents: "Ông Lê Quang Minh & Bà Vũ Thu Thủy",
        brideParents: "Ông Đoàn Hữu Nghĩa & Bà Trần Bích Ngọc",
      },
      date: "2027-03-20T10:00:00+07:00",
      quote:
        "Hạnh phúc không nằm ở những điều lớn lao, mà ở từng buổi sáng bình yên khi có nhau.",
      heroPhotoId: "demo-hero",
      groomPhotoId: "demo-groom",
      bridePhotoId: "demo-bride",
      gift: {
        groomBankName: "",
        groomAccountName: "",
        groomAccountNumber: "",
        brideBankName: "",
        brideAccountName: "",
        brideAccountNumber: "",
      },
    },
  },
  "rang-hong-hoang-hon": {
    plan: "free",
    heroUrl: "/photos/3.webp",
    eyebrow: "Thiệp mời tham dự lễ cưới",
    heroSubtitle: "Dưới ráng chiều dịu ngọt, mình chung một mái nhà",
    defaultGuestName: "Chị Minh Châu",
    thankYouBody:
      "Sự hiện diện và nụ cười của bạn là món quà trân quý nhất với chúng mình.",
    content: {
      couple: {
        groomName: "Hoàng Việt",
        brideName: "Khánh Linh",
        groomFullName: "Phạm Hoàng Việt",
        brideFullName: "Vũ Khánh Linh",
        groomParents: "Ông Phạm Đình Trung & Bà Đỗ Minh Phương",
        brideParents: "Ông Vũ Mạnh Hùng & Bà Hoàng Lan Chi",
      },
      date: "2027-03-20T17:30:00+07:00",
      quote:
        "Dưới ráng chiều dịu ngọt, chúng ta nắm tay nhau viết tiếp câu chuyện tình yêu bền lâu.",
      heroPhotoId: "demo-hero",
      groomPhotoId: "demo-groom",
      bridePhotoId: "demo-bride",
      gift: {
        groomBankName: "",
        groomAccountName: "",
        groomAccountNumber: "",
        brideBankName: "",
        brideAccountName: "",
        brideAccountNumber: "",
      },
    },
  },
  "long-phung": {
    plan: "free",
    heroUrl: "/photos/long-phung-hero.webp",
    eyebrow: "Thiệp mời tham dự lễ cưới",
    heroSubtitle: "Hân hạnh đón tiếp trong ngày chung đôi",
    defaultGuestName: "Quý Khách Quý Mến",
    thankYouBody:
      "Cảm ơn sự yêu thương, hiện diện và chúc phúc của bạn dành cho Hoài Nam & Ngọc Linh.",
    content: {
      couple: {
        groomName: "Hoài Nam",
        brideName: "Ngọc Linh",
        groomFullName: "Phan Hoài Nam",
        brideFullName: "Lê Ngọc Linh",
        groomParents: "Ông Phan Đình Trọng & Bà Lê Thị Mai",
        brideParents: "Ông Lê Văn Hùng & Bà Trần Thị Cúc",
      },
      date: "2027-03-20T10:00:00+07:00",
      quote:
        "Rồng chầu phượng múa kết duyên lành, trăm năm gắn bó nghĩa tình sắt son.",
      heroPhotoId: "demo-hero",
      groomPhotoId: "demo-groom",
      bridePhotoId: "demo-bride",
      gift: {
        groomBankName: "",
        groomAccountName: "",
        groomAccountNumber: "",
        brideBankName: "",
        brideAccountName: "",
        brideAccountNumber: "",
      },
    },
  },
  "sen-ngoc-tram-nam": {
    plan: "pro",
    heroUrl: "/demo/sen-ngoc-tram-nam/01_main.webp",
    eyebrow: "Ngày Chung Đôi",
    heroSubtitle: "Hân hạnh đón tiếp trong ngày chung đôi",
    defaultGuestName: "Anh Ngọ & Chị Dần",
    thankYouBody:
      "Chân thành cám ơn sự yêu thương và hiện diện của Quý vị.",
    content: {
      couple: {
        groomName: "Bá Long",
        brideName: "Thúy Vy",
        groomFullName: "Nguyễn Bá Long",
        brideFullName: "Đinh Thúy Vy",
        groomParents: "Ông Nguyễn Văn Tèo\nBà Nguyễn Thị Nở\n1900 Ao Đôi, Bình Hưng Hòa, TP. HCM",
        brideParents: "Ông Đỗ Văn Tý\nBà Nguyễn Thị Mùi\n50 Đinh Tiên Hoàng, Hàng Buồm, Hà Nội",
      },
      date: "2036-11-25T09:30:00+07:00",
      quote:
        "Đến tham dự buổi tiệc thân mật chung vui cùng gia đình chúng tôi",
      heroPhotoId: "demo-hero",
      groomPhotoId: "demo-groom",
      bridePhotoId: "demo-bride",
      gift: {
        groomBankName: "Vietcombank",
        groomAccountName: "NGUYEN BA LONG",
        groomAccountNumber: "1029384756",
        brideBankName: "Techcombank",
        brideAccountName: "DINH THUY VY",
        brideAccountNumber: "1902837465",
      },
    },
  },
};

const NEW_TEMPLATE_DEMO_COUPLES: Record<
  string,
  {
    groomName: string;
    brideName: string;
    groomFullName: string;
    brideFullName: string;
    story?: Array<{ year: string; title: string; content: string }>;
  }
> = {
  "flowery-white": {
    groomName: "Văn Long",
    brideName: "Thu Hà",
    groomFullName: "Hoàng Văn Long",
    brideFullName: "Nguyễn Thị Thu Hà",
  },
  "moc-huong-nang-thu": {
    groomName: "Đăng Khoa",
    brideName: "Mỹ Duyên",
    groomFullName: "Trần Đăng Khoa",
    brideFullName: "Nguyễn Mỹ Duyên",
  },
  "minimal-red": {
    groomName: "Quốc Anh",
    brideName: "Cát Tường",
    groomFullName: "Phan Quốc Anh",
    brideFullName: "Lê Thị Cát Tường",
  },
  "do-ruou-vang": {
    groomName: "Duy Khang",
    brideName: "Thu Hà",
    groomFullName: "Lý Duy Khang",
    brideFullName: "Phan Thu Hà",
  },
  "long-phung": {
    groomName: "Hoài Nam",
    brideName: "Ngọc Linh",
    groomFullName: "Phan Hoài Nam",
    brideFullName: "Lê Ngọc Linh",
  },
  "chu-sa-long-phung": {
    groomName: "Quang Khải",
    brideName: "Thanh Uyên",
    groomFullName: "Hoàng Quang Khải",
    brideFullName: "Trần Thanh Uyên",
  },
  "bich-ngoc-hoang-trieu": {
    groomName: "Quốc Đạt",
    brideName: "Khánh Huyền",
    groomFullName: "Trần Quốc Đạt",
    brideFullName: "Nguyễn Khánh Huyền",
  },
  "rang-hong-hoang-hon": {
    groomName: "Hoàng Việt",
    brideName: "Khánh Linh",
    groomFullName: "Phạm Hoàng Việt",
    brideFullName: "Vũ Khánh Linh",
  },
  "long-phung-ep4": {
    groomName: "Bảo Long",
    brideName: "Thanh Phụng",
    groomFullName: "Nguyễn Bảo Long",
    brideFullName: "Trần Thanh Phụng",
  },
  "bach-nguyet": {
    groomName: "Minh Quân",
    brideName: "Bạch Nguyệt",
    groomFullName: "Lê Minh Quân",
    brideFullName: "Nguyễn Bạch Nguyệt",
  },
  "lam-hoa-vien": {
    groomName: "Quang Huy",
    brideName: "Thanh Trúc",
    groomFullName: "Trần Quang Huy",
    brideFullName: "Lê Thanh Trúc",
  },
  "bach-tra-suong-mai": {
    groomName: "Đức Minh",
    brideName: "Ngọc Trà",
    groomFullName: "Lê Đức Minh",
    brideFullName: "Trần Ngọc Trà",
  },
  "song-hac-kim-van": {
    groomName: "Quốc Thái",
    brideName: "Huyền Trang",
    groomFullName: "Nguyễn Quốc Thái",
    brideFullName: "Phan Huyền Trang",
  },
  "hac-vu-luu-ly": {
    groomName: "Minh Triết",
    brideName: "Lưu Ly",
    groomFullName: "Lê Minh Triết",
    brideFullName: "Trần Lưu Ly",
  },
  "diem-phan-kim-to": {
    groomName: "Gia Hưng",
    brideName: "Uyển Nhi",
    groomFullName: "Vũ Gia Hưng",
    brideFullName: "Đỗ Uyển Nhi",
  },
  "phi-thuy-dong-duong": {
    groomName: "Thế Vinh",
    brideName: "Khánh Linh",
    groomFullName: "Lâm Thế Vinh",
    brideFullName: "Hoàng Khánh Linh",
  },
  "ho-phach-mat-thu": {
    groomName: "Huy Hoàng",
    brideName: "Thùy Dung",
    groomFullName: "Vũ Huy Hoàng",
    brideFullName: "Trần Thùy Dung",
  },
  "lam-tu-ngoc-suong": {
    groomName: "Minh Quân",
    brideName: "Ngọc Sương",
    groomFullName: "Lê Minh Quân",
    brideFullName: "Đặng Ngọc Sương",
  },
  "tu-dang-da-khuc": {
    groomName: "Đăng Khoa",
    brideName: "Dạ Thảo",
    groomFullName: "Nguyễn Đăng Khoa",
    brideFullName: "Trần Dạ Thảo",
  },
  "huyen-kim-long-phung": {
    groomName: "Long Vũ",
    brideName: "Phụng Hoàng",
    groomFullName: "Lê Long Vũ",
    brideFullName: "Nguyễn Phụng Hoàng",
  },
  "hac-kim-nhat-thuc": {
    groomName: "Nhật Minh",
    brideName: "Kim Cương",
    groomFullName: "Trần Nhật Minh",
    brideFullName: "Vũ Kim Cương",
  },
  "da-yen-pha-le": {
    groomName: "Minh Quân",
    brideName: "Diễm Quỳnh",
    groomFullName: "Lý Minh Quân",
    brideFullName: "Trịnh Diễm Quỳnh",
  },
  "mac-lam-kim-tuyen": {
    groomName: "Hoàng Bách",
    brideName: "Khánh Linh",
    groomFullName: "Vũ Hoàng Bách",
    brideFullName: "Đỗ Khánh Linh",
  },
  "anh-dao-phan-tuyet": {
    groomName: "Nhật Minh",
    brideName: "Hạ Băng",
    groomFullName: "Vũ Nhật Minh",
    brideFullName: "Đặng Hạ Băng",
  },
  "do-truyen-thong": {
    groomName: "Gia Khánh",
    brideName: "Quỳnh Anh",
    groomFullName: "Phan Gia Khánh",
    brideFullName: "Phạm Quỳnh Anh",
  },
  "yen-chi-mau-don": {
    groomName: "Hoàng Long",
    brideName: "Bảo Ngọc",
    groomFullName: "Đặng Hoàng Long",
    brideFullName: "Vũ Bảo Ngọc",
  },
  "nau-toi-gian": {
    groomName: "Hoàng Nam",
    brideName: "Thảo Vy",
    groomFullName: "Nguyễn Hoàng Nam",
    brideFullName: "Trần Thảo Vy",
  },
  "phuong-loan-gam-do": {
    groomName: "Trung Hiếu",
    brideName: "Minh Nguyệt",
    groomFullName: "Trần Trung Hiếu",
    brideFullName: "Lê Minh Nguyệt",
  },
  "thanh-mai-ngoc-lan": {
    groomName: "Quốc Bảo",
    brideName: "Tuệ Anh",
    groomFullName: "Phạm Quốc Bảo",
    brideFullName: "Võ Tuệ Anh",
  },
  "song-hy-v2-do": {
    groomName: "Đức Trí",
    brideName: "Mai Phương",
    groomFullName: "Trịnh Đức Trí",
    brideFullName: "Lâm Mai Phương",
  },
  "song-phung-bich-dao": {
    groomName: "Bảo Long",
    brideName: "Phượng Uyên",
    groomFullName: "Phan Bảo Long",
    brideFullName: "Ngô Phượng Uyên",
  },
  "to-hong-lua-tham": {
    groomName: "Minh Hoàng",
    brideName: "Mỹ Ngọc",
    groomFullName: "Phạm Minh Hoàng",
    brideFullName: "Hồ Mỹ Ngọc",
  },
  "vuonkinh-xanh": {
    groomName: "Quang Huy",
    brideName: "Thảo Vy",
    groomFullName: "Trần Quang Huy",
    brideFullName: "Lê Thảo Vy",
  },
  "ban-sac-huong-cang": {
    groomName: "Vĩnh Hưng",
    brideName: "Diễm My",
    groomFullName: "Tạ Vĩnh Hưng",
    brideFullName: "Trần Diễm My",
  },
  "cuu-long-hy-yen": {
    groomName: "Lôi Lạc",
    brideName: "Bạch Mai",
    groomFullName: "Lôi Lạc",
    brideFullName: "Trần Bạch Mai",
  },
  "da-anh-huong-cang": {
    groomName: "Triệu Vỹ",
    brideName: "Mạn Ngọc",
    groomFullName: "Lương Triệu Vỹ",
    brideFullName: "Trương Mạn Ngọc",
  },
  "hao-quang-huong-cang": {
    groomName: "Đức Hoa",
    brideName: "Gia Hân",
    groomFullName: "Lưu Đức Hoa",
    brideFullName: "Lý Gia Hân",
  },
  "huong-cang-dem-neon": {
    groomName: "Gia Vệ",
    brideName: "Nhã Kỳ",
    groomFullName: "Vương Gia Vệ",
    brideFullName: "Thư Nhã Kỳ",
  },
  "sen-ngoc-tram-nam": {
    groomName: "Bá Long",
    brideName: "Thúy Vy",
    groomFullName: "Nguyễn Bá Long",
    brideFullName: "Đinh Thúy Vy",
  },
  "mot-thoi-de-nho": {
    groomName: "Minh Quân",
    brideName: "Khánh Vân",
    groomFullName: "Nguyễn Minh Quân",
    brideFullName: "Trần Khánh Vân",
  },
  "nhat-ky-mua-yeu": {
    groomName: "Hoàng Nam",
    brideName: "Phương Anh",
    groomFullName: "Nguyễn Hoàng Nam",
    brideFullName: "Trần Phương Anh",
    story: [
      {
        year: "2021",
        title: "Trang nhật ký đầu tiên",
        content: "Cơn mưa chiều tháng Mười níu hai người xa lạ đứng chung mái hiên quán sách cũ, mở đầu cho những dòng viết tay còn dang dở.",
      },
      {
        year: "2023",
        title: "Cuộn phim mùa hạ",
        content: "Cùng nhau rong ruổi qua những cung đường đầy nắng gió, lưu lại từng bức ảnh Polaroid nhỏ xíu dán kín một góc bàn.",
      },
      {
        year: "2025",
        title: "Lời hẹn dưới ánh đèn vàng",
        content: "Chiếc nhẫn giản dị lồng vào tay trong buổi tối bình yên, khép lại những ngày chờ đợi để bước sang chương mới.",
      },
      {
        year: "2027",
        title: "Chung một mái nhà",
        content: "Gửi tấm thiệp nhỏ thay lời mời chân thành, mong được đón bạn đến chứng kiến ngày tụi mình chính thức về chung một nhà.",
      },
    ],
  },
};

DEMO_PRESETS["basic-1"] = DEMO_PRESETS["vuon-o-liu"];

export function getDemoTemplateData(
  templateId?: TemplateId | string,
): TemplateData {
  const meta = templateId ? getTemplateMeta(templateId) : undefined;
  const newCouple = templateId ? NEW_TEMPLATE_DEMO_COUPLES[templateId] : undefined;

  let preset: DemoPreset;
  let resolvedKey = "vuon-o-liu";

  if (templateId && DEMO_PRESETS[templateId]) {
    resolvedKey = templateId;
    preset = DEMO_PRESETS[templateId];
  } else if (newCouple && meta) {
    resolvedKey = meta.id;
    preset = {
      plan: meta.plan ?? "free",
      heroUrl: "/photos/hero2.webp",
      eyebrow: "Thiệp mời tham dự lễ cưới",
      heroSubtitle: "Hân hạnh đón tiếp trong ngày chung đôi",
      defaultGuestName: "Quý Khách Quý Mến",
      thankYouBody: `Cảm ơn sự yêu thương, hiện diện và chúc phúc của bạn dành cho ${newCouple.groomName} & ${newCouple.brideName}.`,
      content: {
        couple: {
          groomName: newCouple.groomName,
          brideName: newCouple.brideName,
          groomFullName: newCouple.groomFullName,
          brideFullName: newCouple.brideFullName,
          groomParents: "Ông Nguyễn Văn A & Bà Trần Thị B",
          brideParents: "Ông Lê Văn C & Bà Phạm Thị D",
        },
        date: "2027-03-20T10:00:00+07:00",
        quote:
          "Giữa muôn ngàn ngã rẽ của cuộc đời, điều bình yên nhất là hai ta chọn đi cùng nhau tới suốt chặng đường sau.",
        ...(newCouple.story ? { story: newCouple.story } : {}),
        heroPhotoId: "demo-hero",
        groomPhotoId: "demo-groom",
        bridePhotoId: "demo-bride",
        gift: {
          groomBankName: "",
          groomAccountName: "",
          groomAccountNumber: "",
          brideBankName: "",
          brideAccountName: "",
          brideAccountNumber: "",
        },
      },
    };
  } else {
    preset = DEMO_PRESETS["vuon-o-liu"];
  }

  const isHongKong =
    meta?.category === "hongkong" ||
    resolvedKey === "ban-sac-huong-cang" ||
    resolvedKey === "cuu-long-hy-yen" ||
    resolvedKey === "da-anh-huong-cang" ||
    resolvedKey === "hao-quang-huong-cang" ||
    resolvedKey === "huong-cang-dem-neon";

  const isSenNgoc =
    resolvedKey === "sen-ngoc-tram-nam" || templateId === "sen-ngoc-tram-nam";

  if (isHongKong) {
    preset = { ...preset, heroUrl: "/demo/hongkong/01_hero_neon_street.webp" };
  } else if (isSenNgoc) {
    preset = { ...preset, heroUrl: "/demo/sen-ngoc-tram-nam/01_main.webp", plan: "pro" };
  }

  const portraitsSource = isSenNgoc
    ? SEN_NGOC_PORTRAITS
    : isHongKong
      ? HONGKONG_PORTRAITS
      : DEMO_PORTRAITS;

  const gallerySource = isSenNgoc
    ? SEN_NGOC_GALLERY_PHOTOS
    : isHongKong
      ? HONGKONG_GALLERY_PHOTOS
      : resolvedKey === "long-phung" || resolvedKey === "chu-sa-long-phung" || resolvedKey === "bich-ngoc-hoang-trieu" || resolvedKey === "long-phung-ep4"
        ? LONG_PHUNG_GALLERY_PHOTOS
        : DEMO_GALLERY_PHOTOS;

  const uniqueGalleryPhotos = gallerySource.filter(
    (p) => p.url !== preset.heroUrl,
  );

  const photos: WeddingPhoto[] = [
    { id: "demo-hero", kind: "banner", url: preset.heroUrl, position: 0 },
    ...portraitsSource,
    ...DEMO_GIFT_QR_PHOTOS,
    ...uniqueGalleryPhotos,
  ];

  const effectivePlan: WeddingPlan = isSenNgoc ? "pro" : preset.plan;
  const demoSectionOrder =
    effectivePlan === "free"
      ? CANONICAL_SECTION_ORDER.filter((key) => key !== "story" && key !== "albumQr")
      : [...CANONICAL_SECTION_ORDER];

  return toTemplateData({
    weddingSlug: effectivePlan !== "free" ? `demo-${resolvedKey}` : undefined,
    templateId: resolvedKey,
    plan: effectivePlan,
    content: {
      ...preset.content,
      sectionOrder: demoSectionOrder,
    },
    events: isSenNgoc ? SEN_NGOC_EVENTS : DEMO_EVENTS,
    photos,
    musicOverrides: meta?.defaultMusic,
    uiOverrides: {
      eyebrow: preset.eyebrow,
      heroSubtitle: preset.heroSubtitle,
      defaultGuestName: preset.defaultGuestName,
      thankYouBody: preset.thankYouBody,
    },
  });
}
