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
    lunarDate: "Ngày 13 tháng 02 năm Đinh Mùi",
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
    lunarDate: "Ngày 13 tháng 02 năm Đinh Mùi",
    venueName: "Gem Center — Sảnh Pollux Ballroom",
    venueAddress: "08 Nguyễn Bỉnh Khiêm, Đa Kao, Quận 1, TP. Hồ Chí Minh",
    mapEmbedUrl: null,
    mapDirectionsUrl:
      "https://www.google.com/maps/search/?api=1&query=08+Nguyen+Binh+Khiem+Quan+1+Ho+Chi+Minh",
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

const DEMO_PORTRAITS: WeddingPhoto[] = [
  { id: "demo-groom", kind: "couple", url: "/photos/portrait_cr.webp", position: 0 },
  { id: "demo-bride", kind: "couple", url: "/photos/portrait_cd.webp", position: 1 },
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
  "basic-1": {
    plan: "free",
    heroUrl: "/photos/hero2.webp",
    eyebrow: "Save The Date",
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
  "basic-2": {
    plan: "free",
    heroUrl: "/photos/1.webp",
    eyebrow: "Wedding Invitation",
    heroSubtitle: "Hân hạnh đón tiếp trong ngày chung đôi",
    defaultGuestName: "Anh Hoàng Long",
    thankYouBody:
      "Cảm ơn bạn đã dành thời gian quý báu đến chúc phúc cho Gia Huy & Ngọc Hân.",
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
  "basic-3": {
    plan: "free",
    heroUrl: "/photos/3.webp",
    eyebrow: "Sunset Vows",
    heroSubtitle: "Hân hạnh đón tiếp trong buổi chiều chung vui",
    defaultGuestName: "Chị Minh Châu",
    thankYouBody:
      "Hạnh phúc trọn vẹn hơn khi có sự chứng kiến và yêu thương của bạn trong buổi chiều hoàng hôn.",
    content: {
      couple: {
        groomName: "Hoàng Việt",
        brideName: "Khánh Linh",
        groomFullName: "Phạm Hoàng Việt",
        brideFullName: "Vũ Khánh Linh",
        groomParents: "Ông Phạm Đình Trung & Bà Đỗ Minh Phương",
        brideParents: "Ông Vũ Mạnh Hùng & Bà Hoàng Lan Chi",
      },
      date: "2027-03-20T10:00:00+07:00",
      quote:
        "Dưới ánh hoàng hôn rực rỡ nhất, chúng ta nắm tay nhau viết tiếp chương mới cuộc đời.",
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
  "pro-1": {
    plan: "pro",
    heroUrl: "/photos/5.webp",
    eyebrow: "Evening Gala",
    heroSubtitle: "Trân trọng đón tiếp trong đêm tiệc thành hôn ánh kim",
    defaultGuestName: "Quý Khách Danh Dự",
    thankYouBody:
      "Sự hiện diện trân quý của Quý vị là niềm vinh hạnh lớn lao đối với gia đình chúng tôi.",
    content: {
      couple: {
        groomName: "Tuấn Kiệt",
        brideName: "Lan Anh",
        groomFullName: "Hồ Tuấn Kiệt",
        brideFullName: "Ngô Lan Anh",
        groomParents: "Ông Hồ Quốc Cường & Bà Nguyễn Kim Liên",
        brideParents: "Ông Ngô Trọng Nhân & Bà Bùi Thanh Tâm",
      },
      date: "2027-03-20T10:00:00+07:00",
      quote:
        "Giữa muôn ngàn ánh đèn đêm tiệc, khoảnh khắc rực rỡ nhất là lời hẹn ước trọn đời bên nhau.",
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
};

const NEW_TEMPLATE_DEMO_COUPLES: Record<
  string,
  { groomName: string; brideName: string; groomFullName: string; brideFullName: string }
> = {
  "flowery-white": {
    groomName: "Văn Long",
    brideName: "Thu Hà",
    groomFullName: "Hoàng Văn Long",
    brideFullName: "Nguyễn Thị Thu Hà",
  },
  "minimal-brown": {
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
  "do-truyen-thong": {
    groomName: "Gia Khánh",
    brideName: "Quỳnh Anh",
    groomFullName: "Phan Gia Khánh",
    brideFullName: "Phạm Quỳnh Anh",
  },
  "do-may-man": {
    groomName: "Hoàng Long",
    brideName: "Bảo Ngọc",
    groomFullName: "Đặng Hoàng Long",
    brideFullName: "Vũ Bảo Ngọc",
  },
  "xanh-tu-do": {
    groomName: "Minh Quân",
    brideName: "Thanh Hà",
    groomFullName: "Nguyễn Minh Quân",
    brideFullName: "Lê Thanh Hà",
  },
  "do-mix-xanh": {
    groomName: "Đức Anh",
    brideName: "Mai Linh",
    groomFullName: "Trần Đức Anh",
    brideFullName: "Phạm Mai Linh",
  },
  "nau-toi-gian": {
    groomName: "Hoàng Nam",
    brideName: "Thảo Vy",
    groomFullName: "Nguyễn Hoàng Nam",
    brideFullName: "Trần Thảo Vy",
  },
  "anh-dao-hong": {
    groomName: "Minh Khang",
    brideName: "Nhã Phương",
    groomFullName: "Vũ Minh Khang",
    brideFullName: "Trần Nhã Phương",
  },
  "bach-su-do": {
    groomName: "Văn Hùng",
    brideName: "Khánh Chi",
    groomFullName: "Nguyễn Văn Hùng",
    brideFullName: "Lê Khánh Chi",
  },
  "bach-su-nau": {
    groomName: "Trọng Hiếu",
    brideName: "Thục Quyên",
    groomFullName: "Đặng Trọng Hiếu",
    brideFullName: "Hoàng Thục Quyên",
  },
  "chibi-red": {
    groomName: "Huy Tuấn",
    brideName: "Trúc Ly",
    groomFullName: "Trần Huy Tuấn",
    brideFullName: "Phạm Trúc Ly",
  },
  "hoa-moc-nau": {
    groomName: "Quang Minh",
    brideName: "Yến Nhi",
    groomFullName: "Lý Quang Minh",
    brideFullName: "Đỗ Yến Nhi",
  },
  "hoang-kim-do": {
    groomName: "Hoàng Nam",
    brideName: "Kim Oanh",
    groomFullName: "Vũ Hoàng Nam",
    brideFullName: "Nguyễn Kim Oanh",
  },
  "long-phung-v2-do": {
    groomName: "Trung Hiếu",
    brideName: "Minh Nguyệt",
    groomFullName: "Trần Trung Hiếu",
    brideFullName: "Lê Minh Nguyệt",
  },
  "mai-lan-xanh": {
    groomName: "Quốc Bảo",
    brideName: "Tuệ Anh",
    groomFullName: "Phạm Quốc Bảo",
    brideFullName: "Võ Tuệ Anh",
  },
  "ren-theu-trang": {
    groomName: "Anh Tuấn",
    brideName: "Thu Hà",
    groomFullName: "Đinh Anh Tuấn",
    brideFullName: "Bùi Thu Hà",
  },
  "song-hy-v2-do": {
    groomName: "Đức Trí",
    brideName: "Mai Phương",
    groomFullName: "Trịnh Đức Trí",
    brideFullName: "Lâm Mai Phương",
  },
  "song-phung-xanh": {
    groomName: "Bảo Long",
    brideName: "Phượng Uyên",
    groomFullName: "Phan Bảo Long",
    brideFullName: "Ngô Phượng Uyên",
  },
  "to-duyen-do-dam": {
    groomName: "Minh Hoàng",
    brideName: "Mỹ Ngọc",
    groomFullName: "Phạm Minh Hoàng",
    brideFullName: "Hồ Mỹ Ngọc",
  },
  "to-duyen-hong": {
    groomName: "Hồng Phúc",
    brideName: "Kim Ngân",
    groomFullName: "Dương Hồng Phúc",
    brideFullName: "Tạ Kim Ngân",
  },
  "vuon-xuan-do": {
    groomName: "Đức Anh",
    brideName: "Ngọc Linh",
    groomFullName: "Lê Đức Anh",
    brideFullName: "Trần Ngọc Linh",
  },
  "vuon-xuan-xanh": {
    groomName: "Thanh Tùng",
    brideName: "Mai Chi",
    groomFullName: "Nguyễn Thanh Tùng",
    brideFullName: "Vũ Mai Chi",
  },
  "vuonkinh-xanh-nhat": {
    groomName: "Minh Tuấn",
    brideName: "Lan Anh",
    groomFullName: "Đào Minh Tuấn",
    brideFullName: "Hoàng Lan Anh",
  },
  "vuonkinh-xanh": {
    groomName: "Quang Huy",
    brideName: "Thảo Vy",
    groomFullName: "Trần Quang Huy",
    brideFullName: "Lê Thảo Vy",
  },
};

export function getDemoTemplateData(
  templateId?: TemplateId | string,
): TemplateData {
  const meta = templateId ? getTemplateMeta(templateId) : undefined;
  const newCouple = templateId ? NEW_TEMPLATE_DEMO_COUPLES[templateId] : undefined;

  let preset: DemoPreset;
  let resolvedKey = "basic-1";

  if (templateId && DEMO_PRESETS[templateId]) {
    resolvedKey = templateId;
    preset = DEMO_PRESETS[templateId];
  } else if (newCouple && meta) {
    resolvedKey = meta.id;
    preset = {
      plan: "free",
      heroUrl: "/photos/hero2.webp",
      eyebrow: meta.subtitle,
      heroSubtitle: meta.description,
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
    preset = DEMO_PRESETS["basic-1"];
  }

  const uniqueGalleryPhotos = DEMO_GALLERY_PHOTOS.filter(
    (p) => p.url !== preset.heroUrl,
  );

  const photos: WeddingPhoto[] = [
    { id: "demo-hero", kind: "banner", url: preset.heroUrl, position: 0 },
    ...DEMO_PORTRAITS,
    ...DEMO_GIFT_QR_PHOTOS,
    ...uniqueGalleryPhotos,
  ];

  return toTemplateData({
    templateId: resolvedKey,
    plan: preset.plan,
    content: preset.content,
    events: DEMO_EVENTS,
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
