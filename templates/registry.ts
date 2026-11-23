import { isTemplateAllowedForPlan } from "@/config/plans";
import type { WeddingPlan } from "@/lib/types";
import type { WeddingTemplateMeta } from "./types";

export const TEMPLATE_REGISTRY: WeddingTemplateMeta[] = [
  {
    id: "nau-toi-gian",
    name: "Nâu tối giản",
    subtitle: "Khúc ca ngọt ngào",
    description:
      "Thiệp cưới nâu tối giản với cành hoa khô, con dấu sáp, album ảnh và lịch trình ngày cưới.",
    plan: "free",
    coverImage: "/templates/nau-toi-gian/cover.webp",
    defaultMusic: {
      src: "/media/prio2.mp3",
      title: "Giai điệu Nâu tối giản",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#7C6A60",
    tone: "neutral",
    category: "minimal",
    color: "neutral",
    styleTags: ["Nâu", "Tối giản", "Hoa khô"],
  },
  {
    id: "yen-chi-mau-don",
    name: "Yên Chi Mẫu Đơn",
    subtitle: "Nhung Đỏ & Mẫu Đơn Cổ Điển",
    description:
      "Nhung đỏ rượu vang quý phái hòa quyện cùng mẫu đơn nở rộ, con dấu sáp vàng cổ, túi phong bì lồng ảnh Polaroid và hộp quà nhung mở nắp trao duyên.",
    plan: "free",
    coverImage: "/templates/yen-chi-mau-don/cover.webp",
    defaultMusic: {
      src: "/media/priority1.mp3",
      title: "Yên Chi Mẫu Đơn",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#4A0E17",
    tone: "dark",
    category: "romantic",
    color: "red",
    styleTags: ["Sang trọng", "Nhung đỏ cổ điển", "Lãng mạn"],
  },
  {
    id: "anh-dao-phan-tuyet",
    name: "Anh Đào Phấn Tuyết",
    subtitle: "Mùa Hoa Anh Đào",
    description:
      "Nét màu nước hoa anh đào thanh thoát, khung vòm cành đào ôm ảnh cưới, hộp quà lụa Furoshiki 3 trạng thái và văn phong tao nhã.",
    plan: "free",
    coverImage: "/templates/anh-dao-phan-tuyet/cover.webp",
    defaultMusic: {
      src: "/media/priority1.mp3",
      title: "Giai điệu Mùa Hoa Anh Đào",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#7A3447",
    tone: "bright",
    category: "romantic",
    color: "pink",
    styleTags: ["Hoa anh đào", "Mùa xuân", "Lãng mạn", "Lụa phấn"],
  },
  {
    id: "vuon-o-liu",
    name: "Vườn Ô Liu",
    subtitle: "Acoustic Vườn Ô Liu",
    description:
      "Phong cách tối giản với phong bì sáp olive, typography serif sang trọng và dải ảnh kỷ niệm ấm áp.",
    plan: "free",
    coverImage: "/templates/vuon-o-liu/cover.webp",
    defaultMusic: {
      src: "/media/san-vuon.mp3",
      title: "Giai điệu Vườn Ô Liu",
    },
    hasAdvancedEffects: false,
    accentSwatch: "#5E733F",
    tone: "bright",
    category: "minimal",
    color: "green",
  },
  {
    id: "bach-lan-lua-nga",
    name: "Bạch Lan Lụa Ngà",
    subtitle: "Lụa Ngà & Bạch Lan",
    description:
      "Đẳng cấp Quiet Luxury Couture với nền lụa satin trắng ngà rủ mềm, khung vòm lan hồ điệp trắng điểm ngọc trai và đường chỉ vàng champagne mảnh mai.",
    plan: "free",
    coverImage: "/templates/bach-lan-lua-nga/cover.webp",
    defaultMusic: {
      src: "/media/well-be-okay.mp3",
      title: "Giai điệu Bạch Lan Lụa Ngà",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#C8AD7F",
    tone: "bright",
    category: "romantic",
    color: "neutral",
    styleTags: ["Thanh lịch", "Quiet Luxury", "Trắng ngà", "Bạch lan", "Tối giản"],
  },
  {
    id: "rang-hong-hoang-hon",
    name: "Ráng Hồng Hoàng Hôn",
    subtitle: "Khúc Nhạc Ráng Hồng",
    description:
      "Rosy Sunset Reverie & Lush Botanical Butterfly Couture — Lãng mạn giàu họa tiết hoa mẫu đơn, khung vòm cỏ lau, cánh bướm dập dìu và văn phong thanh tao dịu ngọt.",
    plan: "free",
    coverImage: "/templates/rang-hong-hoang-hon/cover.webp",
    defaultMusic: {
      src: "/media/moonlight.mp3",
      title: "Khúc Nhạc Ráng Hồng",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#7E3945",
    tone: "bright",
    category: "romantic",
    color: "pink",
    styleTags: ["Lãng mạn", "Ráng hồng", "Hoàng hôn", "Mẫu đơn", "Thanh tao"],
  },
  {
    id: "phuong-loan-gam-do",
    name: "Phượng Loan Gấm Đỏ",
    subtitle: "Long Phụng Hòa Minh",
    description:
      "Gấm Vóc Cung Đình & Phù Điêu Hoàng Kim 24K — Nền gấm đỏ thêu hoa sen chìm, khung vòm Long Phụng phù điêu 24K, kim ấn Bát Giác Song Hỷ và hộp quà gấm đỏ nở hoa sen.",
    plan: "free",
    coverImage: "/templates/phuong-loan-gam-do/cover.webp",
    defaultMusic: {
      src: "/media/co-dien.mp3",
      title: "Long Phụng Hòa Minh",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#E5C173",
    tone: "dark",
    category: "traditional",
    color: "red",
    styleTags: ["Long Phụng", "Truyền thống", "Hoàng gia", "Gấm đỏ"],
  },
  {
    id: "thanh-mai-ngoc-lan",
    name: "Thanh Mai Ngọc Lan",
    subtitle: "Sắc Ngọc & Hoa Mai Lan",
    description:
      "Nét màu nước hoa mai thanh tao và hoa lan ngọc quý phái, khung vòm ôm ảnh cưới, con dấu sáp xanh ngọc và hộp quà nhung chúc phúc 3 trạng thái.",
    plan: "free",
    coverImage: "/templates/thanh-mai-ngoc-lan/cover.webp",
    defaultMusic: {
      src: "/media/co-dien.mp3",
      title: "Sắc Ngọc & Hoa Mai Lan",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#1E3D2E",
    tone: "bright",
    category: "romantic",
    color: "green",
    styleTags: ["Thanh tao", "Màu nước thiên nhiên", "Xanh ngọc", "Mai Lan"],
  },
  {
    id: "flowery-white",
    name: "Trắng Hoa Mộc Lan",
    subtitle: "Vườn Hoa Sớm",
    description:
      "Vườn hoa thanh lịch: nền xanh rêu, hoa mộc lan trắng kem ở bốn góc, bokeh vàng kim; thẻ kem với vương miện hoa, nút viên thuốc xanh rêu.",
    plan: "free",
    coverImage: "/templates/flowery-white/cover.webp",
    defaultMusic: {
      src: "/media/prio2.mp3",
      title: "Vườn Hoa Sớm",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#464E25",
    tone: "bright",
    category: "romantic",
    color: "neutral",
    styleTags: ["Botanical", "Xanh rêu", "Hoa mộc lan"],
  },
  {
    id: "moc-huong-nang-thu",
    name: "Mộc Hương Nắng Thu",
    subtitle: "Sắc Nâu & Lá Thu Dịu Êm",
    description:
      "Organic Botanical Couture — Giấy lanh kem yến mạch, màu nước lá thu caramel trong trẻo, phong bì vải lanh lót lụa ngà lồng đôi ảnh Polaroid và con dấu sáp đồng cổ ấm áp.",
    plan: "free",
    coverImage: "/templates/moc-huong-nang-thu/cover.webp",
    defaultMusic: {
      src: "/media/san-vuon.mp3",
      title: "Sắc Nâu & Lá Thu Dịu Êm",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#8C5633",
    tone: "bright",
    category: "minimal",
    color: "neutral",
    styleTags: ["Mộc mạc", "Tối giản cao cấp", "Nâu đất & Màu nước", "Lá thu", "Organic"],
  },
  {
    id: "minimal-red",
    name: "Đỏ Son Tối Giản",
    subtitle: "Khúc Tĩnh Tại",
    description:
      "Tối giản và trang nghiêm: nền đỏ son, khung chỉ vàng tự vẽ, dấu triện sáp để mở thiệp. Không dùng ảnh bìa hay ảnh chân dung — chỉ có album ảnh.",
    plan: "free",
    coverImage: "/templates/minimal-red/cover.webp",
    defaultMusic: {
      src: "/media/priority1.mp3",
      title: "Khúc Tĩnh Tại",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#E1BC7C",
    tone: "dark",
    category: "minimal",
    color: "red",
    styleTags: ["Minimal", "Đỏ son", "Hoàng kim"],
  },
  {
    id: "do-ruou-vang",
    name: "Đỏ Rượu Vang",
    subtitle: "Valse Rượu Vang",
    description:
      "Sắc rượu vang trầm với hoa hồng vàng, ánh sao bốn cánh và khung viền kép kiểu châu Âu; có đếm ngược tới giờ cưới.",
    plan: "free",
    coverImage: "/templates/do-ruou-vang/cover.webp",
    defaultMusic: {
      src: "/media/moonlight.mp3",
      title: "Valse Rượu Vang",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#E5C787",
    tone: "dark",
    category: "minimal",
    color: "red",
    styleTags: ["Rượu vang", "Champagne", "Hoa hồng"],
  },
  {
    id: "long-phung",
    name: "Long Phụng",
    subtitle: "Khúc Ca Long Phụng (Cổ điển)",
    description:
      "Rồng chầu phượng múa bằng nét vàng kim trên nền nhung đỏ trầm, khung vòm cung đình và lịch trình lễ do bạn tự sửa trong dashboard.",
    plan: "free",
    coverImage: "/templates/long-phung/cover.webp",
    defaultMusic: {
      src: "/media/co-dien.mp3",
      title: "Khúc Ca Long Phụng",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#E9CE91",
    tone: "dark",
    category: "traditional",
    color: "red",
    styleTags: ["Long Phụng", "Cung đình", "Đỏ nhung"],
  },
  {
    id: "chu-sa-long-phung",
    name: "Chu Sa Long Phụng",
    subtitle: "Hoàng Gia Chu Sa",
    description:
      "Thiết kế gấm đỏ chu sa hoàng cung, linh vật Rồng–Phượng khảm men ngọc bích tách nền tinh xảo, Kim Ấn Bát Giác Song Hỷ sắc nét và bao lì xì dập kim 3 trạng thái.",
    plan: "free",
    coverImage: "/templates/chu-sa-long-phung/cover.webp",
    defaultMusic: {
      src: "/media/co-dien.mp3",
      title: "Giai điệu Cung Đình Hoàng Gia",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#D4AF6A",
    tone: "dark",
    category: "traditional",
    color: "red",
    styleTags: ["Hoàng gia", "Đỏ chu sa", "Vàng 24K", "Long Phụng", "Cung đình"],
  },
  {
    id: "bich-ngoc-hoang-trieu",
    name: "Bích Ngọc Hoàng Triều",
    subtitle: "Ngọc Lục Bảo Hoàng Gia",
    description:
      "Tuyệt tác di sản ngọc lục bảo, mặt Trống Đồng Đông Sơn 24K xoay chuyển, khung vòm đài sen vàng ôm ảnh cưới và đôi linh vật Long–Phượng uy nghi.",
    plan: "free",
    coverImage: "/templates/bich-ngoc-hoang-trieu/cover.webp",
    defaultMusic: {
      src: "/media/co-dien.mp3",
      title: "Giai điệu Ngọc Lục Bảo Hoàng Gia",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#093426",
    tone: "dark",
    category: "traditional",
    color: "green",
    styleTags: ["Ngọc lục bảo", "Trống đồng", "Long Phụng", "Hoàng gia", "Đài sen vàng"],
  },
  {
    id: "long-phung-ep4",
    name: "Long Phụng Ep4",
    subtitle: "Lam Ngọc Hoàng Gia",
    description:
      "Thiệp cưới Lam Ngọc Hoàng Gia với sắc xanh navy sâu thẳm, Rồng Phụng mạ vàng kim, khung vòm ảnh cưới uyên ương và hộp mừng cưới 3 trạng thái mượt mà.",
    plan: "free",
    coverImage: "/templates/long-phung-ep4/cover.webp",
    defaultMusic: {
      src: "/media/co-dien.mp3",
      title: "Lam Ngọc Hoàng Gia",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#0F1D3A",
    tone: "dark",
    category: "traditional",
    color: "red",
    styleTags: ["Long Phụng", "Lam ngọc", "Vàng champagne", "Hoàng gia"],
  },
  {
    id: "bach-nguyet",
    name: "Bạch Nguyệt",
    subtitle: "Hoa Mộc Lan Sang Trọng",
    description:
      "Thiệp cưới Editorial Botanical Luxury với sắc xanh rừng sâu Deep Sage quý phái, hoa mộc lan thanh khiết, khung vòm nghệ thuật và con dấu sáp vàng hoàng gia.",
    plan: "free",
    coverImage: "/templates/bach-nguyet/cover.webp",
    defaultMusic: {
      src: "/media/san-vuon.mp3",
      title: "Giai điệu Mộc Lan",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#23382B",
    tone: "dark",
    category: "romantic",
    color: "neutral",
    styleTags: ["Bạch Nguyệt", "Mộc Lan", "Xanh rừng sâu", "Editorial", "Botanical"],
  },
  {
    id: "lam-hoa-vien",
    name: "Lam Hoa Viên",
    subtitle: "Thanh Nhã & Quý Phái",
    description:
      "Thiệp cưới Editorial Aristocratic Blue Hydrangea với sắc xanh lam quý phái, hoa cẩm tú cầu kiêu sa, khung vòm nghệ thuật và con dấu sáp vàng hoàng gia.",
    plan: "free",
    coverImage: "/templates/lam-hoa-vien/cover.webp",
    defaultMusic: {
      src: "/media/co-dien.mp3",
      title: "Giai điệu Lam Hoa",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#1E3557",
    tone: "dark",
    category: "romantic",
    color: "blue-purple",
    styleTags: ["Lam Hoa Viên", "Cẩm tú cầu", "Xanh quý phái", "Editorial", "Thanh nhã"],
  },
  {
    id: "bach-tra-suong-mai",
    name: "Bạch Trà Sương Mai",
    subtitle: "Vườn Bạch Trà & Sương Mai",
    description:
      "Thiệp cưới Editorial Watercolor Botanical & Frosted Silk Luxury với vườn bạch trà màu nước, thẻ lụa sương mai kính mờ, khung vòm hoa nghệ thuật và con dấu sáp vàng champagne.",
    plan: "free",
    coverImage: "/templates/bach-tra-suong-mai/cover.webp",
    defaultMusic: {
      src: "/media/san-vuon.mp3",
      title: "Giai điệu Bạch Trà",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#23382B",
    tone: "dark",
    category: "romantic",
    color: "neutral",
    styleTags: ["Bạch Trà", "Sương Mai", "Vườn hoa màu nước", "Frosted Silk", "Editorial", "Botanical"],
  },
  {
    id: "song-hac-kim-van",
    name: "Song Hạc Kim Vân",
    subtitle: "Sơn Mài Hoàng Gia",
    description:
      "Thiệp cưới Sơn Mài Hoàng Gia & Di Sản Á Đông với sắc đỏ son sơn mài, vàng kim ánh cổ, biểu tượng Song Hạc Kim Vân, mây tường vân quý phái và ấn triện Song Hỷ.",
    plan: "free",
    coverImage: "/templates/song-hac-kim-van/cover.webp",
    defaultMusic: {
      src: "/media/co-dien.mp3",
      title: "Khúc Ca Song Hạc",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#6E0F14",
    tone: "dark",
    category: "traditional",
    color: "black-gold",
    styleTags: ["Song Hạc", "Sơn Mài", "Kim Vân", "Đỏ son", "Hoàng Gia", "Di Sản"],
  },
  {
    id: "hac-vu-luu-ly",
    name: "Hạc Vũ Lưu Ly",
    subtitle: "Pháp Lam Đêm Trăng",
    description:
      "Thiệp cưới Pháp Lam Đêm Trăng & Kiêu Kỳ Quý Tộc với sắc xanh lam lưu ly đêm trăng, vàng bạch kim, quạt xếp cung đình, cổng Nguyệt Môn tròn và khánh ngọc lưu ly.",
    plan: "free",
    coverImage: "/templates/hac-vu-luu-ly/cover.webp",
    defaultMusic: {
      src: "/media/co-dien.mp3",
      title: "Khúc Vũ Lưu Ly",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#0B192C",
    tone: "dark",
    category: "traditional",
    color: "black-gold",
    styleTags: ["Hạc Vũ", "Lưu Ly", "Pháp Lam", "Đêm Trăng", "Quý Tộc", "Editorial"],
  },
  {
    id: "diem-phan-kim-to",
    name: "Diễm Phấn Kim Tơ",
    subtitle: "Haute Couture Phấn Lụa",
    description:
      "Thiệp cưới Haute Couture Phấn Lụa với sắc hồng rượu vang sâu, lụa phấn sứ, chỉ tơ vàng hồng, khung Oval Cameo và nơ ruy-băng ấn sáp tinh tế.",
    plan: "free",
    coverImage: "/templates/diem-phan-kim-to/cover.webp",
    defaultMusic: {
      src: "/media/moonlight.mp3",
      title: "Khúc Ca Phấn Lụa",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#6E2331",
    tone: "bright",
    category: "romantic",
    color: "pink",
    styleTags: ["Diễm Phấn", "Kim Tơ", "Haute Couture", "Hồng phấn", "Vàng hồng", "Cameo"],
  },
  {
    id: "phi-thuy-dong-duong",
    name: "Phỉ Thúy Đông Dương",
    subtitle: "Kiến Trúc Đông Dương",
    description:
      "Thiệp cưới Kiến Trúc Đông Dương với sắc xanh phỉ thúy sâu, đồng thau cổ, cửa vòm nan trúc, huy hiệu bát giác Song Hỷ và rương sính lễ 3 trạng thái.",
    plan: "free",
    coverImage: "/templates/phi-thuy-dong-duong/cover.webp",
    defaultMusic: {
      src: "/media/co-dien.mp3",
      title: "Khúc Ca Đông Dương",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#0F2A1F",
    tone: "dark",
    category: "minimal",
    color: "green",
    styleTags: ["Đông Dương", "Phỉ Thúy", "Indochine", "Art Deco", "Đồng Thau", "Kiến Trúc"],
  },
  {
    id: "ho-phach-mat-thu",
    name: "Hổ Phách Mật Thư",
    subtitle: "Mật Thư Cổ Điển",
    description:
      "Thiệp cưới Vintage Châu Âu Cổ Điển & Mật Thư Nâu Espresso: nắp phong thư 3D trượt ảnh uyên ương, ấn sáp đồng cổ, cành lá ép khô và hộp bưu kiện 3 trạng thái.",
    plan: "free",
    coverImage: "/templates/ho-phach-mat-thu/cover.webp",
    defaultMusic: {
      src: "/media/moonlight.mp3",
      title: "Giai điệu Mật Thư",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#4E382C",
    tone: "bright",
    category: "minimal",
    color: "neutral",
    styleTags: ["Hổ Phách", "Mật Thư", "Vintage", "Châu Âu", "Ấn Sáp", "Espresso", "Herbarium"],
  },
  {
    id: "lam-tu-ngoc-suong",
    name: "Lam Tú Ngọc Sương",
    subtitle: "Tú Cầu Sương Ngọc",
    description:
      "Thiệp cưới Cẩm Tú Cầu Xanh & Sương Ngọc Bạc: thẻ sứ ngọc trai mờ tương phản cao, khung vòm pha lê tú cầu, con dấu sáp pha lê và hộp trang sức nhung xanh 3 trạng thái.",
    plan: "free",
    coverImage: "/templates/lam-tu-ngoc-suong/cover.webp",
    defaultMusic: {
      src: "/media/san-vuon.mp3",
      title: "Giai điệu Sương Ngọc",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#14325C",
    tone: "bright",
    category: "romantic",
    color: "blue-purple",
    styleTags: ["Lam Tú", "Ngọc Sương", "Cẩm Tú Cầu", "Sương Ngọc", "Pha Lê", "Xanh Lam", "Couture"],
  },
  {
    id: "tu-dang-da-khuc",
    name: "Tử Đằng Dạ Khúc",
    subtitle: "Tử Đằng & Diên Vĩ Đêm",
    description:
      "Thiệp cưới Nhung Tím Đêm & Hoa Tử Đằng Hoàng Gia: sắc tím thạch anh huyền bí, rèm tử đằng rủ, hoa diên vĩ vàng cổ và phong thư nhung 3 trạng thái.",
    plan: "free",
    coverImage: "/templates/tu-dang-da-khuc/cover.webp",
    defaultMusic: {
      src: "/media/moonlight.mp3",
      title: "Dạ Khúc Tử Đằng",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#1B0F26",
    tone: "dark",
    category: "romantic",
    color: "blue-purple",
    styleTags: ["Tử Đằng", "Diên Vĩ", "Nhung Tím", "Dạ Khúc", "Thạch Anh", "Vàng Cổ", "Couture"],
  },
  {
    id: "huyen-kim-long-phung",
    name: "Huyền Kim Long Phụng",
    subtitle: "Hắc Kim Hoàng Gia",
    description:
      "Thiệp cưới Sơn Mài Đen Huyền & Vàng Lá 24K Hoàng Gia: Kim Ấn Song Hỷ nổi khối, Rồng Phượng chạm khắc tinh xảo tách cánh mở bìa, tối ưu hiển thị cả Mobile và Desktop.",
    plan: "free",
    coverImage: "/templates/huyen-kim-long-phung/cover.webp",
    defaultMusic: {
      src: "/media/co-dien.mp3",
      title: "Huyền Kim Hoàng Gia",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#0B0A09",
    tone: "dark",
    category: "traditional",
    color: "black-gold",
    styleTags: ["Huyền Kim", "Long Phụng", "Sơn Mài", "Vàng 24K", "Hoàng Gia", "Hắc Kim", "Black-Tie"],
  },
  {
    id: "hac-kim-nhat-thuc",
    name: "Hắc Kim Nhật Thực",
    subtitle: "Nhật Thực Kim Cương",
    description:
      "Thiệp cưới Đá Cẩm Thạch Đen Kintsugi & Nhật Thực Vàng 24K: Vòng nhật thực kim cương bừng sáng mở bìa, ảnh cặp đôi lồng trong vầng hào quang vàng ròng, đồng hồ Thụy Sĩ sang trọng đẳng cấp Black-Tie.",
    plan: "free",
    coverImage: "/templates/hac-kim-nhat-thuc/cover.webp",
    defaultMusic: {
      src: "/media/co-dien.mp3",
      title: "Nhật Thực Kim Cương",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#09090B",
    tone: "dark",
    category: "minimal",
    color: "black-gold",
    styleTags: ["Hắc Kim", "Nhật Thực", "Kintsugi", "Cẩm Thạch Đen", "Vàng 24K", "Black-Tie", "Couture"],
  },
  {
    id: "da-yen-pha-le",
    name: "Dạ Yến Pha Lê",
    subtitle: "Đại Tiệc Pha Lê Đêm",
    description:
      "Thiệp cưới Đại Tiệc Pha Lê Baccarat & Nhung Đen Sân Khấu: Khai màn đại tiệc với pháo sáng champagne bùng nổ, đèn chùm pha lê Baccarat rực rỡ và khung vòm gương lấp lánh ánh kim.",
    plan: "free",
    coverImage: "/templates/da-yen-pha-le/cover.webp",
    defaultMusic: {
      src: "/media/co-dien.mp3",
      title: "Đại Tiệc Pha Lê Đêm",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#0A0A0D",
    tone: "dark",
    category: "minimal",
    color: "blue-purple",
    styleTags: ["Dạ Yến", "Pha Lê", "Nhung Đen", "Baccarat", "Champagne", "Ballroom", "Couture"],
  },
  {
    id: "mac-lam-kim-tuyen",
    name: "Mặc Lam Kim Tuyến",
    subtitle: "Tối Giản Lam Mực",
    description:
      "Thiệp cưới Tối Giản Lam Mực & Chỉ Vàng Mảnh: Nghệ thuật đường nét thanh nhã, chuyển động chữ trượt luân phiên Trái ↔ Phải mượt mà, vương miện ô liu hoàng gia và phong cách tối giản editorial.",
    plan: "free",
    coverImage: "/templates/mac-lam-kim-tuyen/cover.webp",
    defaultMusic: {
      src: "/media/co-dien.mp3",
      title: "Khúc Nhạc Lam Mực",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#061630",
    tone: "dark",
    category: "minimal",
    color: "blue-purple",
    styleTags: ["Mặc Lam", "Kim Tuyến", "Tối Giản", "Lam Mực", "Chỉ Vàng", "Editorial", "Minimalism"],
  },
  {
    id: "do-truyen-thong",
    name: "Đỏ - Truyền thống",
    subtitle: "Khúc Ca Ngày Cưới",
    description:
      "Cổng đỏ song hỷ mở ra thiệp cưới truyền thống: khung chỉ vàng, ảnh vòm, album coverflow và lịch trình lễ do bạn tự sửa trong dashboard.",
    plan: "free",
    coverImage: "/templates/do-truyen-thong/cover.webp",
    defaultMusic: {
      src: "/media/co-dien.mp3",
      title: "Khúc Ca Ngày Cưới",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#800000",
    tone: "dark",
    category: "traditional",
    color: "red",
    styleTags: ["Song Hỷ", "Đỏ truyền thống", "Áo dài"],
  },
  {
    id: "song-hy-v2-do",
    name: "Song Hỷ Đỏ",
    subtitle: "Khúc Ca Song Hỷ",
    description:
      "Chữ Song Hỷ đỏ son truyền thống phối sắc vàng kim rạng ngời, cầu chúc trăm năm tình nghĩa mặn nồng.",
    plan: "free",
    coverImage: "/templates/song-hy-v2-do/cover.webp",
    defaultMusic: {
      src: "/media/co-dien.mp3",
      title: "Khúc Ca Song Hỷ",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#FFE8A4",
    tone: "dark",
    category: "traditional",
    color: "red",
    styleTags: ["Song Hỷ", "May mắn", "Đỏ son"],
  },
  {
    id: "song-phung-bich-dao",
    name: "Song Phụng Bích Đào",
    subtitle: "Vũ Điệu Phụng Hoàng",
    description:
      "Vũ Điệu Phụng Hoàng — Nền nhung xanh ngọc dệt hoa văn lông phụng ánh kim, thân thiệp lụa đào phấn, khung vòm Song Phụng vàng 24K ôm ảnh cưới và hộp quà nhung mở nắp trao duyên.",
    plan: "free",
    coverImage: "/templates/song-phung-bich-dao/cover.webp",
    defaultMusic: {
      src: "/media/co-dien.mp3",
      title: "Vũ Điệu Phụng Hoàng",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#C69D4B",
    tone: "bright",
    category: "traditional",
    color: "green",
    styleTags: ["Quý phái", "Song Phụng", "Xanh ngọc & Lụa đào"],
  },
  {
    id: "to-hong-lua-tham",
    name: "Tơ Hồng Lụa Thắm",
    subtitle: "Dải Lụa Đỏ & Nút Thắt Đồng Tâm",
    description:
      "Bìa mở rèm lụa 2 cánh kết hợp Nút Thắt Đồng Tâm, bố cục tạp chí điện ảnh với sợi tơ hồng se duyên, album thước phim kỷ niệm và túi gấm chúc phúc.",
    plan: "free",
    coverImage: "/templates/to-hong-lua-tham/cover.webp",
    defaultMusic: {
      src: "/media/priority1.mp3",
      title: "Dải Lụa Đỏ & Nút Thắt Đồng Tâm",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#E8C987",
    tone: "dark",
    category: "romantic",
    color: "red",
    styleTags: ["Điện ảnh", "Tương tác mở rèm lụa", "Lãng mạn đỏ rượu vang", "Nút thắt đồng tâm"],
  },
  {
    id: "ban-sac-huong-cang",
    name: "Bản Sắc Hương Cảng",
    subtitle: "Khí Chất Ông Trùm 1980s · Noir Điện Ảnh",
    description:
      "Tuyệt tác phong cách Hong Kong Gangster thập niên 80–90: sắc lạnh, quyền lực, đậm chất điện ảnh với Mercedes-Benz W126 cổ giữa phố đêm mưa, biển neon rực sáng và thước phim tình yêu kinh điển.",
    plan: "free",
    coverImage: "/templates/ban-sac-huong-cang/cover.webp",
    defaultMusic: {
      src: "/media/priority1.mp3",
      title: "Bản Tình Ca Hương Cảng",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#8F1524",
    tone: "dark",
    category: "hongkong",
    color: "red",
    styleTags: ["Hong Kong Gangster 80s–90s", "Noir", "Lạnh lùng", "Điện ảnh TVB", "Sang trọng"],
  },
  {
    id: "cuu-long-hy-yen",
    name: "Cửu Long Hỷ Yến",
    subtitle: "Đêm Tiệc Cửu Long · Phong Cách 1990s",
    description:
      "Tuyệt tác phong cách Anh Đại – Chị Đại Hồng Kông thập niên 1990: bá khí, lịch lãm, đậm chất VIP đêm Cửu Long với Quân Mạt Chược Song Hỷ lật 3D, Đôi Lá Bài K♥ – Q♥ mạ vàng, Bàn Lịch Mạt Chược và Vali Đen Khóa Vàng bung ánh hỷ sự.",
    plan: "free",
    coverImage: "/templates/cuu-long-hy-yen/cover.webp",
    defaultMusic: {
      src: "/media/priority1.mp3",
      title: "Bản Tình Ca Cửu Long",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#D8AE56",
    tone: "dark",
    category: "hongkong",
    color: "red",
    styleTags: ["Hồng Kông 90s", "Anh Đại Chị Đại", "Nổi loạn", "Đêm VIP", "Thần Bài", "Điện ảnh"],
  },
  {
    id: "da-anh-huong-cang",
    name: "Dạ Ảnh Hương Cảng",
    subtitle: "Điện Ảnh Hồng Kông 90s · Street Editorial Zine",
    description:
      "Tuyệt tác kết hợp chất điện ảnh Vương Gia Vệ đêm mưa neon và Street Editorial Zine: Xé Vé Vào Rạp xem phim, khung phim 35mm, Polaroid nghiêng đối đầu mực tàu, Bảng Lịch Báo In và Hộp Thiếc Hương Cảng bung ánh sáng.",
    plan: "free",
    coverImage: "/templates/da-anh-huong-cang/cover.webp",
    defaultMusic: {
      src: "/media/priority1.mp3",
      title: "Bản Tình Ca Dạ Ảnh Hương Cảng",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#C81E2B",
    tone: "dark",
    category: "hongkong",
    color: "neutral",
    styleTags: ["Hồng Kông 90s", "Nổi loạn", "Điện ảnh", "Cá tính", "Vương Gia Vệ", "Zine"],
  },
  {
    id: "hao-quang-huong-cang",
    name: "Hào Quang Hương Cảng",
    subtitle: "Poster Đồ Họa Hồng Kông 1990s · Art Deco",
    description:
      "Tuyệt tác poster điện ảnh Hồng Kông thập niên 90 kết hợp hình học Art Deco: mạnh mẽ, nam tính, lịch lãm, tên cặp đôi nổi bật trung tâm, khung ảnh film 35mm, bàn lịch báo in và hộp quà hỷ sự bung ánh hào quang.",
    plan: "free",
    coverImage: "/templates/hao-quang-huong-cang/cover.webp",
    defaultMusic: {
      src: "/media/priority1.mp3",
      title: "Bản Tình Ca Hào Quang Hương Cảng",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#D8B15B",
    tone: "dark",
    category: "hongkong",
    color: "black-gold",
    styleTags: ["Hồng Kông 90s", "Art Deco", "Poster Điện Ảnh", "Lịch Lãm", "Nam Tính", "Vương Gia Vệ"],
  },
  {
    id: "huong-cang-dem-neon",
    name: "Hương Cảng Đêm Neon",
    subtitle: "Thước Phim VHS Phố Đêm Hong Kong 1990s",
    description:
      "Tái hiện trọn vẹn thước phim tình yêu Hong Kong thập niên 90: phố đêm Mong Kok neon rực rỡ, HUD VHS cổ điển, xe taxi đỏ, máy ảnh film 35mm, cuộn phim kỷ niệm và hộp băng VHS Collector 3 trạng thái độc bản.",
    plan: "free",
    coverImage: "/templates/huong-cang-dem-neon/cover.webp",
    defaultMusic: {
      src: "/media/priority1.mp3",
      title: "Khúc Dạ Hành Hương Cảng Đêm Neon",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#FF2D78",
    tone: "dark",
    category: "hongkong",
    color: "red",
    styleTags: ["Hồng Kông 90s", "Phố Đêm Neon", "Thước Phim VHS", "Lãng Mạn", "Vương Gia Vệ", "Mong Kok"],
  },
  {
    id: "nhat-ky-mua-yeu",
    name: "Nhật Ký Mùa Yêu",
    subtitle: "Analog Scrapbook · Our Little Story",
    description:
      "Tái hiện trọn vẹn cuốn sổ lưu bút tình yêu ngẫu hứng và ấm áp: trang giấy kem vintage, khung ảnh Polaroid nghiêng, washi tape đa sắc, vé kỷ niệm, dấu ngày film 35mm và gói quà giấy kraft 3 trạng thái độc bản.",
    plan: "free",
    coverImage: "/templates/nhat-ky-mua-yeu/cover.webp",
    defaultMusic: {
      src: "/media/priority1.mp3",
      title: "Giai Điệu Nhật Ký Mùa Yêu",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#B85042",
    tone: "bright",
    category: "romantic",
    color: "pink",
    styleTags: ["Scrapbook", "Vintage", "Nhật ký tình yêu", "Polaroid", "Nghệ thuật", "Ấm áp"],
  },
  {
    id: "mot-thoi-de-nho",
    name: "Một Thời Để Nhớ",
    subtitle: "Vintage Love Story",
    description:
      "Tái hiện cuốn nhật ký tình yêu vintage mộc mạc và ấm áp: trang giấy kem cũ ngả vàng, con dấu sáp niêm phong đỏ trầm, hoa cúc và baby ép khô, khung ảnh Polaroid & giấy xé thủ công, cùng hộp quà kỷ niệm giấy kraft chứa chan yêu thương.",
    plan: "pro",
    coverImage: "/templates/mot-thoi-de-nho/cover.webp",
    defaultMusic: {
      src: "/media/co-dien.mp3",
      title: "Giai Điệu Cổ Điển",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#7C3629",
    tone: "bright",
    category: "romantic",
    color: "neutral",
    styleTags: ["Vintage Love Story", "Hoa ép khô", "Con dấu sáp", "Thư tay", "Nhật ký", "Scrapbook", "Mộc mạc"],
  },
  {
    id: "vuonkinh-xanh",
    name: "Vườn Kính Xanh",
    subtitle: "Dạ Khúc Vườn Kính",
    description:
      "Không gian dạ tiệc nhà kính ngập tràn cây lá nhiệt đới, sắc xanh rêu đậm sâu lắng và huyền ảo.",
    plan: "free",
    coverImage: "/templates/vuonkinh-xanh/cover.webp",
    defaultMusic: {
      src: "/media/san-vuon.mp3",
      title: "Dạ Khúc Vườn Kính",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#A9C5A0",
    tone: "dark",
    category: "minimal",
    color: "green",
    styleTags: ["Vườn kính", "Dạ tiệc", "Huyền ảo"],
  },
];

export const HERO_PREVIEW_TEMPLATES: WeddingTemplateMeta[] = [
  ...TEMPLATE_REGISTRY.filter((tpl) => tpl.id === "long-phung"),
  ...TEMPLATE_REGISTRY.filter((tpl) => tpl.id !== "long-phung" && !tpl.isPlaceholder),
];

/** Mẫu đã đủ dữ liệu để hiển thị trong bộ sưu tập (kèm đường dẫn ảnh mặc định). */
export interface TemplateCollectionItem extends WeddingTemplateMeta {
  previewImage: string;
  snapshotImage: string;
  demoUrl?: string;
}

export function getTemplateCollection(): TemplateCollectionItem[] {
  return TEMPLATE_REGISTRY.map((tpl) => ({
    ...tpl,
    previewImage:
      tpl.previewImage ??
      tpl.coverImage ??
      `/templates/${tpl.id}/preview.webp`,
    snapshotImage:
      tpl.snapshotImage ??
      tpl.coverImage ??
      `/templates/${tpl.id}/snapshot.webp`,
    demoUrl: tpl.demoUrl ?? (tpl.isPlaceholder ? undefined : `/mau/${tpl.id}`),
  })).sort(
    (a, b) => Number(Boolean(a.isPlaceholder)) - Number(Boolean(b.isPlaceholder)),
  );
}

export const SELECTABLE_DASHBOARD_TEMPLATES: WeddingTemplateMeta[] =
  TEMPLATE_REGISTRY.filter((tpl) => !tpl.isPlaceholder);

export function getTemplateMeta(templateId: string): WeddingTemplateMeta | undefined {
  const normalizedId =
    templateId === "basic-1"
      ? "vuon-o-liu"
      : templateId === "bach_nguyet"
        ? "bach-nguyet"
        : templateId === "lam_hoa_vien"
          ? "lam-hoa-vien"
          : templateId === "hac_vu_luu_ly"
            ? "hac-vu-luu-ly"
            : templateId === "diem_phan_kim_to"
              ? "diem-phan-kim-to"
              : templateId === "phi_thuy_dong_duong"
                ? "phi-thuy-dong-duong"
                : templateId === "ho_phach_mat_thu"
                  ? "ho-phach-mat-thu"
                  : templateId === "lam_tu_ngoc_suong"
                    ? "lam-tu-ngoc-suong"
                    : templateId === "tu_dang_da_khuc"
                      ? "tu-dang-da-khuc"
                      : templateId === "huyen_kim_long_phung"
                        ? "huyen-kim-long-phung"
                        : templateId === "hac_kim_nhat_thuc"
                          ? "hac-kim-nhat-thuc"
                          : templateId === "da_yen_pha_le"
                            ? "da-yen-pha-le"
                            : templateId === "mac_lam_kim_tuyen"
                              ? "mac-lam-kim-tuyen"
                              : templateId === "ban_sac_huong_cang"
                                ? "ban-sac-huong-cang"
                                : templateId === "cuu_long_hy_yen"
                                  ? "cuu-long-hy-yen"
                                  : templateId === "da_anh_huong_cang"
                                    ? "da-anh-huong-cang"
                                    : templateId === "hao_quang_huong_cang"
                                      ? "hao-quang-huong-cang"
                                      : templateId === "huong_cang_dem_neon"
                                        ? "huong-cang-dem-neon"
                                        : templateId === "nhat_ky_mua_yeu"
                                          ? "nhat-ky-mua-yeu"
                                          : templateId;
  return TEMPLATE_REGISTRY.find((tpl) => tpl.id === normalizedId);
}

export function canPlanUseTemplate(
  userPlan: WeddingPlan,
  templatePlan: WeddingPlan
): boolean {
  return isTemplateAllowedForPlan(userPlan, templatePlan);
}
