import type { WeddingContent } from "@/lib/types";
import type { TemplateId } from "@/templates/types";

const BASE_DEMO_CONTENT: WeddingContent = {
  groom: {
    name: "Chú rể",
    label: "CHÚ RỂ",
    shortName: "Minh Khôi",
    fullName: "Nguyễn Minh Khôi",
    parents: "Ông Nguyễn Quốc Bảo & Bà Lê Thu Hà",
    photo: "/photos/portrait_cr.jpg",
  },
  bride: {
    name: "Cô dâu",
    label: "CÔ DÂU",
    shortName: "Thảo Nguyên",
    fullName: "Trần Thảo Nguyên",
    parents: "Ông Trần Hải Đăng & Bà Phạm Thanh Xuân",
    photo: "/photos/portrait_cd.jpg",
  },
  families: {
    groom: {
      label: "NHÀ TRAI",
      parents: "Ông Nguyễn Quốc Bảo & Bà Lê Thu Hà",
      address: "180 Nguyễn Đình Chiểu, Quận 3, TP. Hồ Chí Minh",
    },
    bride: {
      label: "NHÀ GÁI",
      parents: "Ông Trần Hải Đăng & Bà Phạm Thanh Xuân",
      address: "72 Phan Xích Long, Phú Nhuận, TP. Hồ Chí Minh",
    },
  },
  date: "2027-03-20T11:00:00+07:00",
  quote:
    "Giữa muôn ngàn ngã rẽ của cuộc đời, điều bình yên nhất là hai ta chọn đi cùng nhau tới suốt chặng đường sau.",
  invitationNote:
    "Trân trọng kính mời bạn cùng gia đình đến tham dự buổi tiệc chung vui, nâng ly chúc phúc và lưu lại những khoảnh khắc đáng nhớ trong ngày cưới của chúng mình.",
  hero: {
    eyebrow: "Save The Date",
    subtitle: "Hân hạnh đón tiếp trong ngày chung đôi",
    coverImage: "/photos/hero2.jpg",
    coverAlt: "Ảnh cưới minh họa Minh Khôi và Thảo Nguyên",
  },
  envelope: {
    sealLabel: "K & N",
    invitePrefix: "Trân trọng kính mời",
    defaultGuestName: "Bạn Thanh Mai",
    tapHint: "Chạm để mở thiệp",
    subtitle: "Hân hạnh đón tiếp trong ngày chung đôi",
  },
  events: [
    {
      title: "Lễ Thành Hôn",
      time: "10:00",
      date: "2027-03-20T10:00:00+07:00",
      lunarDate: "Ngày 13 tháng 02 năm Đinh Mùi",
      venue: "Gem Center — Sảnh Saltus (Tầng 3)",
      address: "08 Nguyễn Bỉnh Khiêm, Đa Kao, Quận 1, TP. Hồ Chí Minh",
      mapDirectionsUrl:
        "https://www.google.com/maps/search/?api=1&query=08+Nguyen+Binh+Khiem+Quan+1+Ho+Chi+Minh",
    },
    {
      title: "Tiệc Mừng Cưới",
      time: "18:00",
      date: "2027-03-20T18:00:00+07:00",
      lunarDate: "Ngày 13 tháng 02 năm Đinh Mùi",
      venue: "Gem Center — Sảnh Pollux Ballroom",
      address: "08 Nguyễn Bỉnh Khiêm, Đa Kao, Quận 1, TP. Hồ Chí Minh",
      mapDirectionsUrl:
        "https://www.google.com/maps/search/?api=1&query=08+Nguyen+Binh+Khiem+Quan+1+Ho+Chi+Minh",
    },
  ],
  photos: [
    { src: "/photos/1.jpg", alt: "Khoảnh khắc nắm tay trong nắng chiều", width: 600, height: 900 },
    { src: "/photos/2.jpg", alt: "Dạo bước dưới hàng cây xanh mát", width: 600, height: 900 },
    { src: "/photos/3.jpg", alt: "Nụ cười rạng rỡ ngày chụp ảnh cưới", width: 600, height: 900 },
    { src: "/photos/4.jpg", alt: "Ánh nhìn dịu dàng bên khung cửa sổ", width: 600, height: 900 },
    { src: "/photos/5.jpg", alt: "Khoảnh khắc trao nhẫn hẹn ước", width: 600, height: 900 },
    { src: "/photos/6.jpg", alt: "Kỷ niệm hoàng hôn bên bờ biển", width: 600, height: 900 },
  ],
  music: {
    src: "/media/wedding.mp3",
    title: "Giai điệu ngày cưới",
  },
  autoScroll: {
    enabled: false,
    speedPxPerSec: 80,
    startDelayMs: 600,
  },
  gift: {
    eyebrow: "Quà Tặng Yêu Thương",
    title: "Hộp Mừng Cưới",
    subtitle:
      "Sự hiện diện của bạn là món quà trân quý nhất đối với hai gia đình. Nếu bạn ở xa muốn gửi tấm lòng mừng cưới, xin phép đón nhận thông tin mẫu bên dưới.",
    openButtonLabel: "Gửi mừng cưới",
    downloadLabel: "Lưu ảnh QR",
    items: [
      {
        label: "Mừng cưới Chú rể",
        qrImage: "/images/gift-qr.png",
        qrAlt: "Mã QR mẫu mừng cưới Chú rể",
        note: "Ngân hàng mẫu · 0000 1234 5678 · NGUYEN MINH KHOI",
        downloadFileName: "qr-mau-chu-re.png",
      },
      {
        label: "Mừng cưới Cô dâu",
        qrImage: "/images/gift-qr.png",
        qrAlt: "Mã QR mẫu mừng cưới Cô dâu",
        note: "Ngân hàng mẫu · 0000 8765 4321 · TRAN THAO NGUYEN",
        downloadFileName: "qr-mau-co-dau.png",
      },
    ],
  },
  sections: {
    familiesEyebrow: "Gia Đình Hai Bên",
    coupleEyebrow: "Cô Dâu & Chú Rể",
    invitationPrefix: "Trân trọng kính mời",
    defaultGuestName: "Bạn Thanh Mai",
    eventsEyebrow: "Thời Gian & Địa Điểm",
    eventsTitle: "Sự Kiện Trọng Đại",
    directionsButtonLabel: "CHỈ ĐƯỜNG",
    gallery: {
      eyebrow: "Album Ảnh Cưới",
      headingPrefix: "GOLDEN HOUR",
      headingItalic: "Of",
      headingSuffix: "LOVE",
      subtitle: "Chạm vào từng khoảnh khắc để xem phóng to và vuốt chuyển ảnh",
    },
    rsvpWish: {
      eyebrow: "Phản Hồi & Chúc Phúc",
      titlePersonal: "Xác Nhận Tham Dự & Gửi Lời Chúc",
      subtitlePersonal:
        "Vui lòng cho chúng mình biết bạn có thể thu xếp tham dự nhé. Bạn có thể đính kèm thêm lời chúc phúc ngay bên dưới.",
      titlePublic: "Gửi Lời Chúc Phúc",
      subtitlePublic:
        "Gửi đôi lời yêu thương để cùng lưu giữ những kỷ niệm đẹp nhất trong ngày cưới của chúng mình.",
      nameLabel: "Tên của bạn",
      namePlaceholder: "Nhập tên hoặc biệt danh của bạn",
      lockedNameHint: "Tên được điền tự động theo thiệp mời cá nhân của bạn",
      messageLabel: "Lời chúc dành cho cô dâu & chú rể (không bắt buộc)",
      messageLabelPublic: "Lời chúc dành cho cô dâu & chú rể",
      messagePlaceholder: "Viết lời chúc tốt đẹp của bạn tại đây...",
      acceptLabel: "Tôi sẽ tham dự",
      declineLabel: "Tiếc quá, mình bận mất rồi",
      submitWishLabel: "Gửi lời chúc",
      retryWishLabel: "Gửi lại lời chúc",
      acceptedMessage:
        "Cảm ơn bạn đã nhận lời! Chúng mình rất mong chờ được đón tiếp và nâng ly cùng bạn trong ngày vui.",
      declinedMessage:
        "Rất tiếc vì bạn chưa thể sắp xếp tham dự, nhưng tấm lòng của bạn luôn đáng quý với chúng mình!",
      wishAlsoSavedNote: "Lời chúc của bạn cũng đã được gửi tới cô dâu & chú rể.",
      wishOnlySuccessMessage:
        "Cảm ơn bạn thật nhiều! Lời chúc của bạn đã được gửi tới cô dâu & chú rể.",
      changeMindLabel: "Thay đổi lựa chọn hoặc gửi thêm lời chúc",
      sendAnotherWishLabel: "Gửi thêm lời chúc",
      keepPreviousLabel: "Giữ nguyên lựa chọn trước đó",
      currentAcceptedBadge: "Bạn đã xác nhận sẽ tham dự",
      currentDeclinedBadge: "Bạn đã báo bận không thể tham dự",
    },
    countdownEyebrow: "Cùng Đếm Ngược",
    countdownTitle: "Đến Ngày Chung Đôi",
    countdownFinished: "Lễ cưới đã diễn ra tốt đẹp",
    footer: {
      bannerImage: "/photos/2.jpg",
      bannerAlt: "Ảnh cưới cảm ơn Minh Khôi và Thảo Nguyên",
      showBannerNames: true,
      heading: "Thank You",
      thankYouTitle: "Trân Trọng Cảm Ơn",
      thankYouBody:
        "Cảm ơn sự yêu thương, hiện diện và chúc phúc của bạn dành cho Minh Khôi & Thảo Nguyên.",
      signature: "Minh Khôi ♥ Thảo Nguyên · 20.03.2027",
    },
    invalidInvite: {
      title: "Link thiệp không hợp lệ",
      description:
        "Rất tiếc, đường dẫn thiệp mời này không tồn tại hoặc đã thay đổi.",
      backHomeLabel: "Xem thiệp cưới chung",
    },
  },
  seo: {
    title: "Thiệp Cưới Minh Khôi & Thảo Nguyên · 20.03.2027",
    description:
      "Trân trọng kính mời bạn đến chung vui trong ngày lễ thành hôn của Minh Khôi & Thảo Nguyên.",
    ogImage: "/templates/basic-1/cover.webp",
  },
};

export function getDemoWeddingContent(templateId?: TemplateId | string): WeddingContent {
  switch (templateId) {
    case "basic-2":
      return {
        ...BASE_DEMO_CONTENT,
        groom: { ...BASE_DEMO_CONTENT.groom, shortName: "Gia Huy", fullName: "Lê Gia Huy" },
        bride: { ...BASE_DEMO_CONTENT.bride, shortName: "Ngọc Hân", fullName: "Đoàn Ngọc Hân" },
        envelope: {
          ...BASE_DEMO_CONTENT.envelope,
          sealLabel: "H & H",
          defaultGuestName: "Anh Hoàng Long",
        },
        hero: {
          ...BASE_DEMO_CONTENT.hero,
          eyebrow: "Wedding Invitation",
          coverImage: "/photos/1.jpg",
          coverAlt: "Ảnh cưới minh họa Gia Huy và Ngọc Hân",
        },
        sections: {
          ...BASE_DEMO_CONTENT.sections,
          defaultGuestName: "Anh Hoàng Long",
          footer: {
            ...BASE_DEMO_CONTENT.sections.footer,
            bannerImage: "/photos/4.jpg",
            thankYouBody:
              "Cảm ơn bạn đã dành thời gian quý báu đến chúc phúc cho Gia Huy & Ngọc Hân.",
            signature: "Gia Huy ♥ Ngọc Hân · 20.03.2027",
          },
        },
      };
    case "basic-3":
      return {
        ...BASE_DEMO_CONTENT,
        groom: { ...BASE_DEMO_CONTENT.groom, shortName: "Hoàng Việt", fullName: "Phạm Hoàng Việt" },
        bride: { ...BASE_DEMO_CONTENT.bride, shortName: "Khánh Linh", fullName: "Vũ Khánh Linh" },
        envelope: {
          ...BASE_DEMO_CONTENT.envelope,
          sealLabel: "V & L",
          defaultGuestName: "Chị Minh Châu",
        },
        hero: {
          ...BASE_DEMO_CONTENT.hero,
          eyebrow: "Sunset Vows",
          coverImage: "/photos/3.jpg",
          coverAlt: "Ảnh cưới minh họa Hoàng Việt và Khánh Linh",
        },
        sections: {
          ...BASE_DEMO_CONTENT.sections,
          defaultGuestName: "Chị Minh Châu",
          footer: {
            ...BASE_DEMO_CONTENT.sections.footer,
            bannerImage: "/photos/6.jpg",
            thankYouBody:
              "Hạnh phúc trọn vẹn hơn khi có sự chứng kiến và yêu thương của bạn trong buổi chiều hoàng hôn.",
            signature: "Hoàng Việt ♥ Khánh Linh · 20.03.2027",
          },
        },
      };
    case "pro-1":
      return {
        ...BASE_DEMO_CONTENT,
        groom: { ...BASE_DEMO_CONTENT.groom, shortName: "Tuấn Kiệt", fullName: "Hồ Tuấn Kiệt" },
        bride: { ...BASE_DEMO_CONTENT.bride, shortName: "Lan Anh", fullName: "Ngô Lan Anh" },
        envelope: {
          ...BASE_DEMO_CONTENT.envelope,
          sealLabel: "K ♥ A",
          defaultGuestName: "Quý Khách Danh Dự",
        },
        hero: {
          ...BASE_DEMO_CONTENT.hero,
          eyebrow: "Evening Gala",
          subtitle: "Trân trọng đón tiếp trong đêm tiệc thành hôn ánh kim",
          coverImage: "/photos/5.jpg",
          coverAlt: "Ảnh cưới minh họa Tuấn Kiệt và Lan Anh",
        },
        sections: {
          ...BASE_DEMO_CONTENT.sections,
          defaultGuestName: "Quý Khách Danh Dự",
          footer: {
            ...BASE_DEMO_CONTENT.sections.footer,
            bannerImage: "/photos/hero2.jpg",
            thankYouBody:
              "Sự hiện diện trân quý của Quý vị là niềm vinh hạnh lớn lao đối với gia đình chúng tôi.",
            signature: "Tuấn Kiệt ♥ Lan Anh · 20.03.2027",
          },
        },
      };
    case "basic-1":
    default:
      return BASE_DEMO_CONTENT;
  }
}

export { BASE_DEMO_CONTENT as DEMO_WEDDING_CONTENT };

