export type WeddingScaleId = "intimate" | "standard" | "both_sides";
export type ChecklistMilestoneId = "6m" | "3m" | "1m" | "1w" | "day0";
export type TaskOwnerSide = "both" | "groom" | "bride";

export interface ChecklistMilestoneDef {
  id: ChecklistMilestoneId;
  label: string;
  offsetDays: number;
  summary: string;
}

export interface ChecklistTaskItem {
  id: string;
  milestone: ChecklistMilestoneId;
  title: string;
  owner: TaskOwnerSide;
  scales: readonly WeddingScaleId[];
  detail: string;
  suggestedToolLabel?: string;
  suggestedToolHref?: string;
}

export interface MilestoneWithDueDate extends ChecklistMilestoneDef {
  dueDateIso: string;
  dueDateDisplay: string;
}

export const WEDDING_SCALES: ReadonlyArray<{
  id: WeddingScaleId;
  label: string;
  hint: string;
}> = [
  {
    id: "intimate",
    label: "Thân mật gia đình",
    hint: "Quy mô gọn dưới 80 khách tại một điểm tổ chức.",
  },
  {
    id: "standard",
    label: "Tiệc nhà hàng tiêu chuẩn",
    hint: "Gia tiên sáng + tiệc chiêu đãi nhà hàng (150–350 khách).",
  },
  {
    id: "both_sides",
    label: "Cả hai họ hai nơi",
    hint: "Tách riêng Lễ Vu Quy nhà gái & Lễ Thành Hôn nhà trai khác tỉnh/ngày.",
  },
] as const;

export const CHECKLIST_MILESTONES: readonly ChecklistMilestoneDef[] = [
  {
    id: "6m",
    label: "Trước 6 tháng",
    offsetDays: -180,
    summary: "Chốt ngày lành, ngân sách tổng và giữ chỗ nhà hàng / ekip chính.",
  },
  {
    id: "3m",
    label: "Trước 3 tháng",
    offsetDays: -90,
    summary: "Lên danh sách khách mời hai họ, chuẩn bị trang phục và nhẫn cưới.",
  },
  {
    id: "1m",
    label: "Trước 1 tháng",
    offsetDays: -30,
    summary: "Phát hành thiệp cưới, chốt mâm quả gia tiên và đặt xe đón dâu.",
  },
  {
    id: "1w",
    label: "Trước 1 tuần",
    offsetDays: -7,
    summary: "Nhắc RSVP, khóa số bàn cứng với nhà hàng và kiểm tra âm thanh LED.",
  },
  {
    id: "day0",
    label: "Ngày cưới",
    offsetDays: 0,
    summary: "Rà soát giờ rước dâu, phong bì lễ đen, đội ngũ đón khách tại sảnh.",
  },
] as const;

export const DEFAULT_CHECKLIST_TASKS: readonly ChecklistTaskItem[] = [
  {
    id: "m6-date",
    milestone: "6m",
    title: "Thống nhất ngày ăn hỏi, Lễ Vu Quy và Lễ Thành Hôn (Dương & Âm lịch)",
    owner: "both",
    scales: ["intimate", "standard", "both_sides"],
    detail: "Hai gia đình gặp mặt bàn ngày giờ đẹp để giữ lịch sảnh và xe cộ.",
    suggestedToolLabel: "Đổi ngày âm lịch",
    suggestedToolHref: "/cong-cu/doi-am-lich",
  },
  {
    id: "m6-budget",
    milestone: "6m",
    title: "Dự trù tổng ngân sách tiệc, số bàn dự kiến và khoản dự phòng 10%",
    owner: "both",
    scales: ["intimate", "standard", "both_sides"],
    detail: "Tính trước chi phí thực đơn theo đầu người để chốt quy mô khách mời hợp lý.",
    suggestedToolLabel: "Bảng tính chi phí cưới",
    suggestedToolHref: "/cong-cu/bang-tinh-dam-cuoi",
  },
  {
    id: "m6-venue-main",
    milestone: "6m",
    title: "Khảo sát và đặt cọc nhà hàng / sảnh tiệc chính",
    owner: "both",
    scales: ["intimate", "standard", "both_sides"],
    detail: "Thỏa thuận rõ chính sách bàn chờ dự phòng và chi phí âm thanh màn hình LED.",
  },
  {
    id: "m6-venue-split",
    milestone: "6m",
    title: "Đặt riêng địa điểm đãi tiệc bên nhà gái (Vu Quy) và bên nhà trai (Thành Hôn)",
    owner: "both",
    scales: ["both_sides"],
    detail: "Nếu hai nhà cách tỉnh xa, chốt lịch tách ngày hoặc cách nhau tối thiểu 1 buổi.",
  },
  {
    id: "m6-studio",
    milestone: "6m",
    title: "Chọn ekip chụp ảnh phóng sự cưới, quay phim và trang điểm cô dâu",
    owner: "both",
    scales: ["intimate", "standard", "both_sides"],
    detail: "Đặt sớm để giữ đúng thợ trang điểm chính vào khung giờ sáng sớm.",
  },
  {
    id: "m3-guests",
    milestone: "3m",
    title: "Lập danh sách khách mời hai họ, phân buổi lễ và xếp cụm bàn dự kiến",
    owner: "both",
    scales: ["intimate", "standard", "both_sides"],
    detail: "Tách rõ họ hàng nhà trai, nhà gái, đồng nghiệp và bạn bè kèm số người đi cùng.",
    suggestedToolLabel: "Lập danh sách khách mời",
    suggestedToolHref: "/cong-cu/tao-danh-sach-khach-moi",
  },
  {
    id: "m3-attire",
    milestone: "3m",
    title: "Thử váy cưới, may/thuê áo dài ăn hỏi và vest chú rể",
    owner: "both",
    scales: ["intimate", "standard", "both_sides"],
    detail: "Đặt sớm để có thời gian chỉnh sửa số đo vừa vặn trước ngày cưới 2 tuần.",
  },
  {
    id: "m3-rings",
    milestone: "3m",
    title: "Chọn và đặt khắc tên ngày cưới lên cặp nhẫn cưới",
    owner: "groom",
    scales: ["intimate", "standard", "both_sides"],
    detail: "Đặt trước ít nhất 4–6 tuần nếu chọn mẫu thiết kế riêng hoặc khắc chữ.",
  },
  {
    id: "m3-bride-dowry",
    milestone: "3m",
    title: "Chuẩn bị trang trí bàn gia tiên nhà gái và danh sách đội bê tráp nữ",
    owner: "bride",
    scales: ["standard", "both_sides"],
    detail: "Chốt số lượng đội phù dâu tương ứng với số tráp lễ nhà trai mang sang.",
  },
  {
    id: "m3-groom-traps",
    milestone: "3m",
    title: "Thống nhất số lượng mâm quả lễ vật và đội bưng tráp nam bên nhà trai",
    owner: "groom",
    scales: ["standard", "both_sides"],
    detail: "Chuẩn bị sẵn áo dài đồng phục và lịch tập trung sáng ăn hỏi / đón dâu.",
  },
  {
    id: "m1-invite-online",
    milestone: "1m",
    title: "Tạo thiệp cưới online cá nhân hóa tên khách và soạn lời mời Zalo",
    owner: "both",
    scales: ["intimate", "standard", "both_sides"],
    detail: "Dán danh sách khách để tự sinh link mời kèm bản đồ Google Maps và nút RSVP.",
    suggestedToolLabel: "Tạo thiệp cưới miễn phí",
    suggestedToolHref: "/tao-thiep",
  },
  {
    id: "m1-invite-paper",
    milestone: "1m",
    title: "Đặt in thiệp giấy cho ông bà, họ hàng gần, thông gia và sếp văn phòng",
    owner: "both",
    scales: ["intimate", "standard", "both_sides"],
    detail: "Gắn thêm mã QR bản đồ nhà hàng lên thiệp giấy để khách ở xa tìm đường nhanh.",
  },
  {
    id: "m1-zalo-send",
    milestone: "1m",
    title: "Gọi điện cho người lớn tuổi ở xa và nhắn tin Zalo 1-1 gửi thiệp bạn bè",
    owner: "both",
    scales: ["intimate", "standard", "both_sides"],
    detail: "Phát thiệp trước tiệc tối thiểu 10–14 ngày (khách ở xa báo trước 3 tuần).",
    suggestedToolLabel: "Soạn lời mời Zalo",
    suggestedToolHref: "/cong-cu/tao-loi-moi-zalo",
  },
  {
    id: "m1-transport",
    milestone: "1m",
    title: "Đặt xe hoa rước dâu và xe đưa đón họ hàng hai bên",
    owner: "groom",
    scales: ["standard", "both_sides"],
    detail: "Chốt rõ lộ trình, biển số xe và số điện thoại tài xế cho người điều phối.",
  },
  {
    id: "m1-health",
    milestone: "1m",
    title: "Thử thực đơn nhà hàng (nếu có) và chốt phương án món chay cho khách",
    owner: "both",
    scales: ["standard", "both_sides"],
    detail: "Tổng hợp ghi chú ăn kiêng / ăn chay từ form RSVP để báo trước với bếp.",
  },
  {
    id: "w1-rsvp",
    milestone: "1w",
    title: "Nhắn nhắc RSVP nhẹ nhàng cho khách chưa phản hồi và chốt số bàn cứng",
    owner: "both",
    scales: ["intimate", "standard", "both_sides"],
    detail: "Khóa số mâm chính thức trước ngày đãi tiệc 3–5 ngày kèm 5%–10% bàn chờ.",
  },
  {
    id: "w1-led-sound",
    milestone: "1w",
    title: "Chép USB nhạc lễ đường, video ảnh cưới và test trực tiếp trên màn LED sảnh",
    owner: "both",
    scales: ["standard", "both_sides"],
    detail: "Kiểm tra cả micro MC và nhạc nền lúc đón khách để tránh lỗi kỹ thuật giờ chót.",
  },
  {
    id: "w1-envelopes",
    milestone: "1w",
    title: "Đổi tiền mặt chia sẵn phong bì lễ đen, tiền lì xì bưng quả và bồi dưỡng ekip",
    owner: "both",
    scales: ["intimate", "standard", "both_sides"],
    detail: "Ghi rõ tên mục bên ngoài phong bì để người đại diện phát không bị nhầm.",
  },
  {
    id: "w1-rehearsal",
    milestone: "1w",
    title: "Thống nhất người phát biểu đại diện hai họ và phân công người giữ thùng mừng",
    owner: "both",
    scales: ["intimate", "standard", "both_sides"],
    detail: "Gửi run-sheet kịch bản giờ giấc cho MC, nhiếp ảnh gia và trưởng đoàn hai bên.",
  },
  {
    id: "d0-breakfast",
    milestone: "day0",
    title: "Ăn sáng đủ chất trước khi trang điểm và kiểm tra nhẫn cưới, hoa cầm tay",
    owner: "both",
    scales: ["intimate", "standard", "both_sides"],
    detail: "Chuẩn bị sẵn túi đồ dự phòng: giày đế bệt, kim chỉ, băng cá nhân.",
  },
  {
    id: "d0-reception",
    milestone: "day0",
    title: "Bố trí người trực bàn đón khách và bảng tra cứu bàn tiệc tại cửa sảnh",
    owner: "both",
    scales: ["intimate", "standard", "both_sides"],
    detail: "Giúp khách mời ổn định đúng bàn ngồi nhanh chóng trong khung giờ cao điểm.",
  },
];

export function formatIsoDateVi(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return isoDate;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function addDaysToIsoDate(isoDate: string, deltaDays: number): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day + deltaDays));
  if (Number.isNaN(utc.getTime())) return "";
  const y = String(utc.getUTCFullYear()).padStart(4, "0");
  const m = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const d = String(utc.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function computeDaysRemaining(weddingIso: string, todayIso: string): number | null {
  const wMatch = weddingIso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const tMatch = todayIso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!wMatch || !tMatch) return null;
  const wMs = Date.UTC(Number(wMatch[1]), Number(wMatch[2]) - 1, Number(wMatch[3]));
  const tMs = Date.UTC(Number(tMatch[1]), Number(tMatch[2]) - 1, Number(tMatch[3]));
  return Math.round((wMs - tMs) / 86_400_000);
}

export function buildMilestonesWithDates(
  weddingDateIso: string,
): MilestoneWithDueDate[] {
  return CHECKLIST_MILESTONES.map((milestone) => {
    const dueIso = weddingDateIso
      ? addDaysToIsoDate(weddingDateIso, milestone.offsetDays)
      : "";
    return {
      ...milestone,
      dueDateIso: dueIso,
      dueDateDisplay: dueIso ? formatIsoDateVi(dueIso) : "Chọn ngày cưới để tính hạn",
    };
  });
}

export function getTasksForScale(scale: WeddingScaleId): ChecklistTaskItem[] {
  return DEFAULT_CHECKLIST_TASKS.filter((task) => task.scales.includes(scale));
}

export function getOwnerSideLabel(owner: TaskOwnerSide): string {
  if (owner === "groom") return "Nhà trai";
  if (owner === "bride") return "Nhà gái";
  return "Cả hai bên";
}

function escapeCsvCell(raw: string): string {
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export interface CsvExportRow {
  milestoneLabel: string;
  dueDateDisplay: string;
  title: string;
  owner: TaskOwnerSide;
  done: boolean;
  detail: string;
}

export function buildWeddingChecklistCsv(rows: readonly CsvExportRow[]): string {
  const header = [
    "Mốc thời gian",
    "Hạn hoàn thành",
    "Đầu việc cần chuẩn bị",
    "Phụ trách",
    "Trạng thái",
    "Ghi chú",
  ];
  const lines = [
    header.map(escapeCsvCell).join(","),
    ...rows.map((row) =>
      [
        row.milestoneLabel,
        row.dueDateDisplay,
        row.title,
        getOwnerSideLabel(row.owner),
        row.done ? "Đã xong" : "Chưa xong",
        row.detail,
      ]
        .map(escapeCsvCell)
        .join(","),
    ),
  ];
  return `\uFEFF${lines.join("\r\n")}`;
}
