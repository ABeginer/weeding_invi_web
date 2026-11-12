import type {
  TemplateData,
  WeddingContent,
  WeddingEvent,
  WeddingPhoto,
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
  { id: "demo-gal-1", kind: "gallery", url: "/photos/1.jpg", position: 0 },
  { id: "demo-gal-2", kind: "gallery", url: "/photos/2.jpg", position: 1 },
  { id: "demo-gal-3", kind: "gallery", url: "/photos/3.jpg", position: 2 },
  { id: "demo-gal-4", kind: "gallery", url: "/photos/4.jpg", position: 3 },
  { id: "demo-gal-5", kind: "gallery", url: "/photos/5.jpg", position: 4 },
  { id: "demo-gal-6", kind: "gallery", url: "/photos/6.jpg", position: 5 },
];

const DEMO_PORTRAITS: WeddingPhoto[] = [
  { id: "demo-groom", kind: "couple", url: "/photos/portrait_cr.jpg", position: 0 },
  { id: "demo-bride", kind: "couple", url: "/photos/portrait_cd.jpg", position: 1 },
];

interface DemoPreset {
  content: WeddingContent;
  heroUrl: string;
  eyebrow: string;
  heroSubtitle: string;
  defaultGuestName: string;
  thankYouBody: string;
}

const DEMO_PRESETS: Record<string, DemoPreset> = {
  "basic-1": {
    heroUrl: "/photos/hero2.jpg",
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
    },
  },
  "basic-2": {
    heroUrl: "/photos/1.jpg",
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
    },
  },
  "basic-3": {
    heroUrl: "/photos/3.jpg",
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
    },
  },
  "pro-1": {
    heroUrl: "/photos/5.jpg",
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
    },
  },
};

export function getDemoTemplateData(
  templateId?: TemplateId | string,
): TemplateData {
  const key = templateId && DEMO_PRESETS[templateId] ? templateId : "basic-1";
  const preset = DEMO_PRESETS[key];
  const meta = getTemplateMeta(key);

  const photos: WeddingPhoto[] = [
    { id: "demo-hero", kind: "banner", url: preset.heroUrl, position: 0 },
    ...DEMO_PORTRAITS,
    ...DEMO_GALLERY_PHOTOS,
  ];

  return toTemplateData({
    templateId: key,
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
