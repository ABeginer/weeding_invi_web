export interface WeddingPhoto {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface WeddingEvent {
  title: string;
  time: string;
  date: string; // ISO (+07:00), "YYYY-MM-DD", hoặc "DD.MM.YYYY"
  lunarDate: string;
  venue: string;
  address: string;
  mapEmbedUrl?: string;
  mapDirectionsUrl?: string;
}

export interface GiftItem {
  label: string;
  qrImage: string;
  qrAlt?: string;
  note?: string;
  downloadFileName?: string;
}

export const wedding = {
  groom: {
    name: "Chú rể",
    label: "CHÚ RỂ",
    shortName: "Văn A",
    fullName: "Nguyễn Văn A",
    parents: "Ông Nguyễn Văn B & Bà Lê Thị C",
    photo: "/photos/portrait_cr.jpg",
  },
  bride: {
    name: "Cô dâu",
    label: "CÔ DÂU",
    shortName: "Thanh D",
    fullName: "Trần Thị D",
    parents: "Ông Trần Văn E & Bà Phạm Thị F",
    photo: "/photos/portrait_cd.jpg",
  },
  families: {
    groom: {
      label: "NHÀ TRAI",
      parents: "Ông Nguyễn Văn B & Bà Lê Thị C",
      address: "123 Nguyễn Văn Trỗi, Quận Phú Nhuận, TP. Hồ Chí Minh",
    },
    bride: {
      label: "NHÀ GÁI",
      parents: "Ông Trần Văn E & Bà Phạm Thị F",
      address: "456 Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh",
    },
  },
  date: "2027-01-01T10:00:00+07:00",
  quote:
    "Hạnh phúc chẳng nằm ở điều gì xa xôi, mà ở khoảnh khắc hai ta cùng nhìn về một hướng và chọn nắm tay nhau trọn đời.",
  invitationNote:
    "Trân trọng kính mời bạn cùng gia đình đến tham dự buổi tiệc chung vui, nâng ly chúc mừng và lưu giữ những kỷ niệm thật đẹp trong ngày hạnh phúc của chúng mình.",
  hero: {
    eyebrow: "Wedding",
    subtitle: "Hân hạnh đón tiếp trong ngày chung đôi",
    coverImage: "/photos/hero2.jpg",
    coverAlt: "Ảnh cưới Văn A và Thanh D",
  },
  envelope: {
    sealLabel: "M & T",
    invitePrefix: "Trân trọng kính mời",
    defaultGuestName: "Quý khách",
    tapHint: "Chạm để mở thiệp",
    subtitle: "Hân hạnh đón tiếp trong ngày chung đôi",
  },
  events: [
    {
      title: "Lễ Thành Hôn",
      time: "10:00",
      date: "2027-01-01T10:00:00+07:00",
      lunarDate: "Ngày 24 tháng 11 năm Bính Ngọ",
      venue: "Trung tâm Tiệc cưới White Palace — Sảnh Grand Diamond",
      address: "194 Hoàng Văn Thụ, Phường 9, Quận Phú Nhuận, TP. Hồ Chí Minh",
      mapEmbedUrl:
        "https://maps.google.com/maps?q=194%20Hoang%20Van%20Thu%2C%20Phu%20Nhuan%2C%20Ho%20Chi%20Minh&t=&z=15&ie=UTF8&iwloc=&output=embed",
      mapDirectionsUrl:
        "https://www.google.com/maps/search/?api=1&query=194+Hoang+Van+Thu+Phu+Nhuan+Ho+Chi+Minh",
    },
    {
      title: "Tiệc Mừng Cưới",
      time: "11:30",
      date: "2027-01-01T11:30:00+07:00",
      lunarDate: "Ngày 24 tháng 11 năm Bính Ngọ",
      venue: "Trung tâm Tiệc cưới White Palace — Sảnh Grand Diamond (Tầng 2)",
      address: "194 Hoàng Văn Thụ, Phường 9, Quận Phú Nhuận, TP. Hồ Chí Minh",
      mapEmbedUrl:
        "https://maps.google.com/maps?q=194%20Hoang%20Van%20Thu%2C%20Phu%20Nhuan%2C%20Ho%20Chi%20Minh&t=&z=15&ie=UTF8&iwloc=&output=embed",
      mapDirectionsUrl:
        "https://www.google.com/maps/search/?api=1&query=194+Hoang+Van+Thu+Phu+Nhuan+Ho+Chi+Minh",
    },
  ] as WeddingEvent[],
  photos: [
    {
      src: "/photos/1.jpg",
      alt: "Khoảnh khắc nắm tay trong nắng chiều",
      width: 600,
      height: 900,
    },
    {
      src: "/photos/2.jpg",
      alt: "Dạo bước dưới hàng cây mùa thu",
      width: 600,
      height: 900,
    },
    {
      src: "/photos/3.jpg",
      alt: "Nụ cười rạng rỡ ngày chụp ảnh cưới",
      width: 600,
      height: 900,
    },
    {
      src: "/photos/4.jpg",
      alt: "Ánh nhìn dịu dàng bên khung cửa sổ",
      width: 300,
      height: 450,
    },
    {
      src: "/photos/5.jpg",
      alt: "Khoảnh khắc trao nhẫn hẹn ước",
      width: 300,
      height: 450,
    },
    {
      src: "/photos/6.jpg",
      alt: "Chuyến đi biển lưu giữ thanh xuân",
      width: 300,
      height: 450,
    },
  ] as WeddingPhoto[],
  music: {
    src: "/media/wedding.mp3",
    title: "Bản tình ca ngày cưới",
  },
  autoScroll: {
    enabled: true,
    speedPxPerSec: 100,
    startDelayMs: 550,
  },
  gift: {
    eyebrow: "Quà Tặng Yêu Thương",
    title: "Hộp Mừng Cưới",
    subtitle:
      "Sự hiện diện của bạn là món quà quý giá nhất đối với chúng mình. Nếu bạn ở xa muốn gửi tấm lòng mừng cưới, xin phép đón nhận thông tin bên dưới.",
    openButtonLabel: "Gửi mừng cưới",
    downloadLabel: "Lưu ảnh QR",
    items: [
      {
        label: "Donate cho Dev",
        qrImage: "/images/qr.jpg",
        qrAlt: "Mã QR hỗ trợ dev nghèo",
        note: "BIDV · 3680441399 · Tôn Long Thuận",
        downloadFileName: "qr-mung-cuoi-minh-quan.jpg",
      },
      {
        label: "Donate cho cho Cachon neo đơn",
        qrImage: "/images/qr.jpg",
        qrAlt: "Mã QR mừng cưới Thanh D",
        note: "BIDV · 3680441399 · Cà Thị Chớn",
        downloadFileName: "qr-mung-cuoi-thanh-thao.jpg",
      },
    ] as GiftItem[],
  },
  sections: {
    familiesEyebrow: "Gia Đình Hai Bên",
    coupleEyebrow: "Cô Dâu & Chú Rể",
    invitationPrefix: "Trân trọng kính mời",
    defaultGuestName: "Quý khách",
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
        "Rất tiếc vì bạn chưa thể sắp xếp tham dự, nhưng tấm lòng của bạn luôn đáng quý với chúng mình. Hẹn gặp bạn vào dịp gần nhất nhé!",
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
      bannerImage: "/images/og-cover.png",
      bannerAlt: "",
      showBannerNames: true,
      heading: "Thank You",
      thankYouTitle: "Trân Trọng Cảm Ơn",
      thankYouBody:
        "Cảm ơn sự yêu thương, hiện diện và chúc phúc của bạn dành cho Văn A & Thanh D.",
      signature: "Văn A ♥ Thanh D · 01.01.2027",
    },
    invalidInvite: {
      title: "Link thiệp không hợp lệ",
      description:
        "Rất tiếc, đường dẫn thiệp mời này không tồn tại hoặc đã thay đổi. Bạn có thể xem thông tin chung của lễ cưới bên dưới hoặc liên hệ cô dâu chú rể để nhận lại link chính xác.",
      backHomeLabel: "Xem thiệp cưới chung",
    },
  },
  seo: {
    title: "Thiệp Cưới VĂn A & Thanh D · 01.01.2027",
    description:
      "Trân trọng kính mời bạn đến chung vui trong ngày lễ thành hôn của A & D vào ngày 01.01.2027.",
    ogImage: "/images/og-cover.png",
  },
};
