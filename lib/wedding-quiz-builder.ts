export type QuizTopicId = "all" | "love_story" | "daily_habits" | "best_friends";

export type QuizOutputMode = "mc_script" | "group_chat" | "story_card";

export interface QuizQuestionTemplate {
  id: string;
  topic: Exclude<QuizTopicId, "all">;
  promptTemplate: string;
  optionsTemplate: [string, string, string, string];
  defaultCorrectIndex: number;
  mcNote: string;
}

export interface QuizQuestionItem {
  id: string;
  topic: Exclude<QuizTopicId, "all">;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: number;
  selected: boolean;
  mcNote: string;
}

export interface QuizBuilderConfig {
  groomName: string;
  brideName: string;
  topic: QuizTopicId;
  outputMode: QuizOutputMode;
}

export const QUIZ_TOPIC_OPTIONS: ReadonlyArray<{
  id: QuizTopicId;
  label: string;
  description: string;
}> = [
  {
    id: "all",
    label: "Tổng hợp hài hòa (Khuyên dùng)",
    description: "Kết hợp câu chuyện tình yêu, thói quen và vài câu vui cho hội bạn thân.",
  },
  {
    id: "love_story",
    label: "Chuyện tình & Kỷ niệm",
    description: "Lần đầu gặp mặt, lời tỏ tình và cột mốc đáng nhớ trước ngày cưới.",
  },
  {
    id: "daily_habits",
    label: "Thói quen & Ai hiểu hơn",
    description: "Khẩu vị ăn uống, thói quen sinh hoạt và người hay nhường nhịn hơn.",
  },
  {
    id: "best_friends",
    label: "Hội bạn thân & Lầy lội vừa tầm",
    description: "Câu đố dí dỏm khuấy động bàn bạn đại học, đồng nghiệp trẻ.",
  },
];

const QUESTION_BANK: readonly QuizQuestionTemplate[] = [
  {
    id: "q-first-meet",
    topic: "love_story",
    promptTemplate: "{groom} và {bride} gặp nhau lần đầu tiên ở đâu?",
    optionsTemplate: [
      "Tại trường học / câu lạc bộ",
      "Qua công việc hoặc dự án chung",
      "Bạn bè mai mối trong buổi tụ tập",
      "Quen nhau qua mạng xã hội",
    ],
    defaultCorrectIndex: 1,
    mcNote: "Gợi ý cặp đôi kể lại 2 câu ngắn về ấn tượng đầu tiên.",
  },
  {
    id: "q-first-confess",
    topic: "love_story",
    promptTemplate: "Ai là người chủ động bắt chuyện và ngỏ lời trước?",
    optionsTemplate: [
      "{groom} chủ động tấn công trước",
      "{bride} bật đèn xanh trước",
      "Cả hai tự nhiên hiểu ý nhau",
      "Do hội bạn thân đẩy thuyền thành công",
    ],
    defaultCorrectIndex: 0,
    mcNote: "Rất dễ gây cười nếu thực tế ngược lại vẻ ngoài của hai bạn.",
  },
  {
    id: "q-anniversary-month",
    topic: "love_story",
    promptTemplate: "Hai nhân vật chính đã đồng hành cùng nhau bao lâu trước khi về chung một nhà?",
    optionsTemplate: [
      "Khoảng 1 năm",
      "Khoảng 2–3 năm",
      "Khoảng 4–5 năm",
      "Trên 5 năm bền bỉ",
    ],
    defaultCorrectIndex: 1,
    mcNote: "Nhắc tên vài người bạn chứng kiến từ những ngày đầu.",
  },
  {
    id: "q-proposal-spot",
    topic: "love_story",
    promptTemplate: "Màn cầu hôn đáng nhớ của {groom} & {bride} diễn ra vào dịp nào?",
    optionsTemplate: [
      "Trong một chuyến du lịch xa",
      "Buổi tối kỷ niệm riêng tư của hai người",
      "Bất ngờ trước mặt hội bạn thân",
      "Đơn giản ấm cúng tại gia đình",
    ],
    defaultCorrectIndex: 0,
    mcNote: "Có thể chiếu kèm 1 bức ảnh cầu hôn lên màn hình LED nếu có.",
  },
  {
    id: "q-who-sorry-first",
    topic: "daily_habits",
    promptTemplate: "Mỗi khi có bất đồng nhỏ, ai thường là người làm hòa trước?",
    optionsTemplate: [
      "Luôn là {groom} dỗ dành trước",
      "{bride} chủ động bắt chuyện lại",
      "Ai sai người đó xin lỗi, không cố chấp",
      "Rủ nhau đi ăn ngon là tự hết giận",
    ],
    defaultCorrectIndex: 0,
    mcNote: "Hỏi nhanh bàn họ hàng xem có đoán giống đáp án cặp đôi không.",
  },
  {
    id: "q-favorite-food",
    topic: "daily_habits",
    promptTemplate: "Món ăn chung mà cuối tuần nào {groom} và {bride} cũng dễ rủ nhau đi ăn nhất là gì?",
    optionsTemplate: [
      "Lẩu / Nướng tụ tập bạn bè",
      "Ốc hoặc món ăn vặt vỉa hè",
      "Cà phê sáng + bánh mì truyền thống",
      "Đồ ăn nhà nấu cuối tuần",
    ],
    defaultCorrectIndex: 1,
    mcNote: "Cô dâu chú rể chỉnh lại đúng món tủ thật của hai bạn trước tiệc.",
  },
  {
    id: "q-finance-keeper",
    topic: "daily_habits",
    promptTemplate: "Sau ngày hôm nay, ai sẽ giữ tay hòm chìa khóa tài chính gia đình?",
    optionsTemplate: [
      "{bride} quản lý toàn quyền",
      "{groom} giữ quỹ chung",
      "Góp chung một quỹ, giữ riêng khoản chi tiêu cá nhân",
      "Thay phiên nhau giữ theo tháng",
    ],
    defaultCorrectIndex: 0,
    mcNote: "Câu này gần như sảnh tiệc nào cũng vỗ tay rần rần.",
  },
  {
    id: "q-morning-person",
    topic: "daily_habits",
    promptTemplate: "Giữa hai người, ai thường xuyên thức dậy sớm hơn và giục người kia chuẩn bị?",
    optionsTemplate: [
      "{groom} luôn dậy sớm pha trà / cà phê",
      "{bride} lúc nào cũng sẵn sàng đúng giờ",
      "Cả hai cùng ngủ nướng đến sát giờ",
      "Tùy hôm đi làm hay đi chơi",
    ],
    defaultCorrectIndex: 1,
    mcNote: "Vui nhẹ nhàng, hợp cả ông bà cô chú ở bàn trên.",
  },
  {
    id: "q-bestie-secret",
    topic: "best_friends",
    promptTemplate: "Ai trong hai người dễ khóc xúc động hơn khi xem phim hoặc nghe lời cảm ơn ngày cưới?",
    optionsTemplate: [
      "{bride} mít ướt chính hiệu",
      "Tưởng mạnh mẽ nhưng {groom} mới là người dễ rưng rưng",
      "Cả hai đều bình tĩnh cười rất tươi",
      "Chưa kịp khóc thì hội bạn dưới sảnh đã hò reo",
    ],
    defaultCorrectIndex: 1,
    mcNote: "Câu đố đảo ngược kỳ vọng tạo tiếng cười rất tự nhiên.",
  },
  {
    id: "q-travel-style",
    topic: "best_friends",
    promptTemplate: "Khi đi du lịch chung với hội bạn, vai trò quen thuộc của {groom} & {bride} là gì?",
    optionsTemplate: [
      "Lên lịch trình chi tiết và đặt vé cho cả đoàn",
      "Phụ trách chụp ảnh đẹp không biết mệt",
      "Chỉ cần có mặt đúng giờ, ăn gì cũng gật đầu",
      "Giữ quỹ nhóm và tính chia tiền siêu nhanh",
    ],
    defaultCorrectIndex: 0,
    mcNote: "Nhờ hội bạn dưới bàn giơ tay xác nhận xem đúng không.",
  },
  {
    id: "q-lucky-song",
    topic: "best_friends",
    promptTemplate: "Hoạt động cuối tuần yêu thích nhất của {groom} và {bride} khi ở nhà là gì?",
    optionsTemplate: [
      "Cùng nấu ăn và thử công thức mới",
      "Cày phim bộ xuyên trưa",
      "Chạy bộ hoặc thể thao buổi sáng",
      "Dọn nhà và trồng cây ban công",
    ],
    defaultCorrectIndex: 0,
    mcNote: "Dễ chỉnh nhanh theo đúng sở thích thật của hai bạn.",
  },
  {
    id: "q-honeymoon",
    topic: "love_story",
    promptTemplate: "Điểm đến mơ ước cho tuần trăng mật hoặc chuyến đi riêng của cặp đôi là đâu?",
    optionsTemplate: [
      "Biển xanh nghỉ dưỡng trong nước (Phú Quốc / Nha Trang)",
      "Khí hậu mát lạnh Đà Lạt / Sapa",
      "Du lịch nước ngoài khám phá văn hóa",
      "Chưa cần đi ngay, ưu tiên nghỉ ngơi cùng gia đình trước",
    ],
    defaultCorrectIndex: 2,
    mcNote: "Bật mí kế hoạch sau cưới để bạn bè chúc mừng thêm.",
  },
];

export function applyCoupleNames(text: string, groomName: string, brideName: string): string {
  const groom = groomName.trim() || "Chú rể";
  const bride = brideName.trim() || "Cô dâu";
  return text.replace(/\{groom\}/g, groom).replace(/\{bride\}/g, bride);
}

export function buildQuizQuestionsForTopic(
  topic: QuizTopicId,
  groomName: string,
  brideName: string,
): QuizQuestionItem[] {
  const filtered =
    topic === "all"
      ? QUESTION_BANK
      : QUESTION_BANK.filter((item) => item.topic === topic);

  return filtered.map((item, idx) => ({
    id: item.id,
    topic: item.topic,
    prompt: applyCoupleNames(item.promptTemplate, groomName, brideName),
    options: [
      applyCoupleNames(item.optionsTemplate[0], groomName, brideName),
      applyCoupleNames(item.optionsTemplate[1], groomName, brideName),
      applyCoupleNames(item.optionsTemplate[2], groomName, brideName),
      applyCoupleNames(item.optionsTemplate[3], groomName, brideName),
    ],
    correctIndex: item.defaultCorrectIndex,
    selected: topic === "all" ? idx < 8 : true,
    mcNote: item.mcNote,
  }));
}

export function formatMcScriptText(
  config: QuizBuilderConfig,
  questions: readonly QuizQuestionItem[],
): string {
  const active = questions.filter((q) => q.selected);
  const groom = config.groomName.trim() || "Chú rể";
  const bride = config.brideName.trim() || "Cô dâu";
  const optionLetters = ["A", "B", "C", "D"] as const;

  const header = [
    `KỊCH BẢN MINIGAME: BẠN HIỂU ${groom.toUpperCase()} & ${bride.toUpperCase()} BAO NHIÊU %?`,
    `Tổng số câu: ${active.length} câu (thời lượng dự kiến ${Math.max(5, active.length)}–${active.length * 2} phút)`,
    "",
    `Lời dẫn mở màn: "Kính thưa quý vị, để không khí sảnh tiệc thêm rộn ràng trong lúc dùng bữa, xin mời các bàn cùng thử tài xem ai hiểu ${groom} và ${bride} nhất nhé!"`,
    "",
  ];

  const body = active.flatMap((q, index) => {
    const answerLabel = `${optionLetters[q.correctIndex]}. ${q.options[q.correctIndex]}`;
    return [
      `Câu ${index + 1}: ${q.prompt}`,
      ...q.options.map((opt, oIdx) => `  ${optionLetters[oIdx]}. ${opt}`),
      `  -> Đáp án đúng: ${answerLabel}`,
      q.mcNote ? `  -> Gợi ý MC: ${q.mcNote}` : "",
      "",
    ].filter(Boolean);
  });

  return [...header, ...body].join("\n");
}

export function formatGroupChatQuizText(
  config: QuizBuilderConfig,
  questions: readonly QuizQuestionItem[],
): string {
  const active = questions.filter((q) => q.selected);
  const groom = config.groomName.trim() || "Chú rể";
  const bride = config.brideName.trim() || "Cô dâu";
  const optionLetters = ["A", "B", "C", "D"] as const;

  const lines = [
    `MINI QUIZ TRƯỚC GIỜ CƯỚI: ĐOÁN XEM BẠN HIỂU ${groom.toUpperCase()} & ${bride.toUpperCase()} ĐẾN ĐÂU?`,
    `Thả bình luận đáp án đúng nhiều nhất để nhận quà tại tiệc nha!`,
    "",
  ];

  active.forEach((q, idx) => {
    lines.push(`${idx + 1}. ${q.prompt}`);
    q.options.forEach((opt, oIdx) => {
      lines.push(`   ${optionLetters[oIdx]}. ${opt}`);
    });
    lines.push("");
  });

  return lines.join("\n").trim();
}

export function drawQuizStoryCard(
  ctx: CanvasRenderingContext2D,
  config: QuizBuilderConfig,
  question: QuizQuestionItem,
  questionNumber: number,
  totalSelected: number,
  revealAnswer: boolean,
): void {
  const w = 1080;
  const h = 1920;
  ctx.clearRect(0, 0, w, h);

  // Editorial warm ivory gradient background
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#FBF8F3");
  grad.addColorStop(1, "#EFE5D6");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Decorative outer frame
  ctx.strokeStyle = "#B89B72";
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, 48, 48, w - 96, h - 96, 36);
  ctx.stroke();

  const groom = config.groomName.trim() || "Chú rể";
  const bride = config.brideName.trim() || "Cô dâu";

  // Top label
  ctx.textAlign = "center";
  ctx.fillStyle = "#8A6D3B";
  ctx.font = '700 26px "Be Vietnam Pro", ui-sans-serif, system-ui, sans-serif';
  ctx.fillText(`MINI QUIZ · ${groom.toUpperCase()} & ${bride.toUpperCase()}`, w / 2, 160, w - 160);

  // Question counter pill
  const pillText = `CÂU HỎI ${questionNumber} / ${totalSelected}`;
  ctx.fillStyle = "#7A1C24";
  drawRoundedRect(ctx, w / 2 - 170, 210, 340, 58, 29);
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = '700 24px "Be Vietnam Pro", ui-sans-serif, system-ui, sans-serif';
  ctx.fillText(pillText, w / 2, 248);

  // Wrapped question headline
  ctx.fillStyle = "#1F1D1A";
  ctx.font = '600 54px "Cormorant Garamond", "Lora", Georgia, serif';
  const promptLines = wrapCanvasText(ctx, question.prompt, w - 200);
  let y = 370;
  for (const line of promptLines.slice(0, 4)) {
    ctx.fillText(line, w / 2, y);
    y += 72;
  }

  // Option cards A B C D
  const letters = ["A", "B", "C", "D"] as const;
  let cardY = Math.max(660, y + 60);
  const cardX = 110;
  const cardW = w - 220;
  const cardH = 165;

  question.options.forEach((opt, idx) => {
    const isCorrect = revealAnswer && idx === question.correctIndex;
    ctx.fillStyle = isCorrect ? "#7A1C24" : "#FFFFFF";
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 24);
    ctx.fill();

    ctx.strokeStyle = isCorrect ? "#7A1C24" : "#E8E2D9";
    ctx.lineWidth = 3;
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 24);
    ctx.stroke();

    // Letter badge
    ctx.fillStyle = isCorrect ? "#E3C37A" : "#FAF8F5";
    drawRoundedRect(ctx, cardX + 28, cardY + 50, 64, 64, 18);
    ctx.fill();

    ctx.textAlign = "center";
    ctx.fillStyle = isCorrect ? "#1F1D1A" : "#7A1C24";
    ctx.font = '700 28px "Be Vietnam Pro", ui-sans-serif, system-ui, sans-serif';
    ctx.fillText(letters[idx], cardX + 60, cardY + 92);

    // Option text (wrapped up to 2 lines)
    ctx.textAlign = "left";
    ctx.fillStyle = isCorrect ? "#FFFFFF" : "#1F1D1A";
    ctx.font = '500 32px "Be Vietnam Pro", ui-sans-serif, system-ui, sans-serif';
    const optLines = wrapCanvasText(ctx, opt, cardW - 140);
    if (optLines.length === 1) {
      ctx.fillText(optLines[0], cardX + 114, cardY + 93);
    } else {
      ctx.fillText(optLines[0], cardX + 114, cardY + 72);
      ctx.fillText(optLines[1], cardX + 114, cardY + 118);
    }

    cardY += cardH + 28;
  });

  // Footer cue + watermark
  ctx.textAlign = "center";
  ctx.fillStyle = "#6B655E";
  ctx.font = '500 26px "Be Vietnam Pro", ui-sans-serif, system-ui, sans-serif';
  ctx.fillText(
    revealAnswer ? "Đáp án chính xác từ Cô dâu & Chú rể" : "Bình chọn đáp án bạn đoán đúng nhé!",
    w / 2,
    h - 140,
  );

  ctx.fillStyle = "#8A6D3B";
  ctx.font = '500 22px "Be Vietnam Pro", ui-sans-serif, system-ui, sans-serif';
  ctx.fillText("inviwedd.date", w / 2, h - 84);
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}
