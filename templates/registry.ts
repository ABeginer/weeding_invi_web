import { isTemplateAllowedForPlan } from "@/config/plans";
import { RITUAL_TEMPLATES_CONFIG } from "@/config/templates-ritual";
import type { WeddingPlan } from "@/lib/types";
import type { WeddingTemplateMeta } from "./types";

const ritualVuQuy = RITUAL_TEMPLATES_CONFIG.find((r) => r.ritualKey === "vu-quy");

export const TEMPLATE_REGISTRY: WeddingTemplateMeta[] = [
  {
    id: "nau-toi-gian",
    name: "Nâu tối giản",
    subtitle: "Tối giản · Nâu ấm",
    description:
      "Thiệp cưới nâu tối giản với cành hoa khô, con dấu sáp, album ảnh và lịch trình ngày cưới.",
    plan: "free",
    coverImage: "/templates/nau-toi-gian/cover.jpg",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Giai điệu Nâu tối giản",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#7C6A60",
    tone: "neutral",
    styleTags: ["Nâu", "Tối giản", "Hoa khô"],
  },
  {
    id: "do-mix-xanh",
    name: "Đỏ mix xanh",
    subtitle: "Đỏ rượu · Xanh rêu",
    description:
      "Phiên bản phối màu của Đỏ may mắn: trang SAVE THE DATE xanh rêu, các phần còn lại giữ nguyên đỏ rượu.",
    plan: "free",
    coverImage: "/templates/do-may-man/cover.jpg",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Giai điệu Đỏ mix xanh",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#586D40",
    tone: "dark",
    styleTags: ["Đỏ rượu", "Xanh rêu", "Mẫu đơn"],
  },
  {
    id: "xanh-tu-do",
    name: "Xanh tự do",
    subtitle: "Cổ điển · Xanh rêu",
    description:
      "Phiên bản xanh rêu của Đỏ may mắn, giữ nguyên bố cục, cành mẫu đơn, phong bao và lịch trình.",
    plan: "free",
    coverImage: "/templates/xanh-tu-do/cover.jpg",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Giai điệu Xanh tự do",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#586D40",
    tone: "dark",
    styleTags: ["Xanh rêu", "Cổ điển", "Mẫu đơn"],
  },
  {
    id: "do-may-man",
    name: "Đỏ may mắn",
    subtitle: "Cổ điển · Đỏ rượu",
    description:
      "Thiệp cưới đỏ rượu với cành mẫu đơn, phong bao lì xì, album ảnh và lịch trình ngày cưới.",
    plan: "free",
    coverImage: "/templates/do-may-man/cover.jpg",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Giai điệu Đỏ may mắn",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#4D1217",
    tone: "dark",
    styleTags: ["Đỏ rượu", "Cổ điển", "Mẫu đơn"],
  },
  {
    id: "hoa-anh-dao-v2",
    name: "Hoa Anh Đào V2",
    subtitle: "Lãng mạn · Hoa anh đào",
    description:
      "Thiệp cưới thuần React với cành hoa anh đào, hiệu ứng mở thiệp, album, hộp quà và xác nhận tham dự.",
    plan: "free",
    coverImage: "/templates/hoa-anh-dao-v2/cover.png",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Giai điệu Hoa Anh Đào",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#C45B72",
    tone: "bright",
    styleTags: ["Hoa anh đào", "Lãng mạn", "Hiện đại"],
  },
  {
    id: "basic-1",
    name: "Vườn Ô Liu",
    subtitle: "Thanh lịch · Cổ điển",
    description:
      "Phong cách tối giản với phong bì sáp olive, typography serif sang trọng và dải ảnh kỷ niệm ấm áp.",
    plan: "free",
    coverImage: "/templates/basic-1/cover.webp",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Giai điệu Vườn Ô Liu",
    },
    hasAdvancedEffects: false,
    accentSwatch: "#5E733F",
    tone: "bright",
  },
  {
    id: "basic-2",
    name: "Trắng Ngà Tối Giản",
    subtitle: "Tinh gọn · Tạp chí",
    description:
      "Nền giấy kem ngà nhẹ mắt, đường kẻ champagne thanh mảnh và bố cục lịch tiệc cân đối hiện đại.",
    plan: "free",
    coverImage: "/templates/basic-2/cover.webp",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Bản tình ca Trắng Ngà",
    },
    hasAdvancedEffects: false,
    accentSwatch: "#C6A962",
    tone: "bright",
  },
  {
    id: "basic-3",
    name: "Ánh Nắng Hoàng Hôn",
    subtitle: "Ấm áp · Lãng mạn",
    description:
      "Sắc hồng cát hoàng hôn kết hợp khung ảnh vòm cổ điển, mang lại cảm giác gần gũi và sâu lắng.",
    plan: "free",
    coverImage: "/templates/basic-3/cover.webp",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Khúc nhạc Hoàng Hôn",
    },
    hasAdvancedEffects: false,
    accentSwatch: "#8B4343",
    tone: "neutral",
  },
  {
    id: "pro-1",
    name: "Nhung Đen Ánh Kim",
    subtitle: "Cao cấp · Art Deco",
    description:
      "Nền nhung tối huyền bí điểm viền vàng ánh kim, hiệu ứng mở thiệp hai cánh và khung ảnh góc mạ vàng.",
    plan: "pro",
    coverImage: "/templates/pro-1/cover.webp",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Dạ khúc Ánh Kim",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#D4AF37",
    tone: "dark",
  },
  {
    id: "ritual-vu-quy",
    name: ritualVuQuy?.name ?? "Lễ vu quy",
    subtitle: ritualVuQuy?.ritualLabel ?? "Vu quy",
    description: ritualVuQuy?.description ?? "",
    plan: "free",
    coverImage: "/templates/basic-3/cover.webp",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Giai điệu Lễ Vu Quy",
    },
    hasAdvancedEffects: false,
    accentSwatch: "#D4AF37",
    tone: "neutral",
    ritualKey: "vu-quy",
    ritualLabel: ritualVuQuy?.ritualLabel ?? "Vu quy",
    styleTags: ritualVuQuy?.styleTags ?? ["Nhà gái", "Thanh lịch"],
  },
  {
    id: "anh-dao-hong",
    name: "Anh Đào Hồng",
    subtitle: "Lãng mạn · Hoa anh đào",
    description:
      "Sắc hồng pastel ngọt ngào của hoa anh đào Nhật Bản, khung ảnh nghệ thuật và phông chữ bay bổng nhẹ nhàng.",
    plan: "free",
    coverImage: "/templates/anh-dao-hong/cover.svg",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Giai điệu Anh Đào",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#F5C4C8",
    tone: "bright",
    styleTags: ["Hoa anh đào", "Lãng mạn", "Nhật Bản"],
  },
  {
    id: "bach-su-do",
    name: "Bạch Sứ Đỏ",
    subtitle: "Cổ điển · Gốm sứ đỏ",
    description:
      "Hoa văn gốm sứ đỏ truyền thống trên nền ngà thanh khiết, kết hợp viền ánh vàng tinh tế và trang trọng.",
    plan: "free",
    coverImage: "/templates/bach-su-do/cover.svg",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Khúc nhạc Bạch Sứ",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#B03235",
    tone: "bright",
    styleTags: ["Gốm sứ", "Cổ điển", "Truyền thống"],
  },
  {
    id: "bach-su-nau",
    name: "Bạch Sứ Nâu",
    subtitle: "Thanh nhã · Nâu hổ phách",
    description:
      "Hoa văn gốm sứ tông nâu hổ phách cổ điển, mang hơi thở hoài niệm, ấm cúng và tao nhã.",
    plan: "free",
    coverImage: "/templates/bach-su-nau/cover.svg",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Hòa tấu Bạch Sứ Nâu",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#8D6F32",
    tone: "bright",
    styleTags: ["Hổ phách", "Hoài niệm", "Thanh nhã"],
  },
  {
    id: "chibi-red",
    name: "Chibi Đỏ",
    subtitle: "Trẻ trung · Dễ thương",
    description:
      "Phong cách minh họa tươi vui, tông đỏ ấm áp kết hợp vàng nghệ năng động, mang lại nụ cười rạng rỡ cho ngày vui.",
    plan: "free",
    coverImage: "/templates/chibi-red/cover.svg",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Vui tươi Ngày Cưới",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#C4272F",
    tone: "bright",
    styleTags: ["Chibi", "Minh họa", "Dễ thương"],
  },
  {
    id: "hoa-moc-nau",
    name: "Hoa Mộc Nâu",
    subtitle: "Mộc mạc · Rustic",
    description:
      "Phong cách Rustic tự nhiên với gam nâu cà phê và hoa khô mộc mạc, mang lại cảm giác thân mật và ấm áp.",
    plan: "free",
    coverImage: "/templates/hoa-moc-nau/cover.svg",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Khúc tình ca Mộc",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#C7A17A",
    tone: "neutral",
    styleTags: ["Rustic", "Mộc mạc", "Cà phê"],
  },
  {
    id: "hoang-kim-do",
    name: "Hoàng Kim Đỏ",
    subtitle: "Hoàng gia · Ánh kim",
    description:
      "Sắc đỏ thẫm quý phái phủ vàng kim lấp lánh, phong cách cung đình lộng lẫy và uy nghiêm.",
    plan: "free",
    coverImage: "/templates/hoang-kim-do/cover.svg",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Dạ tiệc Hoàng Kim",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#E1BC7C",
    tone: "dark",
    styleTags: ["Hoàng gia", "Ánh kim", "Sang trọng"],
  },
  {
    id: "long-phung-v2-do",
    name: "Long Phụng Đỏ",
    subtitle: "Truyền thống · Long Phụng",
    description:
      "Biểu tượng Long Phụng sum vầy trên nền đỏ son truyền thống, sắc vàng đồng tôn vinh hôn nhân viên mãn.",
    plan: "free",
    coverImage: "/templates/long-phung-v2-do/cover.svg",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Long Phụng Hòa Minh",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#FFE3B1",
    tone: "dark",
    styleTags: ["Long Phụng", "Truyền thống", "Sum vầy"],
  },
  {
    id: "mai-lan-xanh",
    name: "Mai Lan Xanh",
    subtitle: "Thanh tao · Mai Lan",
    description:
      "Họa tiết Mai Lan tao nhã trên nền xanh ngọc lam đậm, kết hợp vàng đồng sang trọng mang nét đẹp đài các.",
    plan: "free",
    coverImage: "/templates/mai-lan-xanh/cover.svg",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Giai điệu Mai Lan",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#A9874E",
    tone: "dark",
    styleTags: ["Mai Lan", "Thanh tao", "Đài các"],
  },
  {
    id: "ren-theu-trang",
    name: "Ren Thêu Trắng",
    subtitle: "Tinh khôi · Ren thêu",
    description:
      "Dải ren thêu thủ công tinh xảo trên nền giấy linen ấm, tối giản nhưng đậm chất thơ và thuần khiết.",
    plan: "free",
    coverImage: "/templates/ren-theu-trang/cover.svg",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Khúc Ren Tinh Khôi",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#C5A059",
    tone: "bright",
    styleTags: ["Ren thêu", "Tinh khôi", "Thuần khiết"],
  },
  {
    id: "flowery-white",
    name: "Flowery White",
    subtitle: "Xanh rêu · Hoa mộc lan",
    description:
      "Vườn hoa thanh lịch: nền xanh rêu, hoa mộc lan trắng kem ở bốn góc, bokeh vàng kim; thẻ kem với vương miện hoa, nút viên thuốc xanh rêu.",
    plan: "free",
    coverImage: "/templates/flowery-white/cover.jpg",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Vườn Hoa Sớm",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#464E25",
    tone: "bright",
    styleTags: ["Botanical", "Xanh rêu", "Hoa mộc lan"],
  },
  {
    id: "minimal-brown",
    name: "Minimal Brown",
    subtitle: "Tối giản · Nâu đất",
    description:
      "Nâu đất ấm và kem gấm: phong bì niêm sáp vàng, hai ảnh chân dung trượt ra khỏi phong bì, cành lá màu nước và bụi nhũ vàng.",
    plan: "free",
    coverImage: "/templates/minimal-brown/cover.jpg",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Mùi Cỏ Non",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#5A3A22",
    tone: "bright",
    styleTags: ["Minimal", "Nâu đất", "Tự nhiên"],
  },
  {
    id: "minimal-red",
    name: "Minimal Red",
    subtitle: "Tối giản · Đỏ son",
    description:
      "Tối giản và trang nghiêm: nền đỏ son, khung chỉ vàng tự vẽ, dấu triện sáp để mở thiệp. Không dùng ảnh bìa hay ảnh chân dung — chỉ có album ảnh.",
    plan: "free",
    coverImage: "/templates/minimal-red/cover.jpg",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Khúc Tĩnh Tại",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#E1BC7C",
    tone: "dark",
    styleTags: ["Minimal", "Đỏ son", "Hoàng kim"],
  },
  {
    id: "do-ruou-vang",
    name: "Đỏ Rượu Vang",
    subtitle: "Đỏ Rượu Vang · Hoàng Kim II",
    description:
      "Sắc rượu vang trầm với hoa hồng vàng, ánh sao bốn cánh và khung viền kép kiểu châu Âu; có đếm ngược tới giờ cưới.",
    plan: "free",
    coverImage: "/templates/do-ruou-vang/cover.jpg",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Valse Rượu Vang",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#E5C787",
    tone: "dark",
    styleTags: ["Rượu vang", "Champagne", "Hoa hồng"],
  },
  {
    id: "long-phung",
    name: "Long Phụng",
    subtitle: "Long Phụng · Cung đình",
    description:
      "Rồng chầu phượng múa bằng nét vàng kim trên nền nhung đỏ trầm, khung vòm cung đình và lịch trình lễ do bạn tự sửa trong dashboard.",
    plan: "free",
    coverImage: "/templates/long-phung/cover.jpg",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Khúc Ca Long Phụng",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#E9CE91",
    tone: "dark",
    styleTags: ["Long Phụng", "Cung đình", "Đỏ nhung"],
  },
  {
    id: "do-truyen-thong",
    name: "Đỏ - Truyền thống",
    subtitle: "Song hỷ · Truyền thống",
    description:
      "Cổng đỏ song hỷ mở ra thiệp cưới truyền thống: khung chỉ vàng, ảnh vòm, album coverflow và lịch trình lễ do bạn tự sửa trong dashboard.",
    plan: "free",
    coverImage: "/templates/do-truyen-thong/cover.jpg",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Khúc Ca Ngày Cưới",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#800000",
    tone: "dark",
    styleTags: ["Song Hỷ", "Đỏ truyền thống", "Áo dài"],
  },
  {
    id: "song-hy-v2-do",
    name: "Song Hỷ Đỏ",
    subtitle: "May mắn · Song Hỷ",
    description:
      "Chữ Song Hỷ đỏ son truyền thống phối sắc vàng kim rạng ngời, cầu chúc trăm năm tình nghĩa mặn nồng.",
    plan: "free",
    coverImage: "/templates/song-hy-v2-do/cover.svg",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Khúc Ca Song Hỷ",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#FFE8A4",
    tone: "dark",
    styleTags: ["Song Hỷ", "May mắn", "Đỏ son"],
  },
  {
    id: "song-phung-xanh",
    name: "Song Phụng Xanh",
    subtitle: "Quý phái · Song Phụng",
    description:
      "Đôi chim phụng hoàng sải cánh trong khu vườn ngọc bích, biểu trưng cho tình yêu trường tồn và gắn kết.",
    plan: "free",
    coverImage: "/templates/song-phung-xanh/cover.svg",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Vũ Điệu Phụng Hoàng",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#D4AF37",
    tone: "dark",
    styleTags: ["Song Phụng", "Quý phái", "Ngọc bích"],
  },
  {
    id: "to-duyen-do-dam",
    name: "Tơ Duyên Đỏ Đậm",
    subtitle: "Nồng nàn · Dải lụa đỏ",
    description:
      "Dải lụa hoa phong quỳ đỏ rượu vang quyến rũ, kết nối duyên nợ ngàn năm trong không gian trang trọng.",
    plan: "free",
    coverImage: "/templates/to-duyen-do-dam/cover.svg",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Tơ Duyên Nồng Nàn",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#F3DFC3",
    tone: "dark",
    styleTags: ["Tơ duyên", "Rượu vang", "Lụa đỏ"],
  },
  {
    id: "to-duyen-hong",
    name: "Tơ Duyên Hồng",
    subtitle: "Thơ mộng · Sen hồng",
    description:
      "Hoa sen hồng dải lụa mềm mại tối giản, mang nét duyên dáng thuần Việt và thanh tân của đôi lứa.",
    plan: "free",
    coverImage: "/templates/to-duyen-hong/cover.svg",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Hương Sen Chung Đôi",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#FCE8EC",
    tone: "bright",
    styleTags: ["Hoa sen", "Sen hồng", "Thanh tân"],
  },
  {
    id: "vuon-xuan-do",
    name: "Vườn Xuân Đỏ",
    subtitle: "Ấm áp · Vườn xuân",
    description:
      "Hoa cỏ mùa xuân nở rộ trong sắc đỏ san hô tươi sáng, lan tỏa niềm hân hoan rạng rỡ của ngày trọng đại.",
    plan: "free",
    coverImage: "/templates/vuon-xuan-do/cover.svg",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Khúc Ca Mùa Xuân",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#F5C4C8",
    tone: "bright",
    styleTags: ["Vườn xuân", "San hô", "Hoa cỏ"],
  },
  {
    id: "vuon-xuan-xanh",
    name: "Vườn Xuân Xanh",
    subtitle: "Tươi mát · Cỏ cây",
    description:
      "Sắc xanh thảo mộc mát lành kết hợp hoa cỏ tinh khôi, gợi cảm giác bình yên và khởi đầu mới đong đầy hy vọng.",
    plan: "free",
    coverImage: "/templates/vuon-xuan-xanh/cover.svg",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Giai Điệu Thảo Mộc",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#BDCDC1",
    tone: "neutral",
    styleTags: ["Thảo mộc", "Tươi mát", "Bình yên"],
  },
  {
    id: "vuonkinh-xanh-nhat",
    name: "Vườn Kính Xanh Nhạt",
    subtitle: "Châu Âu · Nhà kính",
    description:
      "Phong cách nhà kính Châu Âu với tông xanh ô liu pastel dịu nhẹ, ánh nắng xuyên qua khung kính lãng mạn.",
    plan: "free",
    coverImage: "/templates/vuonkinh-xanh-nhat/cover.svg",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Nắng Sớm Nhà Kính",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#E9EDD3",
    tone: "neutral",
    styleTags: ["Nhà kính", "Châu Âu", "Xanh pastel"],
  },
  {
    id: "vuonkinh-xanh",
    name: "Vườn Kính Xanh",
    subtitle: "Lãng mạn · Dạ yến nhà kính",
    description:
      "Không gian dạ tiệc nhà kính ngập tràn cây lá nhiệt đới, sắc xanh rêu đậm sâu lắng và huyền ảo.",
    plan: "free",
    coverImage: "/templates/vuonkinh-xanh/cover.svg",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Dạ Khúc Vườn Kính",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#A9C5A0",
    tone: "dark",
    styleTags: ["Vườn kính", "Dạ tiệc", "Huyền ảo"],
  },
];

export const HERO_PREVIEW_TEMPLATES: WeddingTemplateMeta[] = TEMPLATE_REGISTRY.filter(
  (tpl) => !tpl.isPlaceholder
);

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
  return TEMPLATE_REGISTRY.find((tpl) => tpl.id === templateId);
}

export function canPlanUseTemplate(
  userPlan: WeddingPlan,
  templatePlan: WeddingPlan
): boolean {
  return isTemplateAllowedForPlan(userPlan, templatePlan);
}

